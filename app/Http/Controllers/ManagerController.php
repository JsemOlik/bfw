<?php

namespace App\Http\Controllers;

use App\Models\ManagerRelease;
use App\Support\ManagerReleaseStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class ManagerController extends Controller
{
    public function json(): JsonResponse
    {
        $release = ManagerRelease::query()
            ->where('is_active', true)
            ->latest('pub_date')
            ->latest()
            ->firstOrFail();

        return response()
            ->json($release->updaterJson())
            ->setEncodingOptions(JSON_UNESCAPED_SLASHES)
            ->header('Cache-Control', 'no-cache, private');
    }

    public function download(
        string $filename,
        ManagerReleaseStorage $storage,
    ): RedirectResponse {
        $release = ManagerRelease::query()
            ->where('original_filename', $filename)
            ->latest('pub_date')
            ->latest()
            ->firstOrFail();

        return $storage->download($release);
    }
}
