<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreConverterRequest;
use App\Support\ImageConverter;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Throwable;

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
            $convertedImage = $imageConverter->convert(
                $request->file('image'),
                $request->outputFormat(),
            );
        } catch (Throwable $exception) {
            report($exception);

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'We could not convert that image right now. Please try another file.',
                    'errors' => [
                        'image' => ['We could not convert that image right now. Please try another file.'],
                    ],
                ], 422);
            }

            return back()
                ->withErrors([
                    'image' => 'We could not convert that image right now. Please try another file.',
                ])
                ->withInput();
        }

        return response($convertedImage['contents'], 200, [
            'Content-Type' => $convertedImage['mime_type'],
            'Content-Disposition' => sprintf('attachment; filename="%s"', $convertedImage['filename']),
            'Cache-Control' => 'no-store, private',
        ]);
    }
}
