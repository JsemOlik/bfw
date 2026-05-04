<?php

namespace App\Support;

use App\Models\ManagerRelease;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ManagerReleaseStorage
{
    /**
     * @return array{disk: string, path: string, filename: string, mime_type: string, size_bytes: int}
     */
    public function store(UploadedFile $file, string $version): array
    {
        $disk = (string) config('filesystems.manager_disk', 'public');
        $filename = $this->sanitizeFilename($file->getClientOriginalName());
        $path = sprintf('4c-manager/releases/%s/%s', $version, $filename);
        $visibility = (string) config("filesystems.disks.{$disk}.visibility", 'public');

        $storedPath = Storage::disk($disk)->putFileAs(
            dirname($path),
            $file,
            basename($path),
            ['visibility' => $visibility],
        );

        if ($storedPath === false) {
            throw new RuntimeException('Unable to store the 4C Manager release file.');
        }

        return [
            'disk' => $disk,
            'path' => $storedPath,
            'filename' => $filename,
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size_bytes' => $file->getSize() ?: 0,
        ];
    }

    public function url(ManagerRelease $release): string
    {
        $cdnUrl = config('filesystems.manager_cdn_url');

        if (is_string($cdnUrl) && $cdnUrl !== '') {
            return rtrim($cdnUrl, '/').'/'.ltrim($release->storage_path, '/');
        }

        return Storage::disk($release->storage_disk)->url($release->storage_path);
    }

    public function download(ManagerRelease $release): RedirectResponse
    {
        $url = $this->url($release);

        if (Str::startsWith($url, ['http://', 'https://'])) {
            return redirect()->away($url);
        }

        return redirect($url);
    }

    public function delete(ManagerRelease $release): void
    {
        Storage::disk($release->storage_disk)->delete($release->storage_path);
    }

    protected function sanitizeFilename(string $filename): string
    {
        $basename = basename($filename);
        $sanitized = preg_replace('/[^A-Za-z0-9._-]+/', '-', $basename) ?: '';
        $sanitized = trim($sanitized, '.-');

        return $sanitized !== '' ? $sanitized : Str::uuid()->toString().'.bin';
    }
}
