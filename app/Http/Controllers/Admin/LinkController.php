<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Link;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LinkController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search')->value());
        $normalizedSearch = mb_strtolower($search);

        $links = Link::query()
            ->with('user:id,name,email')
            ->when($search !== '', function ($query) use ($search, $normalizedSearch) {
                $query->where(function ($nestedQuery) use ($search, $normalizedSearch) {
                    $nestedQuery
                        ->whereRaw('LOWER(slug) LIKE ?', ["%{$normalizedSearch}%"])
                        ->orWhereRaw('LOWER(original_url) LIKE ?', ["%{$normalizedSearch}%"])
                        ->orWhereHas('user', function ($userQuery) use ($normalizedSearch) {
                            $userQuery
                                ->whereRaw('LOWER(name) LIKE ?', ["%{$normalizedSearch}%"])
                                ->orWhereRaw('LOWER(email) LIKE ?', ["%{$normalizedSearch}%"]);
                        });

                    if (ctype_digit($search)) {
                        $nestedQuery->orWhere('id', (int) $search);
                    }
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Link $link) => [
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
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function destroy(Link $link): RedirectResponse
    {
        $link->delete();

        return back()->with('message', 'Link deleted successfully.');
    }
}
