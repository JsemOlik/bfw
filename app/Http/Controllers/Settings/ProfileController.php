<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();
        $deletionMoment = now();
        $expiresAt = $deletionMoment->copy()->addDay();

        DB::transaction(function () use ($deletionMoment, $user, $expiresAt): void {
            $user->links()
                ->where(function (Builder $query) use ($deletionMoment): void {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', $deletionMoment);
                })
                ->update(['expires_at' => $expiresAt]);

            $user->pastes()
                ->where(function (Builder $query) use ($deletionMoment): void {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', $deletionMoment);
                })
                ->update(['expires_at' => $expiresAt]);

            User::query()->whereKey($user->getKey())->delete();
        });

        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
