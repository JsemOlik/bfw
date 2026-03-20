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
