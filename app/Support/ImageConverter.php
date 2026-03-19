<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Imagick;
use ImagickException;
use ImagickPixel;
use RuntimeException;

class ImageConverter
{
    /**
     * @return list<string>
     */
    public static function supportedExtensions(): array
    {
        return ['png', 'jpg', 'gif', 'webp', 'ico'];
    }

    /**
     * @return array{contents: string, filename: string, mime_type: string}
     */
    public function convert(UploadedFile $file, string $outputExtension): array
    {
        if (! extension_loaded('imagick')) {
            throw new RuntimeException('Imagick is not available.');
        }

        $normalizedOutputExtension = $this->normalizeExtension($outputExtension);
        $image = $this->readImage($file);

        if ($normalizedOutputExtension === 'jpg') {
            $image = $this->flattenOnWhiteBackground($image);
        }

        if ($normalizedOutputExtension === 'ico') {
            $image->thumbnailImage(256, 256, true, true);
        }

        $image->stripImage();
        $image->setImageFormat($this->imagickFormat($normalizedOutputExtension));

        if (in_array($normalizedOutputExtension, ['jpg', 'webp'], true)) {
            $image->setImageCompressionQuality(90);
        }

        $baseName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

        return [
            'contents' => $image->getImageBlob(),
            'filename' => sprintf('%s.%s', $baseName !== '' ? $baseName : 'converted-image', $normalizedOutputExtension),
            'mime_type' => $this->mimeType($normalizedOutputExtension),
        ];
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
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'ico' => 'image/x-icon',
            default => 'application/octet-stream',
        };
    }

    protected function readImage(UploadedFile $file): Imagick
    {
        $normalizedExtension = $this->normalizeExtension($file->getClientOriginalExtension());
        $temporaryPath = sprintf(
            '%s/%s.%s',
            sys_get_temp_dir(),
            uniqid('converter-', true),
            $normalizedExtension !== '' ? $normalizedExtension : 'tmp',
        );

        try {
            file_put_contents($temporaryPath, (string) $file->get());

            $image = new Imagick($temporaryPath);

            if ($image->getNumberImages() > 1) {
                $coalesced = $image->coalesceImages();
                $coalesced->setFirstIterator();
                $image = $coalesced->getImage();
            }

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
