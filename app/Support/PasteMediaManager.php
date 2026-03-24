<?php

namespace App\Support;

use App\Models\Paste;
use Illuminate\Filesystem\AwsS3V3Adapter;
use Illuminate\Http\RedirectResponse;
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
    public function storeUploadedFile(UploadedFile $file): array
    {
        return $this->storeUploadedMedia($file, 'file');
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
            'file' => 'files',
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
            throw new RuntimeException('Unable to store uploaded media.');
        }

        $stored = $this->storeContents($disk, $path, $contents, $file);

        if ($stored === false) {
            throw new RuntimeException('Unable to store uploaded media.');
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
        if (! $paste->isStoredUpload() || ! $paste->storage_path) {
            return;
        }

        $this->deleteFile(
            $paste->storage_disk ?: config('filesystems.default_media_disk', 'public'),
            $paste->storage_path,
        );
    }

    public function download(Paste $paste): RedirectResponse
    {
        $url = $this->url($paste);

        if (Str::startsWith($url, ['http://', 'https://'])) {
            return redirect()->away($url);
        }

        return redirect($url);
    }

    public function deleteFile(string $disk, string $path): void
    {
        $path = ltrim($path, '/');

        if ($path === '') {
            return;
        }

        if ($this->permanentlyDeleteBackblazeObject($disk, $path)) {
            return;
        }

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

    protected function permanentlyDeleteBackblazeObject(string $disk, string $path): bool
    {
        $filesystem = Storage::disk($disk);
        $endpoint = (string) config("filesystems.disks.{$disk}.endpoint", '');

        if (! $filesystem instanceof AwsS3V3Adapter || ! str_contains($endpoint, 'backblazeb2.com')) {
            return false;
        }

        $bucket = (string) config("filesystems.disks.{$disk}.bucket", '');

        if ($bucket === '') {
            return false;
        }

        $client = $filesystem->getClient();
        $versionIds = [];

        foreach ($client->getPaginator('ListObjectVersions', [
            'Bucket' => $bucket,
            'Prefix' => $path,
        ]) as $page) {
            foreach (['Versions', 'DeleteMarkers'] as $entryKey) {
                foreach ($page[$entryKey] ?? [] as $entry) {
                    if (($entry['Key'] ?? null) !== $path || ! is_string($entry['VersionId'] ?? null)) {
                        continue;
                    }

                    $versionIds[] = $entry['VersionId'];
                }
            }
        }

        foreach (array_unique($versionIds) as $versionId) {
            $client->deleteObject([
                'Bucket' => $bucket,
                'Key' => $path,
                'VersionId' => $versionId,
            ]);
        }

        return true;
    }
}
