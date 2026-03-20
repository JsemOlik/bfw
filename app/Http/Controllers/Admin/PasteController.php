<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Paste;
use App\Support\PasteMediaManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PasteController extends Controller
{
    public function index(): Response
    {
        $pastes = Paste::query()
            ->with('user:id,name,email')
            ->latest()
            ->get()
            ->map(fn (Paste $paste) => [
                'id' => $paste->id,
                'type' => $paste->type,
                'slug' => $paste->slug,
                'public_url' => $paste->publicUrl(),
                'status_url' => $paste->statusUrl(),
                'created_at' => $paste->created_at->toDateTimeString(),
                'expires_at' => $paste->expires_at?->toDateTimeString(),
                'is_expired' => $paste->expires_at?->isPast() ?? false,
                'syntax' => $paste->syntax,
                'mime_type' => $paste->mime_type,
                'original_filename' => $paste->original_filename,
                'owner_name' => $paste->user?->name,
                'owner_email' => $paste->user?->email,
                'snippet' => $paste->isText()
                    ? Str::limit($paste->content ?? '', 80)
                    : ($paste->original_filename ?? Str::headline($paste->type).' paste'),
            ]);

        return Inertia::render('admin/pastes/index', [
            'pastes' => $pastes,
        ]);
    }

    public function destroy(Paste $paste, PasteMediaManager $pasteMediaManager): RedirectResponse
    {
        $pasteMediaManager->delete($paste);
        $paste->delete();

        return back()->with('message', 'Paste deleted successfully.');
    }
}
