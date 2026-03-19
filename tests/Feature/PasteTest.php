<?php

use App\Models\Paste;
use App\Models\User;
use App\Support\PasteMediaManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery\MockInterface;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
    config()->set('filesystems.default_media_disk', 'paste_media');
    config()->set('filesystems.paste_media_cdn_url', null);
    Storage::fake('paste_media');
});

it('allows guests to create a paste', function () {
    $response = $this->from('/paste')->post('/paste', [
        'content' => 'Hello World!',
        'syntax' => 'plaintext',
    ]);

    $paste = Paste::first();

    $response->assertRedirect('/paste');
    $response->assertSessionHas('shortened_link', url('/paste/'.$paste->slug));
    $this->assertDatabaseHas('pastes', [
        'content' => 'Hello World!',
        'syntax' => 'plaintext',
        'user_id' => null,
    ]);
});

it('allows authenticated users to create a paste', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->from('/paste')->post('/paste', [
        'content' => 'Auth Hello World!',
        'slug' => 'auth-paste',
    ]);

    $response->assertRedirect('/paste');
    $response->assertSessionHas('shortened_link', url('/paste/auth-paste'));
    $this->assertDatabaseHas('pastes', [
        'content' => 'Auth Hello World!',
        'slug' => 'auth-paste',
        'user_id' => $user->id,
    ]);
});

it('allows guests to create an image paste', function () {
    $response = $this->from('/paste')->post('/paste', [
        'type' => 'image',
        'slug' => 'kitten-shot',
        'image' => UploadedFile::fake()->image('kitten.png', 320, 240),
    ]);

    $paste = Paste::first();

    $response->assertRedirect('/paste');
    $response->assertSessionHas('shortened_link', url('/paste/kitten-shot'));
    expect($paste->type)
        ->toBe('image')
        ->and($paste->content)->toBeNull()
        ->and($paste->original_filename)->toBe('kitten.png')
        ->and($paste->mime_type)->toContain('image/')
        ->and($paste->image_width)->toBe(320)
        ->and($paste->image_height)->toBe(240);

    Storage::disk('paste_media')->assertExists($paste->storage_path);
});

it('does not create a broken paste record when image upload fails', function () {
    $this->mock(PasteMediaManager::class, function (MockInterface $mock) {
        $mock->shouldReceive('storeUploadedImage')
            ->once()
            ->andThrow(new RuntimeException('Upload failed.'));
    });

    $response = $this->from('/paste')->post('/paste', [
        'type' => 'image',
        'slug' => 'broken-image',
        'image' => UploadedFile::fake()->image('broken.png', 320, 240),
    ]);

    $response->assertRedirect('/paste');
    $response->assertSessionHasErrors('image');
    $this->assertDatabaseCount('pastes', 0);
});

it('shows a friendly error when an upload exceeds the server limit', function () {
    Route::middleware('web')->post('/test-post-too-large', function () {
        throw new PostTooLargeException;
    });

    $response = $this->from('/paste')->post('/test-post-too-large');

    $response->assertRedirect('/paste');
    $response->assertSessionHasErrors('image');
});

it('expires authenticated user pastes in two months', function () {
    $this->travelTo(now()->startOfSecond());

    $user = User::factory()->create();

    $this->actingAs($user)->from('/paste')->post('/paste', [
        'content' => 'Two months please',
        'syntax' => 'plaintext',
    ]);

    $paste = Paste::first();

    expect($paste->expires_at?->toDateTimeString())
        ->toBe(now()->addMonthsNoOverflow(2)->toDateTimeString());
});

it('does not expire admin pastes', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->from('/paste')->post('/paste', [
        'content' => 'Forever paste',
        'syntax' => 'plaintext',
    ]);

    $paste = Paste::first();

    expect($paste->expires_at)->toBeNull();
});

it('validates paste creation requests', function () {
    $response = $this->post('/paste', [
        'content' => '', // Required
    ]);

    $response->assertSessionHasErrors('content');
    $this->assertDatabaseCount('pastes', 0);
});

it('shows the raw text of a paste', function () {
    $paste = Paste::factory()->create([
        'content' => "<?php\nreturn 'Raw text content';",
        'syntax' => 'php',
    ]);

    $response = $this->get('/paste/'.$paste->slug);

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pastes/show')
            ->where('paste.syntax', 'php')
            ->where('paste.raw_url', url('/paste/'.$paste->slug.'/raw'))
            ->where('paste.highlighted_lines.0.0.type', 'keyword')
            ->where('paste.highlighted_lines.1.2.type', 'string')
            ->etc()
        );
});

it('shows image pastes with a raw image url', function () {
    Storage::disk('paste_media')->put('pastes/images/test/example.png', 'image-bytes');

    $paste = Paste::factory()->image()->create([
        'slug' => 'image-paste',
    ]);

    $response = $this->get('/paste/'.$paste->slug);

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pastes/show')
            ->where('paste.type', 'image')
            ->where('paste.image_url', Storage::disk('paste_media')->url('pastes/images/test/example.png'))
            ->etc()
        );
});

it('highlights additional supported syntaxes', function (string $syntax, string $content) {
    $paste = Paste::factory()->create([
        'content' => $content,
        'syntax' => $syntax,
    ]);

    $response = $this->get('/paste/'.$paste->slug);

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pastes/show')
            ->where('paste.syntax', $syntax)
            ->where('paste.highlighted_lines.0.0.type', 'keyword')
            ->etc()
        );
})->with([
    'bash' => ['bash', 'echo "hello"'],
    'powershell' => ['powershell', 'Write-Host "hello"'],
    'rust' => ['rust', 'fn main() {}'],
    'ruby' => ['ruby', 'def greet'],
    'go' => ['go', 'func main() {}'],
    'c' => ['c', 'return 0;'],
    'cpp' => ['cpp', 'return 0;'],
    'csharp' => ['csharp', 'public class Demo {}'],
]);

it('returns raw paste content without ui', function () {
    $paste = Paste::factory()->create(['content' => "#!/bin/sh\necho 'hello'"]);

    $response = $this->get('/paste/'.$paste->slug.'/raw');

    $response->assertSuccessful();
    $response->assertHeader('content-type', 'text/plain; charset=UTF-8');
    expect($response->getContent())->toBe("#!/bin/sh\necho 'hello'");
});

it('redirects image raw requests to the stored media url', function () {
    Storage::disk('paste_media')->put('pastes/images/test/example.png', 'image-bytes');

    $paste = Paste::factory()->image()->create();

    $response = $this->get('/paste/'.$paste->slug.'/raw');

    $response->assertRedirect(Storage::disk('paste_media')->url('pastes/images/test/example.png'));
});

it('does not show expired pastes', function () {
    $paste = Paste::factory()->create([
        'expires_at' => now()->subDay(),
    ]);

    $response = $this->get('/paste/'.$paste->slug);

    $response->assertNotFound();
});

it('does not return raw content for expired pastes', function () {
    $paste = Paste::factory()->create([
        'expires_at' => now()->subDay(),
    ]);

    $response = $this->get('/paste/'.$paste->slug.'/raw');

    $response->assertNotFound();
});

it('allows owners to delete their paste', function () {
    $user = User::factory()->create();
    $paste = Paste::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->delete('/paste/'.$paste->id);

    $response->assertRedirect();
    $this->assertDatabaseMissing('pastes', ['id' => $paste->id]);
});

it('prevents guests from deleting pastes', function () {
    $paste = Paste::factory()->create();

    $response = $this->delete('/paste/'.$paste->id);

    $response->assertForbidden();
    $this->assertDatabaseHas('pastes', ['id' => $paste->id]);
});

it('prevents users from deleting others pastes', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $paste = Paste::factory()->create(['user_id' => $owner->id]);

    $response = $this->actingAs($otherUser)->delete('/paste/'.$paste->id);

    $response->assertForbidden();
    $this->assertDatabaseHas('pastes', ['id' => $paste->id]);
});
