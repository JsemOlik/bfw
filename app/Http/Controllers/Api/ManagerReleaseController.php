<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreManagerApiReleaseRequest;
use App\Models\ManagerRelease;
use App\Support\ManagerReleaseStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ManagerReleaseController extends Controller
{
    public function store(
        StoreManagerApiReleaseRequest $request,
        ManagerReleaseStorage $storage,
    ): JsonResponse {
        $validated = $request->validated();
        $storedFile = $storage->store($request->file('installer'), $validated['version']);
        $isActive = (bool) $validated['is_active'];

        $release = DB::transaction(function () use ($validated, $storedFile, $isActive): ManagerRelease {
            if ($isActive) {
                ManagerRelease::query()->update(['is_active' => false]);
            }

            return ManagerRelease::create([
                'version' => $validated['version'],
                'notes' => $validated['notes'] ?? null,
                'pub_date' => $validated['pub_date'],
                'platform' => $validated['platform'],
                'signature' => $validated['signature'] ?? null,
                'storage_disk' => $storedFile['disk'],
                'storage_path' => $storedFile['path'],
                'original_filename' => $storedFile['filename'],
                'mime_type' => $storedFile['mime_type'],
                'size_bytes' => $storedFile['size_bytes'],
                'is_active' => $isActive,
            ]);
        });

        $release->refresh();

        return response()->json([
            'id' => $release->id,
            'message' => '4C Manager release uploaded via API.',
            'release' => [
                'version' => $release->version,
                'notes' => $release->notes ?? '',
                'pub_date' => $release->pub_date->toJSON(),
                'platform' => $release->platform,
                'signature' => $release->signature ?? '',
                'is_active' => $release->is_active,
                'original_filename' => $release->original_filename,
                'size_bytes' => $release->size_bytes,
                'download_url' => $release->downloadUrl(),
                'updater_json' => $release->updaterJson(),
            ],
        ], 201);
    }
}
