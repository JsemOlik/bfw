<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Requests\StoreLinkRequest;
use App\Models\Link;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class LinkController extends Controller
{
    /**
     * Display a listing of all shortened links.
     */
    public function index(): Response
    {
        return Inertia::render('links/index', [
            'links' => Link::latest()->get(),
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
                'original_url' => $link->original_url,
                'slug' => $link->slug,
                'created_at' => $link->created_at->toDateTimeString(),
                'expires_at' => $link->expires_at->toDateTimeString(),
                'is_expired' => $link->expires_at->isPast(),
            ],
        ]);
    }
}
