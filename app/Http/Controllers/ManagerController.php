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
        $decodedFilename = basename(rawurldecode($filename));
        $sanitizedFilename = $storage->sanitizeFilename($decodedFilename);
        $filenameCandidates = array_values(array_unique([
            $decodedFilename,
            $sanitizedFilename,
        ]));

        $release = ManagerRelease::query()
            ->where(function ($query) use ($filenameCandidates): void {
                $query->whereIn('original_filename', $filenameCandidates);

                foreach ($filenameCandidates as $filenameCandidate) {
                    $query->orWhere('storage_path', 'like', '%/'.$filenameCandidate);
                }
            })
            ->latest('pub_date')
            ->latest()
            ->firstOrFail();

        return $storage->download($release);
    }
}
