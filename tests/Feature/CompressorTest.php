<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

function fakeCompressibleImage(string $extension, ?string $name = null): UploadedFile
{
    $normalizedExtension = strtolower($extension);
    $imagickFormat = $normalizedExtension === 'jpeg' ? 'jpeg' : $normalizedExtension;
    $mimeType = match ($normalizedExtension) {
        'jpg', 'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'webp' => 'image/webp',
        default => 'application/octet-stream',
    };

    $image = new Imagick;
    $image->newImage(320, 240, new ImagickPixel('white'));
    $image->setImageFormat($imagickFormat);

    if (in_array($normalizedExtension, ['jpg', 'jpeg', 'webp'], true)) {
        $image->setImageCompressionQuality(92);
    }

    return UploadedFile::fake()
        ->createWithContent($name ?? "sample.$normalizedExtension", $image->getImageBlob())
        ->mimeType($mimeType);
}

it('can see the compressor page', function () {
    $response = $this->get(route('compressor.create'));

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('compressor/create')
            ->where('supportedFormats', ['png', 'jpg', 'webp'])
        );
});

it('compresses a single image by quality and returns a download', function () {
    $response = $this->post(route('compressor.store'), [
        'images' => [fakeCompressibleImage('jpg')],
        'compression_mode' => 'quality',
        'quality' => 45,
        'target_size_mb' => 1,
    ]);

    $response->assertSuccessful()
        ->assertDownload('sample.jpg')
        ->assertHeader('content-type', 'image/jpeg');
    expect($response->getContent())->not->toBeEmpty();
});

it('compresses a single image toward a target size', function () {
    $response = $this->post(route('compressor.store'), [
        'images' => [fakeCompressibleImage('jpg')],
        'compression_mode' => 'target_size',
        'quality' => 75,
        'target_size_mb' => 0.25,
    ]);

    $response->assertSuccessful()
        ->assertDownload('sample.jpg')
        ->assertHeader('content-type', 'image/jpeg');
    expect($response->getContent())->not->toBeEmpty();
});

it('compresses multiple images into a zip download', function () {
    $response = $this->post(route('compressor.store'), [
        'images' => [
            fakeCompressibleImage('png'),
            fakeCompressibleImage('webp', 'hero.webp'),
        ],
        'compression_mode' => 'quality',
        'quality' => 60,
        'target_size_mb' => 1,
    ]);

    $response->assertSuccessful()
        ->assertDownload('compressed-images.zip')
        ->assertHeader('content-type', 'application/zip');

    expect($response->baseResponse->getFile()->getSize())->toBeGreaterThan(0);
});

it('rejects unsupported compression formats', function () {
    $response = $this->from(route('compressor.create'))->post(route('compressor.store'), [
        'images' => [
            UploadedFile::fake()->create('vector.svg', 10, 'image/svg+xml'),
        ],
        'compression_mode' => 'quality',
        'quality' => 75,
        'target_size_mb' => 1,
    ]);

    $response->assertRedirect(route('compressor.create'))
        ->assertSessionHasErrors('images.0');
});

it('rejects more than twenty images at once', function () {
    $response = $this->from(route('compressor.create'))->post(route('compressor.store'), [
        'images' => array_map(
            fn (int $index) => fakeCompressibleImage('png', "sample-$index.png"),
            range(1, 21),
        ),
        'compression_mode' => 'quality',
        'quality' => 75,
        'target_size_mb' => 1,
    ]);

    $response->assertRedirect(route('compressor.create'))
        ->assertSessionHasErrors('images');
});

it('rejects unsupported compression modes', function () {
    $response = $this->from(route('compressor.create'))->post(route('compressor.store'), [
        'images' => [fakeCompressibleImage('png')],
        'compression_mode' => 'magic',
        'quality' => 75,
        'target_size_mb' => 1,
    ]);

    $response->assertRedirect(route('compressor.create'))
        ->assertSessionHasErrors('compression_mode');
});
