<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
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

it('lets admins update a user from the admin area', function () {
    $admin = User::factory()->admin()->create();
    $member = User::factory()->create([
        'name' => 'Old Name',
        'email' => 'old@example.com',
        'role' => 'user',
        'email_verified_at' => now(),
    ]);

    $response = $this->actingAs($admin)->patch(route('admin.users.update', $member), [
        'name' => 'Updated Name',
        'email' => 'updated@example.com',
        'role' => 'admin',
        'email_verified' => false,
        'password' => '',
        'password_confirmation' => '',
    ]);

    $response->assertRedirect(route('admin.users.index'));

    $member->refresh();

    expect($member->name)->toBe('Updated Name')
        ->and($member->email)->toBe('updated@example.com')
        ->and($member->role)->toBe('admin')
        ->and($member->email_verified_at)->toBeNull();
});

it('lets admins reset a users password from the admin area', function () {
    $admin = User::factory()->admin()->create();
    $member = User::factory()->create();

    $response = $this->actingAs($admin)->patch(route('admin.users.update', $member), [
        'name' => $member->name,
        'email' => $member->email,
        'role' => $member->role,
        'email_verified' => $member->email_verified_at !== null,
        'password' => 'super-secure-password',
        'password_confirmation' => 'super-secure-password',
    ]);

    $response->assertRedirect(route('admin.users.index'));

    $member->refresh();

    expect($member->password)
        ->not->toBe('super-secure-password')
        ->and(Hash::check('super-secure-password', $member->password))
        ->toBeTrue();
});

it('lets admins search users by name, email, or id', function (string $search) {
    $admin = User::factory()->admin()->create();
    $target = User::factory()->create([
        'name' => 'Taylor Search',
        'email' => 'findme@example.com',
    ]);
    User::factory()->create([
        'name' => 'Someone Else',
        'email' => 'other@example.com',
    ]);

    $response = $this->actingAs($admin)->get(route('admin.users.index', [
        'search' => $search === ':id:' ? (string) $target->id : $search,
    ]));

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->where('filters.search', $search === ':id:' ? (string) $target->id : $search)
            ->has('users', 1)
            ->where('users.0.id', $target->id)
            ->where('users.0.email', $target->email)
            ->etc()
        );
})->with([
    'name' => 'Taylor',
    'email' => 'findme@example.com',
    'id' => ':id:',
]);
