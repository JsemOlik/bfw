<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

it('redirects guests away from the admin users page', function () {
    $response = $this->get(route('admin.users.index'));

    $response->assertRedirect(route('login'));
});

it('forbids non-admin users from the admin users page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('admin.users.index'));

    $response->assertForbidden();
});

it('redirects the admin index to the users page', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get(route('admin.index'));

    $response->assertRedirect(route('admin.users.index'));
});

it('shows all registered users to admins', function () {
    $admin = User::factory()->admin()->create([
        'name' => 'Admin User',
        'email' => 'admin@example.com',
    ]);
    $member = User::factory()->create([
        'name' => 'Regular User',
        'email' => 'member@example.com',
    ]);

    $response = $this->actingAs($admin)->get(route('admin.users.index'));

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->has('users', 2)
            ->where('users', fn ($users) => collect($users)
                ->pluck('email')
                ->contains($admin->email) && collect($users)
                ->pluck('email')
                ->contains($member->email))
            ->etc()
        );
});
