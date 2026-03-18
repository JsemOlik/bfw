<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests\StoreLinkRequest;
use App\Models\Link;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class LinkController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of shortened links.
     */
    public function index(): Response
    {
        $query = Link::latest();

        if (Auth::check()) {
            // Show user's links and other public links if needed, 
            // but for "My Links" logic we focus on ownership.
            $links = Link::where('user_id', Auth::id())
                ->orWhereNull('user_id')
                ->latest()
                ->get();
        } else {
            $links = Link::whereNull('user_id')->latest()->get();
        }

        return Inertia::render('links/index', [
            'links' => $links,
        ]);
    }

    /**
     * Show the form for creating a new link.
     */
    public function create(): Response
    {
        return Inertia::render('links/create');
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
            ->where('expires_at', '>', now())
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
                'expires_at' => $link->expires_at->toDateTimeString(),
                'is_expired' => $link->expires_at->isPast(),
            ],
        ]);
    }

    /**
     * Remove the specified link from storage.
     */
    public function destroy(Link $link): RedirectResponse
    {
        if (!Auth::check() || $link->user_id !== Auth::id()) {
            abort(403);
        }

        $link->delete();

        return back()->with('message', 'Link deleted successfully.');
    }
}
