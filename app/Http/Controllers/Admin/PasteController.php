<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Paste;
use App\Support\PasteMediaManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PasteController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search')->value());

        $pastes = Paste::query()
            ->with('user:id,name,email')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nestedQuery) use ($search) {
                    $nestedQuery
                        ->where('slug', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%")
                        ->orWhere('syntax', 'like', "%{$search}%")
                        ->orWhere('content', 'like', "%{$search}%")
                        ->orWhere('original_filename', 'like', "%{$search}%")
                        ->orWhere('mime_type', 'like', "%{$search}%")
                        ->orWhere('id', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
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
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function destroy(Paste $paste, PasteMediaManager $pasteMediaManager): RedirectResponse
    {
        $pasteMediaManager->delete($paste);
        $paste->delete();

        return back()->with('message', 'Paste deleted successfully.');
    }
}
