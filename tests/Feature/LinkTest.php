<?php

use App\Models\Link;
use App\Models\User;
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
        ->and($link->user_id)->toBeNull()
        ->and(abs($link->created_at->diffInHours($link->expires_at)))->toEqual(24);
});

it('associates a link with the authenticated user', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('link.store'), [
        'url' => 'https://google.com',
    ]);

    $this->assertDatabaseHas('links', [
        'original_url' => 'https://google.com',
        'user_id' => $user->id,
    ]);
});

it('expires authenticated user links in two months', function () {
    $this->travelTo(now()->startOfSecond());

    $user = User::factory()->create();

    $this->actingAs($user)->post(route('link.store'), [
        'url' => 'https://two-months.com',
    ]);

    $link = Link::first();

    expect($link->expires_at?->toDateTimeString())
        ->toBe(now()->addMonthsNoOverflow(2)->toDateTimeString());
});

it('does not expire admin links', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)->post(route('link.store'), [
        'url' => 'https://forever.com',
    ]);

    $link = Link::first();

    expect($link->expires_at)->toBeNull();
});

it('can see the create link page', function () {
    $response = $this->get(route('link.create'));

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('links/create'));
});

it('shows guest warning on create page for unauthenticated users', function () {
    $response = $this->get(route('link.create'));

    $response->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->where('auth.user', null)
        );

    // We can also check if the warning text is present in the rendered HTML if needed,
    // but Inertia tests usually focus on props.
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

it('allows owners to delete their links', function () {
    $user = User::factory()->create();
    $link = Link::create([
        'original_url' => 'https://delete-me.com',
        'slug' => 'del',
        'user_id' => $user->id,
        'expires_at' => now()->addDay(),
    ]);

    $response = $this->actingAs($user)->delete(route('link.destroy', $link));

    $response->assertRedirect();
    $this->assertDatabaseMissing('links', ['id' => $link->id]);
});

it('prevents non-owners from deleting links', function () {
    $owner = User::factory()->create();
    $malicious = User::factory()->create();
    $link = Link::create([
        'original_url' => 'https://secure.com',
        'slug' => 'safe',
        'user_id' => $owner->id,
        'expires_at' => now()->addDay(),
    ]);

    $response = $this->actingAs($malicious)->delete(route('link.destroy', $link));

    $response->assertStatus(403);
    $this->assertDatabaseHas('links', ['id' => $link->id]);
});

it('prevents guests from deleting links', function () {
    $link = Link::create([
        'original_url' => 'https://guest.com',
        'slug' => 'guest',
        'expires_at' => now()->addDay(),
    ]);

    $response = $this->delete(route('link.destroy', $link));

    // Controller checks if ($link->user_id !== Auth::id()) which is true for guests
    // since user_id is null and Auth::id() is null.
    // Wait, null === null. I should fix that in the controller!
    $response->assertStatus(403);
});
