<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLinkRequest;
use App\Models\Link;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class LinkController extends Controller
{
    use AuthorizesRequests;

    /**
     * Show the form for creating a new link.
     */
    public function create(): Response
    {
        $userLinks = [];
        if (Auth::check()) {
            $userLinks = Link::where('user_id', Auth::id())
                ->latest()
                ->get()
                ->map(fn ($link) => [
                    'id' => $link->id,
                    'original_url' => $link->original_url,
                    'slug' => $link->slug,
                    'expires_at' => $link->expires_at?->toDateTimeString(),
                    'is_expired' => $link->expires_at?->isPast() ?? false,
                ]);
        }

        return Inertia::render('links/create', [
            'userLinks' => $userLinks,
        ]);
    }

    /**
     * Store a newly created link in storage.
     */
    public function store(StoreLinkRequest $request): RedirectResponse
    {
        $link = Link::create([
            'original_url' => $request->url,
            'slug' => $request->slug,
            'user_id' => Auth::id(),
        ]);

        return back()->with('shortened_link', route('link.show', $link->slug));
    }

    /**
     * Redirect to the original URL.
     */
    public function show(string $slug): RedirectResponse
    {
        $link = Link::where('slug', $slug)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->firstOrFail();

        return redirect()->away($link->original_url);
    }

    /**
     * Display the status of a shortened link.
     */
    public function status(string $slug): Response
    {
        $link = Link::where('slug', $slug)->firstOrFail();

        return Inertia::render('links/status', [
            'link' => [
                'id' => $link->id,
                'user_id' => $link->user_id,
                'original_url' => $link->original_url,
                'slug' => $link->slug,
                'created_at' => $link->created_at->toDateTimeString(),
                'expires_at' => $link->expires_at?->toDateTimeString(),
                'is_expired' => $link->expires_at?->isPast() ?? false,
            ],
        ]);
    }

    /**
     * Remove the specified link from storage.
     */
    public function destroy(Link $link): RedirectResponse
    {
        if (! Auth::check() || $link->user_id !== Auth::id()) {
            abort(403);
        }

        $link->delete();

        return back()->with('message', 'Link deleted successfully.');
    }
}
