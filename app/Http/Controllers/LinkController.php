<?php

namespace App\Http\Controllers;

use App\Exceptions\SlugUnavailableException;
use App\Http\Requests\StoreLinkRequest;
use App\Models\Link;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
                    'public_url' => $link->publicUrl(),
                    'status_url' => $link->statusUrl(),
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
        try {
            $link = DB::transaction(fn (): Link => Link::create([
                'original_url' => $request->url,
                'slug' => $request->slug,
                'user_id' => Auth::id(),
            ]));
        } catch (SlugUnavailableException) {
            return back()
                ->withErrors([
                    'slug' => 'That slug is already taken.',
                ])
                ->withInput();
        }

        return back()->with('shortened_link', $link->publicUrl());
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

        $link->recordOpen();

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
                'public_url' => $link->publicUrl(),
                'open_count' => $link->open_count,
                'today_open_count' => $link->openedTodayCount(),
                'created_at' => $link->created_at->toDateTimeString(),
                'expires_at' => $link->expires_at?->toDateTimeString(),
                'is_expired' => $link->expires_at?->isPast() ?? false,
            ],
        ]);
    }

    /**
     * Remove the specified link from storage.
     */
    public function destroy(Request $request, Link $link): RedirectResponse
    {
        if (! Auth::check() || $link->user_id !== Auth::id()) {
            abort(403);
        }

        $link->delete();

        if ($this->isStatusReferrer($request, route('link.status', $link->slug), $link->statusUrl())) {
            return redirect()->route('link.create')
                ->with('message', 'Link deleted successfully.');
        }

        return back()->with('message', 'Link deleted successfully.');
    }

    protected function isStatusReferrer(Request $request, string ...$statusUrls): bool
    {
        $referrerPath = parse_url((string) $request->headers->get('referer'), PHP_URL_PATH);

        if (! is_string($referrerPath)) {
            return false;
        }

        return collect($statusUrls)
            ->map(fn (string $statusUrl) => parse_url($statusUrl, PHP_URL_PATH))
            ->filter(fn ($statusPath) => is_string($statusPath))
            ->contains($referrerPath);
    }
}
