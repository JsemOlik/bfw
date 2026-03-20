<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(): Response
    {
        $users = User::query()
            ->latest()
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'email_verified_at' => $user->email_verified_at?->toDateTimeString(),
                'created_at' => $user->created_at->toDateTimeString(),
            ]);

        return Inertia::render('admin/users/index', [
            'users' => $users,
        ]);
    }
}
