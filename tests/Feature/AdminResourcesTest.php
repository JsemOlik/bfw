<?php

use App\Models\Link;
use App\Models\Paste;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

it('shows all shortened links to admins', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->create([
        'name' => 'Link Owner',
        'email' => 'link-owner@example.com',
    ]);

    $link = Link::create([
        'original_url' => 'https://example.com/admin-link',
        'slug' => 'admin-link',
        'user_id' => $owner->id,
        'expires_at' => now()->addDay(),
    ]);

    $response = $this->actingAs($admin)->get(route('admin.links.index'));

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/links/index')
            ->has('links.data', 1)
            ->where('links.data.0.id', $link->id)
            ->where('links.data.0.slug', $link->slug)
            ->where('links.data.0.owner_email', $owner->email)
            ->where('links.per_page', 20)
            ->etc()
        );
});

it('lets admins search links by slug, url, owner, and id', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->create([
        'name' => 'Taylor Linker',
        'email' => 'taylor-links@example.com',
    ]);

    $matchingLink = Link::create([
        'original_url' => 'https://example.com/favorite-link',
        'slug' => 'favorite-link',
        'user_id' => $owner->id,
        'expires_at' => now()->addDay(),
    ]);

    Link::create([
        'original_url' => 'https://example.com/other-link',
        'slug' => 'something-else',
        'expires_at' => now()->addDay(),
    ]);

    foreach ([
        'favorite-link',
        'example.com/favorite-link',
        'Taylor Linker',
        (string) $matchingLink->id,
    ] as $search) {
        $response = $this->actingAs($admin)->get(route('admin.links.index', [
            'search' => $search,
        ]));

        $response->assertSuccessful()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/links/index')
                ->where('filters.search', $search)
                ->has('links.data', 1)
                ->where('links.data.0.id', $matchingLink->id)
                ->etc()
            );
    }
});

it('paginates admin links with twenty results per page', function () {
    $admin = User::factory()->admin()->create();

    foreach (range(1, 21) as $index) {
        Link::create([
            'original_url' => "https://example.com/paginated-link-{$index}",
            'slug' => "paginated-link-{$index}",
            'expires_at' => now()->addDay(),
        ]);
    }

    $firstPage = $this->actingAs($admin)->get(route('admin.links.index'));

    $firstPage->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/links/index')
            ->has('links.data', 20)
            ->where('links.current_page', 1)
            ->where('links.last_page', 2)
            ->where('links.per_page', 20)
            ->etc()
        );

    $secondPage = $this->actingAs($admin)->get(route('admin.links.index', [
        'page' => 2,
    ]));

    $secondPage->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/links/index')
            ->has('links.data', 1)
            ->where('links.current_page', 2)
            ->etc()
        );
});

it('shows all pastes to admins', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->create([
        'name' => 'Paste Owner',
        'email' => 'paste-owner@example.com',
    ]);

    $paste = Paste::factory()->create([
        'user_id' => $owner->id,
        'type' => 'text',
        'content' => 'Admin visible paste content',
        'slug' => 'admin-paste',
        'syntax' => 'plaintext',
    ]);

    $response = $this->actingAs($admin)->get(route('admin.pastes.index'));

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pastes/index')
            ->has('pastes.data', 1)
            ->where('pastes.data.0.id', $paste->id)
            ->where('pastes.data.0.slug', $paste->slug)
            ->where('pastes.data.0.owner_email', $owner->email)
            ->where('pastes.per_page', 20)
            ->etc()
        );
});

it('lets admins search pastes by slug, content, file, owner, and id', function () {
    $admin = User::factory()->admin()->create();
    $owner = User::factory()->create([
        'name' => 'Paste Owner',
        'email' => 'paste-owner@example.com',
    ]);

    $matchingPaste = Paste::factory()->create([
        'user_id' => $owner->id,
        'type' => 'text',
        'content' => 'A searchable admin paste body',
        'slug' => 'searchable-paste',
        'syntax' => 'plaintext',
    ]);

    Paste::factory()->create([
        'type' => 'image',
        'slug' => 'other-paste',
        'original_filename' => 'holiday-photo.jpg',
        'mime_type' => 'image/jpeg',
        'content' => null,
    ]);

    foreach ([
        'searchable-paste',
        'searchable admin paste',
        'Paste Owner',
        (string) $matchingPaste->id,
    ] as $search) {
        $response = $this->actingAs($admin)->get(route('admin.pastes.index', [
            'search' => $search,
        ]));

        $response->assertSuccessful()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/pastes/index')
                ->where('filters.search', $search)
                ->has('pastes.data', 1)
                ->where('pastes.data.0.id', $matchingPaste->id)
                ->etc()
            );
    }

    $response = $this->actingAs($admin)->get(route('admin.pastes.index', [
        'search' => 'holiday-photo.jpg',
    ]));

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pastes/index')
            ->where('filters.search', 'holiday-photo.jpg')
            ->has('pastes.data', 1)
            ->where('pastes.data.0.slug', 'other-paste')
            ->etc()
        );
});

it('paginates admin pastes with twenty results per page', function () {
    $admin = User::factory()->admin()->create();

    Paste::factory()->count(21)->create();

    $firstPage = $this->actingAs($admin)->get(route('admin.pastes.index'));

    $firstPage->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pastes/index')
            ->has('pastes.data', 20)
            ->where('pastes.current_page', 1)
            ->where('pastes.last_page', 2)
            ->where('pastes.per_page', 20)
            ->etc()
        );

    $secondPage = $this->actingAs($admin)->get(route('admin.pastes.index', [
        'page' => 2,
    ]));

    $secondPage->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pastes/index')
            ->has('pastes.data', 1)
            ->where('pastes.current_page', 2)
            ->etc()
        );
});

it('shows empty admin states for links and pastes', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.links.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/links/index')
            ->has('links.data', 0)
            ->where('filters.search', '')
        );

    $this->actingAs($admin)
        ->get(route('admin.pastes.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/pastes/index')
            ->has('pastes.data', 0)
            ->where('filters.search', '')
        );
});

it('forbids non-admin users from admin links and pastes pages', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.links.index'))
        ->assertForbidden();

    $this->actingAs($user)
        ->get(route('admin.pastes.index'))
        ->assertForbidden();
});

it('lets admins delete links from the admin area', function () {
    $admin = User::factory()->admin()->create();
    $link = Link::create([
        'original_url' => 'https://example.com/delete-me',
        'slug' => 'delete-me-link',
        'expires_at' => now()->addDay(),
    ]);

    $response = $this->actingAs($admin)->delete(route('admin.links.destroy', $link));

    $response->assertRedirect();
    $this->assertDatabaseMissing('links', [
        'id' => $link->id,
    ]);
    $this->assertDatabaseMissing('slug_registries', [
        'slug' => $link->slug,
    ]);
});

it('lets admins delete media pastes from the admin area', function () {
    Storage::fake('local');

    $admin = User::factory()->admin()->create();
    $path = 'pastes/images/test/admin-image.jpg';
    Storage::disk('local')->put($path, 'fake-image-content');

    $paste = Paste::factory()->create([
        'type' => 'image',
        'slug' => 'delete-me-paste',
        'storage_disk' => 'local',
        'storage_path' => $path,
        'original_filename' => 'admin-image.jpg',
        'mime_type' => 'image/jpeg',
        'content' => null,
    ]);

    $response = $this->actingAs($admin)->delete(route('admin.pastes.destroy', $paste));

    $response->assertRedirect();
    $this->assertDatabaseMissing('pastes', [
        'id' => $paste->id,
    ]);
    Storage::disk('local')->assertMissing($path);
    $this->assertDatabaseMissing('slug_registries', [
        'slug' => $paste->slug,
    ]);
});
