<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Link;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class LinkController extends Controller
{
    public function index(): Response
    {
        $links = Link::query()
            ->with('user:id,name,email')
            ->latest()
            ->get()
            ->map(fn (Link $link) => [
                'id' => $link->id,
                'slug' => $link->slug,
                'original_url' => $link->original_url,
                'public_url' => $link->publicUrl(),
                'status_url' => $link->statusUrl(),
                'created_at' => $link->created_at->toDateTimeString(),
                'expires_at' => $link->expires_at?->toDateTimeString(),
                'is_expired' => $link->expires_at?->isPast() ?? false,
                'owner_name' => $link->user?->name,
                'owner_email' => $link->user?->email,
            ]);

        return Inertia::render('admin/links/index', [
            'links' => $links,
        ]);
    }

    public function destroy(Link $link): RedirectResponse
    {
        $link->delete();

        return back()->with('message', 'Link deleted successfully.');
    }
}
