<?php

namespace App\Http\Controllers;

use App\Models\Link;
use App\Models\Paste;
use App\Models\SlugRegistry;
use App\Support\PasteHighlighter;
use App\Support\PasteMediaManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class PublicSlugController extends Controller
{
    public function show(
        SlugRegistry $slugRegistry,
        PasteHighlighter $pasteHighlighter,
        PasteMediaManager $pasteMediaManager,
    ): RedirectResponse|Response {
        $sluggable = $slugRegistry->sluggable;

        if ($sluggable instanceof Link) {
            abort_if($sluggable->expires_at?->isPast() ?? false, 404);

            $sluggable->recordOpen();

            return redirect()->away($sluggable->original_url);
        }

        abort_unless($sluggable instanceof Paste, 404);
        abort_if($sluggable->expires_at?->isPast() ?? false, 404);

        $sluggable->recordView();

        return Inertia::render('pastes/show', [
            'paste' => [
                'type' => $sluggable->type,
                'content' => $sluggable->content,
                'syntax' => $sluggable->syntax,
                'slug' => $sluggable->slug,
                'public_url' => $sluggable->publicUrl(),
                'raw_url' => $sluggable->rawUrl(),
                'download_url' => $sluggable->isStoredUpload() ? $sluggable->downloadUrl() : null,
                'media_url' => $sluggable->isStoredUpload() ? $pasteMediaManager->url($sluggable) : null,
                'original_filename' => $sluggable->original_filename,
                'mime_type' => $sluggable->mime_type,
                'size_bytes' => $sluggable->size_bytes,
                'image_width' => $sluggable->image_width,
                'image_height' => $sluggable->image_height,
                'created_at' => $sluggable->created_at->toDateTimeString(),
                'highlighted_lines' => $sluggable->isText()
                    ? $pasteHighlighter->highlight($sluggable->content ?? '', $sluggable->syntax ?? 'plaintext')
                    : [],
            ],
        ]);
    }

    public function status(SlugRegistry $slugRegistry, PasteMediaManager $pasteMediaManager): Response
    {
        $sluggable = $slugRegistry->sluggable;

        if ($sluggable instanceof Link) {
            return Inertia::render('links/status', [
                'link' => [
                    'id' => $sluggable->id,
                    'user_id' => $sluggable->user_id,
                    'original_url' => $sluggable->original_url,
                    'slug' => $sluggable->slug,
                    'public_url' => $sluggable->publicUrl(),
                    'open_count' => $sluggable->open_count,
                    'today_open_count' => $sluggable->openedTodayCount(),
                    'created_at' => $sluggable->created_at->toDateTimeString(),
                    'expires_at' => $sluggable->expires_at?->toDateTimeString(),
                    'is_expired' => $sluggable->expires_at?->isPast() ?? false,
                ],
            ]);
        }

        abort_unless($sluggable instanceof Paste, 404);

        return Inertia::render('pastes/status', [
            'paste' => [
                'id' => $sluggable->id,
                'user_id' => $sluggable->user_id,
                'type' => $sluggable->type,
                'slug' => $sluggable->slug,
                'public_url' => $sluggable->publicUrl(),
                'download_url' => $sluggable->isStoredUpload() ? $sluggable->downloadUrl() : null,
                'syntax' => $sluggable->syntax,
                'snippet' => $sluggable->isText()
                    ? Str::limit($sluggable->content ?? '', 100)
                    : ($sluggable->original_filename ?? Str::headline($sluggable->type).' paste'),
                'view_count' => $sluggable->view_count,
                'today_view_count' => $sluggable->viewedTodayCount(),
                'media_url' => $sluggable->isStoredUpload() ? $pasteMediaManager->url($sluggable) : null,
                'original_filename' => $sluggable->original_filename,
                'mime_type' => $sluggable->mime_type,
                'size_bytes' => $sluggable->size_bytes,
                'created_at' => $sluggable->created_at->toDateTimeString(),
                'expires_at' => $sluggable->expires_at?->toDateTimeString(),
                'is_expired' => $sluggable->expires_at?->isPast() ?? false,
            ],
        ]);
    }

    public function raw(SlugRegistry $slugRegistry, PasteMediaManager $pasteMediaManager): SymfonyResponse
    {
        $sluggable = $slugRegistry->sluggable;

        abort_unless($sluggable instanceof Paste, 404);
        abort_if($sluggable->expires_at?->isPast() ?? false, 404);

        $sluggable->recordView();

        if ($sluggable->isStoredUpload()) {
            $url = $pasteMediaManager->url($sluggable);

            if (Str::startsWith($url, ['http://', 'https://'])) {
                return redirect()->away($url);
            }

            return redirect($url);
        }

        return response($sluggable->content, 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }

    public function download(SlugRegistry $slugRegistry, PasteMediaManager $pasteMediaManager): SymfonyResponse
    {
        $sluggable = $slugRegistry->sluggable;

        abort_unless($sluggable instanceof Paste, 404);
        abort_if($sluggable->expires_at?->isPast() ?? false, 404);
        abort_unless($sluggable->isStoredUpload(), 404);

        $sluggable->recordView();

        return $pasteMediaManager->download($sluggable);
    }
}
