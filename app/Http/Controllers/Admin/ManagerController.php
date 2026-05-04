<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreManagerReleaseRequest;
use App\Http\Requests\Admin\UpdateManagerReleaseRequest;
use App\Models\ManagerRelease;
use App\Support\ManagerReleaseStorage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ManagerController extends Controller
{
    public function index(ManagerReleaseStorage $storage): Response
    {
        $releases = ManagerRelease::query()
            ->latest('pub_date')
            ->latest()
            ->get()
            ->map(fn (ManagerRelease $release) => [
                'id' => $release->id,
                'version' => $release->version,
                'notes' => $release->notes ?? '',
                'pub_date' => $release->pub_date->toJSON(),
                'platform' => $release->platform,
                'signature' => $release->signature ?? '',
                'download_url' => $release->downloadUrl(),
                'storage_url' => $storage->url($release),
                'original_filename' => $release->original_filename,
                'mime_type' => $release->mime_type,
                'size_bytes' => $release->size_bytes,
                'is_active' => $release->is_active,
                'created_at' => $release->created_at->toDateTimeString(),
                'updated_at' => $release->updated_at->toDateTimeString(),
            ]);

        return Inertia::render('admin/manager/index', [
            'jsonUrl' => route('manager.json'),
            'releases' => $releases,
        ]);
    }

    public function store(
        StoreManagerReleaseRequest $request,
        ManagerReleaseStorage $storage,
    ): RedirectResponse {
        $validated = $request->validated();
        $storedFile = $storage->store($request->file('installer'), $validated['version']);
        $isActive = $request->boolean('is_active');

        DB::transaction(function () use ($validated, $storedFile, $isActive): void {
            if ($isActive) {
                ManagerRelease::query()->update(['is_active' => false]);
            }

            ManagerRelease::create([
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

        return to_route('admin.manager.index')->with('message', '4C Manager release uploaded.');
    }

    public function update(
        UpdateManagerReleaseRequest $request,
        ManagerRelease $release,
        ManagerReleaseStorage $storage,
    ): RedirectResponse {
        $validated = $request->validated();
        $oldRelease = $release->replicate();
        $storedFile = $request->hasFile('installer')
            ? $storage->store($request->file('installer'), $validated['version'])
            : null;
        $isActive = $request->boolean('is_active');

        DB::transaction(function () use ($release, $validated, $storedFile, $isActive): void {
            if ($isActive) {
                ManagerRelease::query()
                    ->whereKeyNot($release->id)
                    ->update(['is_active' => false]);
            }

            $release->fill([
                'version' => $validated['version'],
                'notes' => $validated['notes'] ?? null,
                'pub_date' => $validated['pub_date'],
                'platform' => $validated['platform'],
                'signature' => $validated['signature'] ?? null,
                'is_active' => $isActive,
            ]);

            if ($storedFile !== null) {
                $release->fill([
                    'storage_disk' => $storedFile['disk'],
                    'storage_path' => $storedFile['path'],
                    'original_filename' => $storedFile['filename'],
                    'mime_type' => $storedFile['mime_type'],
                    'size_bytes' => $storedFile['size_bytes'],
                ]);
            }

            $release->save();
        });

        if ($storedFile !== null) {
            $storage->delete($oldRelease);
        }

        return to_route('admin.manager.index')->with('message', '4C Manager release updated.');
    }

    public function destroy(
        ManagerRelease $release,
        ManagerReleaseStorage $storage,
    ): RedirectResponse {
        $storage->delete($release);

        $release->delete();

        return back()->with('message', '4C Manager release deleted.');
    }
}
