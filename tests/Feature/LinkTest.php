<?php

use App\Models\Link;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

it('can shorten a link', function () {
    $response = $this->post(route('link.store'), [
        'url' => 'https://google.com',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('links', [
        'original_url' => 'https://google.com',
    ]);

    $link = Link::first();
    expect($link->slug)->not->toBeNull()
        ->and(strlen($link->slug))->toBe(6)
        ->and(abs($link->created_at->diffInHours($link->expires_at)))->toEqual(24);
});

it('can shorten a link with a custom slug', function () {
    $response = $this->post(route('link.store'), [
        'url' => 'https://laravel.com',
        'slug' => 'custom-slug',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('links', [
        'original_url' => 'https://laravel.com',
        'slug' => 'custom-slug',
    ]);
});

it('redirects to the original url', function () {
    $link = Link::create([
        'original_url' => 'https://github.com',
        'slug' => 'gh',
        'expires_at' => now()->addDay(),
    ]);

    $response = $this->get(route('link.show', $link->slug));

    $response->assertRedirect('https://github.com');
});

it('returns 404 for expired links', function () {
    $link = Link::create([
        'original_url' => 'https://expired.com',
        'slug' => 'old',
        'expires_at' => now()->subDay(),
    ]);

    $response = $this->get(route('link.show', $link->slug));

    $response->assertStatus(404);
});

it('can view the links list', function () {
    Link::create(['original_url' => 'https://a.com', 'slug' => 'a', 'expires_at' => now()->addDay()]);
    Link::create(['original_url' => 'https://b.com', 'slug' => 'b', 'expires_at' => now()->addDay()]);

    $response = $this->get(route('link.index'));

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('links/index')
            ->has('links', 2)
        );
});

it('can view the status of a link', function () {
    $link = Link::create([
        'original_url' => 'https://status.com',
        'slug' => 'stat',
        'expires_at' => now()->addHours(24),
    ]);

    $response = $this->get(route('link.status', $link->slug));

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('links/status')
            ->has('link', fn ($link) => $link
                ->where('slug', 'stat')
                ->where('original_url', 'https://status.com')
                ->etc()
            )
        );
});

it('validates the url', function () {
    $response = $this->post(route('link.store'), [
        'url' => 'invalid-url',
    ]);

    $response->assertSessionHasErrors('url');
});

it('prunes expired links', function () {
    Link::create([
        'original_url' => 'https://prune.com',
        'slug' => 'prune',
        'expires_at' => now()->subDays(2),
    ]);

    Link::create([
        'original_url' => 'https://keep.com',
        'slug' => 'keep',
        'expires_at' => now()->addDays(2),
    ]);

    // Using specific model pruning
    (new Link)->pruneAll();

    $this->assertDatabaseMissing('links', ['slug' => 'prune']);
    $this->assertDatabaseHas('links', ['slug' => 'keep']);
});
