<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePasteRequest;
use App\Models\Paste;
use App\Support\PasteHighlighter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PasteController extends Controller
{
    use AuthorizesRequests;

    /**
     * Show the form for creating a new paste.
     */
    public function create(): Response
    {
        $userPastes = [];
        if (Auth::check()) {
            $userPastes = Paste::where('user_id', Auth::id())
                ->latest()
                ->get()
                ->map(fn ($paste) => [
                    'id' => $paste->id,
                    'slug' => $paste->slug,
                    'syntax' => $paste->syntax,
                    'expires_at' => $paste->expires_at->toDateTimeString(),
                    'is_expired' => $paste->expires_at->isPast(),
                    'snippet' => Str::limit($paste->content, 50),
                ]);
        }

        return Inertia::render('pastes/create', [
            'userPastes' => $userPastes,
        ]);
    }

    /**
     * Store a newly created paste in storage.
     */
    public function store(StorePasteRequest $request): RedirectResponse
    {
        $paste = Paste::create([
            'content' => $request->content,
            'slug' => $request->slug,
            'syntax' => $request->syntax ?? 'plaintext',
            'user_id' => Auth::id(),
        ]);

        return back()->with('shortened_link', route('paste.show', $paste->slug));
    }

    /**
     * Display the specified paste.
     */
    public function show(string $slug, PasteHighlighter $pasteHighlighter): Response
    {
        $paste = Paste::where('slug', $slug)
            ->where('expires_at', '>', now())
            ->firstOrFail();

        return Inertia::render('pastes/show', [
            'paste' => [
                'content' => $paste->content,
                'syntax' => $paste->syntax,
                'slug' => $paste->slug,
                'raw_url' => route('paste.raw', $paste->slug),
                'created_at' => $paste->created_at->toDateTimeString(),
                'highlighted_lines' => $pasteHighlighter->highlight($paste->content, $paste->syntax),
            ],
        ]);
    }

    /**
     * Display the raw text content of the specified paste.
     */
    public function raw(string $slug): HttpResponse
    {
        $paste = Paste::where('slug', $slug)
            ->where('expires_at', '>', now())
            ->firstOrFail();

        return response($paste->content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }

    /**
     * Display the status of a paste.
     */
    public function status(string $slug): Response
    {
        $paste = Paste::where('slug', $slug)->firstOrFail();

        return Inertia::render('pastes/status', [
            'paste' => [
                'id' => $paste->id,
                'user_id' => $paste->user_id,
                'slug' => $paste->slug,
                'syntax' => $paste->syntax,
                'snippet' => Str::limit($paste->content, 100),
                'created_at' => $paste->created_at->toDateTimeString(),
                'expires_at' => $paste->expires_at->toDateTimeString(),
                'is_expired' => $paste->expires_at->isPast(),
            ],
        ]);
    }

    /**
     * Remove the specified paste from storage.
     */
    public function destroy(Paste $paste): RedirectResponse
    {
        if (! Auth::check() || $paste->user_id !== Auth::id()) {
            abort(403);
        }

        $paste->delete();

        return back()->with('message', 'Paste deleted successfully.');
    }
}
