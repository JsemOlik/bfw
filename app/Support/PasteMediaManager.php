<?php

namespace App\Support;

use App\Models\Paste;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class PasteMediaManager
{
    /**
     * @return array{
     *     disk: string,
     *     path: string,
     *     mime_type: string,
     *     size_bytes: int,
     *     image_width: int|null,
     *     image_height: int|null,
     *     original_filename: string
     * }
     */
    public function storeUploadedImage(UploadedFile $file): array
    {
        return $this->storeUploadedMedia($file, 'image');
    }

    /**
     * @return array{
     *     disk: string,
     *     path: string,
     *     mime_type: string,
     *     size_bytes: int,
     *     image_width: int|null,
     *     image_height: int|null,
     *     original_filename: string
     * }
     */
    public function storeUploadedVideo(UploadedFile $file): array
    {
        return $this->storeUploadedMedia($file, 'video');
    }

    /**
     * @return array{
     *     disk: string,
     *     path: string,
     *     mime_type: string,
     *     size_bytes: int,
     *     image_width: int|null,
     *     image_height: int|null,
     *     original_filename: string
     * }
     */
    protected function storeUploadedMedia(UploadedFile $file, string $type): array
    {
        $disk = (string) config('filesystems.default_media_disk', 'public');
        $extension = $file->guessExtension() ?: $file->extension() ?: 'bin';
        $directory = match ($type) {
            'image' => 'images',
            'video' => 'videos',
            default => throw new RuntimeException('Unsupported media type.'),
        };
        $path = sprintf(
            'pastes/%s/%s/%s/%s.%s',
            $directory,
            now()->format('Y/m'),
            Str::uuid(),
            Str::random(12),
            $extension,
        );
        $contents = @file_get_contents($file->getRealPath() ?: '');

        if (! is_string($contents)) {
            throw new RuntimeException('Unable to store uploaded image.');
        }

        $stored = $this->storeContents($disk, $path, $contents, $file);

        if ($stored === false) {
            throw new RuntimeException('Unable to store uploaded image.');
        }

        [$width, $height] = $type === 'image'
            ? $this->imageDimensions($file)
            : [null, null];

        return [
            'disk' => $disk,
            'path' => $path,
            'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
            'size_bytes' => $file->getSize() ?: 0,
            'image_width' => $width,
            'image_height' => $height,
            'original_filename' => $file->getClientOriginalName(),
        ];
    }

    public function url(Paste $paste): string
    {
        $path = ltrim((string) $paste->storage_path, '/');
        $cdnUrl = config('filesystems.paste_media_cdn_url');

        if (is_string($cdnUrl) && $cdnUrl !== '') {
            return rtrim($cdnUrl, '/').'/'.$path;
        }

        return Storage::disk($paste->storage_disk ?: config('filesystems.default_media_disk', 'public'))
            ->url($path);
    }

    public function delete(Paste $paste): void
    {
        if (! $paste->isMedia() || ! $paste->storage_path) {
            return;
        }

        Storage::disk($paste->storage_disk ?: config('filesystems.default_media_disk', 'public'))
            ->delete($paste->storage_path);
    }

    public function deleteFile(string $disk, string $path): void
    {
        Storage::disk($disk)->delete($path);
    }

    protected function storeContents(string $disk, string $path, string $contents, UploadedFile $file): bool
    {
        $filesystem = Storage::disk($disk);
        $visibility = (string) config("filesystems.disks.{$disk}.visibility", 'public');

        return $filesystem->put(
            $path,
            $contents,
            ['visibility' => $visibility],
        );
    }

    /**
     * @return array{0: int|null, 1: int|null}
     */
    protected function imageDimensions(UploadedFile $file): array
    {
        $dimensions = @getimagesize($file->getRealPath() ?: '');

        if ($dimensions === false) {
            return [null, null];
        }

        return [$dimensions[0] ?? null, $dimensions[1] ?? null];
    }
}
