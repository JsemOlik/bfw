<?php

use App\Models\Link;
use App\Models\Paste;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

it('resolves root link slugs to their destination', function () {
    $link = Link::create([
        'original_url' => 'https://example.com/root-link',
        'slug' => 'root-link',
        'expires_at' => now()->addDay(),
    ]);

    $response = $this->get('/'.$link->slug);

    $response->assertRedirect($link->original_url);
    expect($link->fresh()->open_count)->toBe(1);
    $this->assertDatabaseHas('link_daily_opens', [
        'link_id' => $link->id,
        'opened_on' => today()->toDateString(),
        'open_count' => 1,
    ]);
});

it('renders root paste slugs', function () {
    $paste = Paste::factory()->create([
        'slug' => 'root-paste',
        'content' => 'Hello from the root.',
        'syntax' => 'plaintext',
    ]);

    $response = $this->get('/'.$paste->slug);

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pastes/show')
            ->where('paste.slug', $paste->slug)
            ->where('paste.public_url', url('/'.$paste->slug))
            ->etc()
        );

    expect($paste->fresh()->view_count)->toBe(1);
    $this->assertDatabaseHas('paste_daily_views', [
        'paste_id' => $paste->id,
        'viewed_on' => today()->toDateString(),
        'view_count' => 1,
    ]);
});

it('renders root link status pages', function () {
    $link = Link::create([
        'original_url' => 'https://example.com/root-status',
        'slug' => 'root-status-link',
        'expires_at' => now()->addDay(),
    ]);
    $link->forceFill(['open_count' => 3])->save();
    DB::table('link_daily_opens')->insert([
        'link_id' => $link->id,
        'opened_on' => today()->toDateString(),
        'open_count' => 2,
    ]);

    $response = $this->get('/'.$link->slug.'/status');

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('links/status')
            ->where('link.slug', $link->slug)
            ->where('link.public_url', url('/'.$link->slug))
            ->where('link.open_count', 3)
            ->where('link.today_open_count', 2)
            ->etc()
        );
});

it('renders root paste status pages', function () {
    $paste = Paste::factory()->create([
        'slug' => 'root-status-paste',
        'content' => 'Status me.',
    ]);
    $paste->forceFill(['view_count' => 5])->save();
    DB::table('paste_daily_views')->insert([
        'paste_id' => $paste->id,
        'viewed_on' => today()->toDateString(),
        'view_count' => 4,
    ]);

    $response = $this->get('/'.$paste->slug.'/status');

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pastes/status')
            ->where('paste.slug', $paste->slug)
            ->where('paste.public_url', url('/'.$paste->slug))
            ->where('paste.view_count', 5)
            ->where('paste.today_view_count', 4)
            ->etc()
        );
});

it('returns raw content for root paste raw urls', function () {
    $paste = Paste::factory()->create([
        'slug' => 'root-raw-paste',
        'content' => 'Root raw content',
    ]);

    $response = $this->get('/'.$paste->slug.'/raw');

    $response->assertSuccessful()
        ->assertHeader('content-type', 'text/plain; charset=UTF-8');

    expect($response->getContent())->toBe('Root raw content');
    expect($paste->fresh()->view_count)->toBe(1);
});

it('prevents pastes from reusing link slugs', function () {
    Link::create([
        'original_url' => 'https://example.com/taken',
        'slug' => 'shared-slug',
        'expires_at' => now()->addDay(),
    ]);

    $response = $this->from(route('paste.create'))->post(route('paste.store'), [
        'content' => 'This should fail',
        'syntax' => 'plaintext',
        'slug' => 'shared-slug',
    ]);

    $response->assertRedirect(route('paste.create'));
    $response->assertSessionHasErrors('slug');
});

it('prevents links from reusing paste slugs', function () {
    Paste::factory()->create([
        'slug' => 'taken-by-paste',
    ]);

    $response = $this->from(route('link.create'))->post(route('link.store'), [
        'url' => 'https://example.com/conflict',
        'slug' => 'taken-by-paste',
    ]);

    $response->assertRedirect(route('link.create'));
    $response->assertSessionHasErrors('slug');
});

it('redirects to the create page after deleting from a root link status page', function () {
    $user = User::factory()->create();
    $link = Link::create([
        'original_url' => 'https://example.com/delete-root-link',
        'slug' => 'delete-root-link',
        'user_id' => $user->id,
        'expires_at' => now()->addDay(),
    ]);

    $response = $this->actingAs($user)
        ->from('/'.$link->slug.'/status')
        ->delete(route('link.destroy', $link));

    $response->assertRedirect(route('link.create'));
});

it('redirects to the create page after deleting from a root paste status page', function () {
    $user = User::factory()->create();
    $paste = Paste::factory()->create([
        'slug' => 'delete-root-paste',
        'user_id' => $user->id,
    ]);

    $response = $this->actingAs($user)
        ->from('/'.$paste->slug.'/status')
        ->delete(route('paste.destroy', $paste));

    $response->assertRedirect(route('paste.create'));
});
