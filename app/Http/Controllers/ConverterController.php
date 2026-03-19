<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreConverterRequest;
use App\Support\ImageConverter;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Throwable;
use ZipArchive;

class ConverterController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('converter/create', [
            'supportedFormats' => ImageConverter::supportedExtensions(),
        ]);
    }

    public function store(StoreConverterRequest $request, ImageConverter $imageConverter): SymfonyResponse|RedirectResponse
    {
        try {
            $convertedImages = array_map(
                fn ($image) => $imageConverter->convert($image, $request->outputFormat()),
                $request->images(),
            );
        } catch (Throwable $exception) {
            report($exception);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'We could not convert that image right now. Please try another file.',
                    'errors' => [
                        'images' => ['We could not convert that image right now. Please try another file.'],
                    ],
                ], 422);
            }

            return back()
                ->withErrors([
                    'images' => 'We could not convert that image right now. Please try another file.',
                ])
                ->withInput();
        }

        if (count($convertedImages) === 1) {
            $convertedImage = $convertedImages[0];

            return response($convertedImage['contents'], 200, [
                'Content-Type' => $convertedImage['mime_type'],
                'Content-Disposition' => sprintf('attachment; filename="%s"', $convertedImage['filename']),
                'Cache-Control' => 'no-store, private',
            ]);
        }

        return $this->downloadArchive($convertedImages, $request->outputFormat());
    }

    /**
     * @param  list<array{contents: string, filename: string, mime_type: string}>  $convertedImages
     */
    protected function downloadArchive(array $convertedImages, string $outputFormat): SymfonyResponse
    {
        $temporaryZipPath = sprintf(
            '%s/%s.zip',
            sys_get_temp_dir(),
            uniqid('converted-images-', true),
        );

        $zipArchive = new ZipArchive;
        $openResult = $zipArchive->open($temporaryZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        if ($openResult !== true) {
            throw new \RuntimeException('Unable to create the converted image archive.');
        }

        $usedFileNames = [];

        foreach ($convertedImages as $index => $convertedImage) {
            $archiveFileName = $convertedImage['filename'];

            while (in_array($archiveFileName, $usedFileNames, true)) {
                $archiveFileName = sprintf(
                    '%s-%d.%s',
                    pathinfo($convertedImage['filename'], PATHINFO_FILENAME),
                    $index + 1,
                    $outputFormat,
                );
            }

            $usedFileNames[] = $archiveFileName;
            $zipArchive->addFromString($archiveFileName, $convertedImage['contents']);
        }

        $zipArchive->close();

        return response()->download(
            $temporaryZipPath,
            sprintf('converted-images-%s.zip', $outputFormat),
            [
                'Content-Type' => 'application/zip',
                'Cache-Control' => 'no-store, private',
            ],
        )->deleteFileAfterSend();
    }
}
