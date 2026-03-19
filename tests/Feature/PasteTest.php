<?php

use App\Models\Paste;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
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

it('validates paste creation requests', function () {
    $response = $this->post('/paste', [
        'content' => '', // Required
    ]);

    $response->assertSessionHasErrors('content');
    $this->assertDatabaseCount('pastes', 0);
});

it('shows the raw text of a paste', function () {
    $paste = Paste::factory()->create(['content' => 'Raw text content']);

    $response = $this->get('/paste/'.$paste->slug);

    $response->assertSuccessful();
    $response->assertSee('Raw text content');
});

it('returns raw paste content without ui', function () {
    $paste = Paste::factory()->create(['content' => "#!/bin/sh\necho 'hello'"]);

    $response = $this->get('/paste/'.$paste->slug.'/raw');

    $response->assertSuccessful();
    $response->assertHeader('content-type', 'text/plain; charset=UTF-8');
    expect($response->getContent())->toBe("#!/bin/sh\necho 'hello'");
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
