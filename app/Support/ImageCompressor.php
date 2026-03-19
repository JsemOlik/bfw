<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Imagick;
use ImagickException;
use ImagickPixel;
use RuntimeException;

class ImageCompressor
{
    /**
     * @return list<string>
     */
    public static function supportedExtensions(): array
    {
        return ['png', 'jpg', 'webp'];
    }

    /**
     * @return array{contents: string, filename: string, mime_type: string}
     */
    public function compress(UploadedFile $file, string $mode, int $quality, int $targetSizeBytes): array
    {
        if (! extension_loaded('imagick')) {
            throw new RuntimeException('Imagick is not available.');
        }

        $normalizedExtension = $this->normalizeExtension($file->getClientOriginalExtension());
        $image = $this->readImage($file);

        $compressedImage = $mode === 'target_size'
            ? $this->compressToTarget($image, $normalizedExtension, $quality, $targetSizeBytes)
            : $this->encodeImage($image, $normalizedExtension, $quality);

        $baseName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

        return [
            'contents' => $compressedImage,
            'filename' => sprintf('%s.%s', $baseName !== '' ? $baseName : 'compressed-image', $normalizedExtension),
            'mime_type' => $this->mimeType($normalizedExtension),
        ];
    }

    protected function compressToTarget(
        Imagick $image,
        string $extension,
        int $startingQuality,
        int $targetSizeBytes,
    ): string {
        $currentQuality = min(max($startingQuality, 10), 95);
        $workingImage = clone $image;
        $bestBlob = $this->encodeImage($workingImage, $extension, $currentQuality);

        if (strlen($bestBlob) <= $targetSizeBytes) {
            return $bestBlob;
        }

        for ($attempt = 0; $attempt < 8; $attempt++) {
            $blob = $this->encodeImage($workingImage, $extension, $currentQuality);

            if (strlen($blob) < strlen($bestBlob)) {
                $bestBlob = $blob;
            }

            if (strlen($blob) <= $targetSizeBytes) {
                return $blob;
            }

            if (in_array($extension, ['jpg', 'webp'], true) && $currentQuality > 20) {
                $currentQuality = max(20, $currentQuality - 10);

                continue;
            }

            $resized = $this->resizeDown($workingImage);

            if (! $resized) {
                break;
            }

            $currentQuality = min($currentQuality, 80);
        }

        return $bestBlob;
    }

    protected function encodeImage(Imagick $image, string $extension, int $quality): string
    {
        $normalizedExtension = $this->normalizeExtension($extension);
        $encodedImage = clone $image;

        if ($normalizedExtension === 'jpg') {
            $encodedImage = $this->flattenOnWhiteBackground($encodedImage);
        }

        $encodedImage->stripImage();
        $encodedImage->setImageFormat($this->imagickFormat($normalizedExtension));

        if (in_array($normalizedExtension, ['jpg', 'webp'], true)) {
            $encodedImage->setImageCompressionQuality($quality);
        }

        if ($normalizedExtension === 'png') {
            $encodedImage->setImageCompression(Imagick::COMPRESSION_ZIP);
            $encodedImage->setImageCompressionQuality($quality);
        }

        return $encodedImage->getImageBlob();
    }

    protected function resizeDown(Imagick $image): bool
    {
        $currentWidth = $image->getImageWidth();
        $currentHeight = $image->getImageHeight();
        $nextWidth = max(160, (int) floor($currentWidth * 0.88));
        $nextHeight = max(160, (int) floor($currentHeight * 0.88));

        if ($nextWidth === $currentWidth && $nextHeight === $currentHeight) {
            return false;
        }

        $image->resizeImage($nextWidth, $nextHeight, Imagick::FILTER_LANCZOS, 1);

        return true;
    }

    protected function normalizeExtension(string $extension): string
    {
        $normalizedExtension = strtolower($extension);

        return $normalizedExtension === 'jpeg' ? 'jpg' : $normalizedExtension;
    }

    protected function imagickFormat(string $extension): string
    {
        return match ($this->normalizeExtension($extension)) {
            'jpg' => 'jpeg',
            default => $this->normalizeExtension($extension),
        };
    }

    protected function mimeType(string $extension): string
    {
        return match ($this->normalizeExtension($extension)) {
            'jpg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            default => 'application/octet-stream',
        };
    }

    protected function readImage(UploadedFile $file): Imagick
    {
        $normalizedExtension = $this->normalizeExtension($file->getClientOriginalExtension());
        $temporaryPath = sprintf(
            '%s/%s.%s',
            sys_get_temp_dir(),
            uniqid('compressor-', true),
            $normalizedExtension !== '' ? $normalizedExtension : 'tmp',
        );

        try {
            file_put_contents($temporaryPath, (string) $file->get());

            $image = new Imagick($temporaryPath);

            if (method_exists($image, 'autoOrient')) {
                $image->autoOrient();
            }

            return $image;
        } catch (ImagickException $exception) {
            throw new RuntimeException('Unable to read the uploaded image.', previous: $exception);
        } finally {
            if (file_exists($temporaryPath)) {
                unlink($temporaryPath);
            }
        }
    }

    protected function flattenOnWhiteBackground(Imagick $image): Imagick
    {
        $flattened = new Imagick;
        $flattened->newImage(
            $image->getImageWidth(),
            $image->getImageHeight(),
            new ImagickPixel('white'),
        );
        $flattened->compositeImage($image, Imagick::COMPOSITE_OVER, 0, 0);

        return $flattened;
    }
}
