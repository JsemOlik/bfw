<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

it('renders the custom 403 page with shared app chrome', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('admin.users.index'));

    $response->assertForbidden()
        ->assertInertia(fn (Assert $page) => $page
            ->component('errors/forbidden')
            ->where('status', 403)
            ->etc()
        );
});

it('renders the custom 404 page with shared app chrome', function () {
    $response = $this->get('/definitely-missing-page');

    $response->assertNotFound()
        ->assertInertia(fn (Assert $page) => $page
            ->component('errors/not-found')
            ->where('status', 404)
            ->etc()
        );
});
