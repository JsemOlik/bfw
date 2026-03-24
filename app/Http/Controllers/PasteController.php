<?php

namespace App\Http\Controllers;

use App\Exceptions\SlugUnavailableException;
use App\Http\Requests\StorePasteRequest;
use App\Models\Paste;
use App\Support\PasteHighlighter;
use App\Support\PasteMediaManager;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Throwable;

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
        $storedMedia = null;

        if (in_array($request->pasteType(), ['image', 'video', 'file'], true)) {
            $pasteType = $request->pasteType();
            $uploadField = $pasteType;

            try {
                $storedMedia = match ($pasteType) {
                    'image' => $pasteMediaManager->storeUploadedImage($request->file('image')),
                    'video' => $pasteMediaManager->storeUploadedVideo($request->file('video')),
                    'file' => $pasteMediaManager->storeUploadedFile($request->file('file')),
                };

                $paste = DB::transaction(fn (): Paste => Paste::create([
                    'type' => $pasteType,
                    'content' => null,
                    'syntax' => null,
                    'slug' => $request->slug,
                    'user_id' => Auth::id(),
                    'storage_disk' => $storedMedia['disk'],
                    'storage_path' => $storedMedia['path'],
                    'original_filename' => $storedMedia['original_filename'],
                    'mime_type' => $storedMedia['mime_type'],
                    'size_bytes' => $storedMedia['size_bytes'],
                    'image_width' => $storedMedia['image_width'],
                    'image_height' => $storedMedia['image_height'],
                ]));
            } catch (SlugUnavailableException) {
                if ($storedMedia !== null) {
                    $pasteMediaManager->deleteFile($storedMedia['disk'], $storedMedia['path']);
                }

                return back()
                    ->withErrors([
                        'slug' => 'That slug is already taken.',
                    ])
                    ->withInput();
            } catch (Throwable $exception) {
                if ($storedMedia !== null) {
                    $pasteMediaManager->deleteFile($storedMedia['disk'], $storedMedia['path']);
                }

                report($exception);

                return back()
                    ->withErrors([
                        $uploadField => sprintf(
                            'We could not upload that %s right now. Please try again.',
                            $pasteType,
                        ),
                    ])
                    ->withInput();
            }
        } else {
            try {
                $paste = DB::transaction(fn (): Paste => Paste::create([
                    'type' => 'text',
                    'content' => $request->content,
                    'slug' => $request->slug,
                    'syntax' => $request->syntax ?? 'plaintext',
                    'user_id' => Auth::id(),
                ]));
            } catch (SlugUnavailableException) {
                return back()
                    ->withErrors([
                        'slug' => 'That slug is already taken.',
                    ])
                    ->withInput();
            }
        }

        return back()->with('shortened_link', $paste->publicUrl());
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

        $paste->recordView();

        return Inertia::render('pastes/show', [
            'paste' => [
                'type' => $paste->type,
                'content' => $paste->content,
                'syntax' => $paste->syntax,
                'slug' => $paste->slug,
                'public_url' => $paste->publicUrl(),
                'raw_url' => $paste->rawUrl(),
                'download_url' => $paste->isStoredUpload() ? $paste->downloadUrl() : null,
                'media_url' => $paste->isStoredUpload() ? $pasteMediaManager->url($paste) : null,
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

        $paste->recordView();

        if ($paste->isStoredUpload()) {
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

    public function download(string $slug, PasteMediaManager $pasteMediaManager): SymfonyResponse
    {
        $paste = Paste::where('slug', $slug)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->firstOrFail();

        abort_unless($paste->isStoredUpload(), 404);

        $paste->recordView();

        return $pasteMediaManager->download($paste);
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
                'public_url' => $paste->publicUrl(),
                'download_url' => $paste->isStoredUpload() ? $paste->downloadUrl() : null,
                'syntax' => $paste->syntax,
                'snippet' => $paste->isText()
                    ? Str::limit($paste->content ?? '', 100)
                    : ($paste->original_filename ?? Str::headline($paste->type).' paste'),
                'view_count' => $paste->view_count,
                'today_view_count' => $paste->viewedTodayCount(),
                'media_url' => $paste->isStoredUpload() ? $pasteMediaManager->url($paste) : null,
                'original_filename' => $paste->original_filename,
                'mime_type' => $paste->mime_type,
                'size_bytes' => $paste->size_bytes,
                'created_at' => $paste->created_at->toDateTimeString(),
                'expires_at' => $paste->expires_at?->toDateTimeString(),
                'is_expired' => $paste->expires_at?->isPast() ?? false,
            ],
        ]);
    }

    /**
     * Remove the specified paste from storage.
     */
    public function destroy(Request $request, Paste $paste, PasteMediaManager $pasteMediaManager): RedirectResponse
    {
        if (! Auth::check() || $paste->user_id !== Auth::id()) {
            abort(403);
        }

        $pasteMediaManager->delete($paste);
        $paste->delete();

        if ($this->isStatusReferrer($request, route('paste.status', $paste->slug), $paste->statusUrl())) {
            return redirect()->route('paste.create')
                ->with('message', 'Paste deleted successfully.');
        }

        return back()->with('message', 'Paste deleted successfully.');
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

    /**
     * @return array<string, mixed>
     */
    protected function pasteListItem(Paste $paste): array
    {
        return [
            'id' => $paste->id,
            'type' => $paste->type,
            'slug' => $paste->slug,
            'public_url' => $paste->publicUrl(),
            'status_url' => $paste->statusUrl(),
            'syntax' => $paste->isText() ? ($paste->syntax ?? 'plaintext') : $paste->type,
            'expires_at' => $paste->expires_at?->toDateTimeString(),
            'is_expired' => $paste->expires_at?->isPast() ?? false,
            'snippet' => $paste->isText()
                ? Str::limit($paste->content ?? '', 50)
                : ($paste->original_filename ?? Str::headline($paste->type).' paste'),
        ];
    }
}
