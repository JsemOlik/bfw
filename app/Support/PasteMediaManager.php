<?php

namespace App\Support;

use App\Models\Paste;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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
        $disk = (string) config('filesystems.default_media_disk', 'public');
        $extension = $file->guessExtension() ?: $file->extension() ?: 'bin';
        $path = $file->storeAs(
            sprintf('pastes/images/%s/%s', now()->format('Y/m'), Str::uuid()),
            sprintf('%s.%s', Str::random(12), $extension),
            $disk,
        );

        [$width, $height] = $this->imageDimensions($file);

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
        if (! $paste->isImage() || ! $paste->storage_path) {
            return;
        }

        Storage::disk($paste->storage_disk ?: config('filesystems.default_media_disk', 'public'))
            ->delete($paste->storage_path);
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
