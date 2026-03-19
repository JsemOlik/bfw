<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePasteRequest;
use App\Models\Paste;
use App\Support\PasteHighlighter;
use App\Support\PasteMediaManager;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

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
                ->map(fn (Paste $paste) => $this->pasteListItem($paste));
        }

        return Inertia::render('pastes/create', [
            'userPastes' => $userPastes,
        ]);
    }

    /**
     * Store a newly created paste in storage.
     */
    public function store(StorePasteRequest $request, PasteMediaManager $pasteMediaManager): RedirectResponse
    {
        if ($request->pasteType() === 'image') {
            $storedImage = $pasteMediaManager->storeUploadedImage($request->file('image'));

            $paste = Paste::create([
                'type' => 'image',
                'content' => null,
                'syntax' => null,
                'slug' => $request->slug,
                'user_id' => Auth::id(),
                'storage_disk' => $storedImage['disk'],
                'storage_path' => $storedImage['path'],
                'original_filename' => $storedImage['original_filename'],
                'mime_type' => $storedImage['mime_type'],
                'size_bytes' => $storedImage['size_bytes'],
                'image_width' => $storedImage['image_width'],
                'image_height' => $storedImage['image_height'],
            ]);
        } else {
            $paste = Paste::create([
                'type' => 'text',
                'content' => $request->content,
                'slug' => $request->slug,
                'syntax' => $request->syntax ?? 'plaintext',
                'user_id' => Auth::id(),
            ]);
        }

        return back()->with('shortened_link', route('paste.show', $paste->slug));
    }

    /**
     * Display the specified paste.
     */
    public function show(
        string $slug,
        PasteHighlighter $pasteHighlighter,
        PasteMediaManager $pasteMediaManager,
    ): Response {
        $paste = Paste::where('slug', $slug)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->firstOrFail();

        return Inertia::render('pastes/show', [
            'paste' => [
                'type' => $paste->type,
                'content' => $paste->content,
                'syntax' => $paste->syntax,
                'slug' => $paste->slug,
                'raw_url' => route('paste.raw', $paste->slug),
                'image_url' => $paste->isImage() ? $pasteMediaManager->url($paste) : null,
                'original_filename' => $paste->original_filename,
                'mime_type' => $paste->mime_type,
                'size_bytes' => $paste->size_bytes,
                'image_width' => $paste->image_width,
                'image_height' => $paste->image_height,
                'created_at' => $paste->created_at->toDateTimeString(),
                'highlighted_lines' => $paste->isText()
                    ? $pasteHighlighter->highlight($paste->content ?? '', $paste->syntax ?? 'plaintext')
                    : [],
            ],
        ]);
    }

    /**
     * Display the raw text content of the specified paste.
     */
    public function raw(string $slug, PasteMediaManager $pasteMediaManager): SymfonyResponse
    {
        $paste = Paste::where('slug', $slug)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->firstOrFail();

        if ($paste->isImage()) {
            $url = $pasteMediaManager->url($paste);

            if (Str::startsWith($url, ['http://', 'https://'])) {
                return redirect()->away($url);
            }

            return redirect($url);
        }

        return response($paste->content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }

    /**
     * Display the status of a paste.
     */
    public function status(string $slug, PasteMediaManager $pasteMediaManager): Response
    {
        $paste = Paste::where('slug', $slug)->firstOrFail();

        return Inertia::render('pastes/status', [
            'paste' => [
                'id' => $paste->id,
                'user_id' => $paste->user_id,
                'type' => $paste->type,
                'slug' => $paste->slug,
                'syntax' => $paste->syntax,
                'snippet' => $paste->isText()
                    ? Str::limit($paste->content ?? '', 100)
                    : ($paste->original_filename ?? 'Image paste'),
                'image_url' => $paste->isImage() ? $pasteMediaManager->url($paste) : null,
                'original_filename' => $paste->original_filename,
                'created_at' => $paste->created_at->toDateTimeString(),
                'expires_at' => $paste->expires_at?->toDateTimeString(),
                'is_expired' => $paste->expires_at?->isPast() ?? false,
            ],
        ]);
    }

    /**
     * Remove the specified paste from storage.
     */
    public function destroy(Paste $paste, PasteMediaManager $pasteMediaManager): RedirectResponse
    {
        if (! Auth::check() || $paste->user_id !== Auth::id()) {
            abort(403);
        }

        $pasteMediaManager->delete($paste);
        $paste->delete();

        return back()->with('message', 'Paste deleted successfully.');
    }

    /**
     * @return array<string, mixed>
     */
    protected function pasteListItem(Paste $paste): array
    {
        return [
            'id' => $paste->id,
            'type' => $paste->type,
            'slug' => $paste->slug,
            'syntax' => $paste->isText() ? ($paste->syntax ?? 'plaintext') : 'image',
            'expires_at' => $paste->expires_at?->toDateTimeString(),
            'is_expired' => $paste->expires_at?->isPast() ?? false,
            'snippet' => $paste->isText()
                ? Str::limit($paste->content ?? '', 50)
                : ($paste->original_filename ?? 'Image paste'),
        ];
    }
}
