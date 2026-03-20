<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $normalizedSearch = mb_strtolower($search);

        $users = User::query()
            ->when($search !== '', function ($query) use ($search, $normalizedSearch) {
                $query->where(function ($userQuery) use ($search, $normalizedSearch) {
                    if (ctype_digit($search)) {
                        $userQuery->whereKey((int) $search)
                            ->orWhereRaw('LOWER(name) LIKE ?', ["%{$normalizedSearch}%"])
                            ->orWhereRaw('LOWER(email) LIKE ?', ["%{$normalizedSearch}%"]);
                    } else {
                        $userQuery->whereRaw('LOWER(name) LIKE ?', ["%{$normalizedSearch}%"])
                            ->orWhereRaw('LOWER(email) LIKE ?', ["%{$normalizedSearch}%"]);
                    }
                });
            })
            ->latest()
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'email_verified_at' => $user->email_verified_at?->toDateTimeString(),
                'two_factor_confirmed_at' => $user->two_factor_confirmed_at?->toDateTimeString(),
                'created_at' => $user->created_at->toDateTimeString(),
                'updated_at' => $user->updated_at->toDateTimeString(),
            ]);

        return Inertia::render('admin/users/index', [
            'filters' => [
                'search' => $search,
            ],
            'users' => $users,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $emailChanged = $user->email !== $validated['email'];

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
        ]);

        if (filled($validated['password'] ?? null)) {
            $user->password = $validated['password'];
        }

        if ($validated['email_verified']) {
            $user->email_verified_at = $emailChanged
                ? now()
                : ($user->email_verified_at ?? now());
        } else {
            $user->email_verified_at = null;
        }

        $user->save();

        return to_route('admin.users.index');
    }
}
