<?php

use App\Models\Paste;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

it('allows guests to create a paste', function () {
    $response = $this->post('/text', [
        'content' => 'Hello World!',
        'syntax' => 'plaintext',
    ]);

    $paste = Paste::first();

    $response->assertRedirect('/text/' . $paste->slug);
    $this->assertDatabaseHas('pastes', [
        'content' => 'Hello World!',
        'syntax' => 'plaintext',
        'user_id' => null,
    ]);
});

it('allows authenticated users to create a paste', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/text', [
        'content' => 'Auth Hello World!',
        'slug' => 'auth-paste',
    ]);

    $response->assertRedirect('/text/auth-paste');
    $this->assertDatabaseHas('pastes', [
        'content' => 'Auth Hello World!',
        'slug' => 'auth-paste',
        'user_id' => $user->id,
    ]);
});

it('validates paste creation requests', function () {
    $response = $this->post('/text', [
        'content' => '', // Required
    ]);

    $response->assertSessionHasErrors('content');
    $this->assertDatabaseCount('pastes', 0);
});

it('shows the raw text of a paste', function () {
    $paste = Paste::factory()->create(['content' => 'Raw text content']);

    $response = $this->get('/text/' . $paste->slug);

    $response->assertStatus(200);
    $response->assertSee('Raw text content');
});

it('does not show expired pastes', function () {
    $paste = Paste::factory()->create([
        'expires_at' => now()->subDay(),
    ]);

    $response = $this->get('/text/' . $paste->slug);

    $response->assertStatus(404);
});

it('allows owners to delete their paste', function () {
    $user = User::factory()->create();
    $paste = Paste::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->delete('/text/' . $paste->id);

    $response->assertRedirect();
    $this->assertDatabaseMissing('pastes', ['id' => $paste->id]);
});

it('prevents guests from deleting pastes', function () {
    $paste = Paste::factory()->create();

    $response = $this->delete('/text/' . $paste->id);

    $response->assertStatus(403);
    $this->assertDatabaseHas('pastes', ['id' => $paste->id]);
});

it('prevents users from deleting others pastes', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $paste = Paste::factory()->create(['user_id' => $owner->id]);

    $response = $this->actingAs($otherUser)->delete('/text/' . $paste->id);

    $response->assertStatus(403);
    $this->assertDatabaseHas('pastes', ['id' => $paste->id]);
});
