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
        $normalizedSearch = mb_strtolower($search);

        $pastes = Paste::query()
            ->with('user:id,name,email')
            ->when($search !== '', function ($query) use ($search, $normalizedSearch) {
                $query->where(function ($nestedQuery) use ($search, $normalizedSearch) {
                    $nestedQuery
                        ->whereRaw('LOWER(slug) LIKE ?', ["%{$normalizedSearch}%"])
                        ->orWhereRaw('LOWER(type) LIKE ?', ["%{$normalizedSearch}%"])
                        ->orWhereRaw('LOWER(syntax) LIKE ?', ["%{$normalizedSearch}%"])
                        ->orWhereRaw('LOWER(content) LIKE ?', ["%{$normalizedSearch}%"])
                        ->orWhereRaw('LOWER(original_filename) LIKE ?', ["%{$normalizedSearch}%"])
                        ->orWhereRaw('LOWER(mime_type) LIKE ?', ["%{$normalizedSearch}%"])
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
            ->through(fn (Paste $paste) => [
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
