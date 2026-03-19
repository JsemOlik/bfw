<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCompressorRequest;
use App\Support\ImageCompressor;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Throwable;
use ZipArchive;

class CompressorController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('compressor/create', [
            'supportedFormats' => ImageCompressor::supportedExtensions(),
        ]);
    }

    public function store(StoreCompressorRequest $request, ImageCompressor $imageCompressor): SymfonyResponse|RedirectResponse
    {
        try {
            $compressedImages = array_map(
                fn ($image) => $imageCompressor->compress(
                    $image,
                    $request->compressionMode(),
                    $request->quality(),
                    $request->targetSizeBytes(),
                ),
                $request->images(),
            );
        } catch (Throwable $exception) {
            report($exception);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'We could not compress that image right now. Please try another file.',
                    'errors' => [
                        'images' => ['We could not compress that image right now. Please try another file.'],
                    ],
                ], 422);
            }

            return back()
                ->withErrors([
                    'images' => 'We could not compress that image right now. Please try another file.',
                ])
                ->withInput();
        }

        if (count($compressedImages) === 1) {
            $compressedImage = $compressedImages[0];

            return response($compressedImage['contents'], 200, [
                'Content-Type' => $compressedImage['mime_type'],
                'Content-Disposition' => sprintf('attachment; filename="%s"', $compressedImage['filename']),
                'Cache-Control' => 'no-store, private',
            ]);
        }

        return $this->downloadArchive($compressedImages);
    }

    /**
     * @param  list<array{contents: string, filename: string, mime_type: string}>  $compressedImages
     */
    protected function downloadArchive(array $compressedImages): SymfonyResponse
    {
        $temporaryZipPath = sprintf(
            '%s/%s.zip',
            sys_get_temp_dir(),
            uniqid('compressed-images-', true),
        );

        $zipArchive = new ZipArchive;
        $openResult = $zipArchive->open($temporaryZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        if ($openResult !== true) {
            throw new \RuntimeException('Unable to create the compressed image archive.');
        }

        $usedFileNames = [];

        foreach ($compressedImages as $index => $compressedImage) {
            $archiveFileName = $compressedImage['filename'];

            while (in_array($archiveFileName, $usedFileNames, true)) {
                $archiveFileName = sprintf(
                    '%s-%d.%s',
                    pathinfo($compressedImage['filename'], PATHINFO_FILENAME),
                    $index + 1,
                    pathinfo($compressedImage['filename'], PATHINFO_EXTENSION),
                );
            }

            $usedFileNames[] = $archiveFileName;
            $zipArchive->addFromString($archiveFileName, $compressedImage['contents']);
        }

        $zipArchive->close();

        return response()->download(
            $temporaryZipPath,
            'compressed-images.zip',
            [
                'Content-Type' => 'application/zip',
                'Cache-Control' => 'no-store, private',
            ],
        )->deleteFileAfterSend();
    }
}
