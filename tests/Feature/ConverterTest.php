<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

function fakeConvertibleImage(string $extension): UploadedFile
{
    $normalizedExtension = strtolower($extension);
    $imagickFormat = in_array($normalizedExtension, ['jpg', 'jpeg'], true) ? 'jpeg' : $normalizedExtension;
    $mimeType = match ($normalizedExtension) {
        'jpg', 'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'ico' => 'image/x-icon',
        default => 'application/octet-stream',
    };

    $image = new Imagick;
    $image->newImage(96, 64, new ImagickPixel(in_array($normalizedExtension, ['jpg', 'jpeg'], true) ? 'white' : 'transparent'));
    $image->setImageFormat($imagickFormat);

    if ($normalizedExtension === 'ico') {
        $image->thumbnailImage(64, 64, true, true);
    }

    return UploadedFile::fake()
        ->createWithContent("sample.$normalizedExtension", $image->getImageBlob())
        ->mimeType($mimeType);
}

it('can see the converter page', function () {
    $response = $this->get(route('converter.create'));

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('converter/create')
            ->where('supportedFormats', ['png', 'jpg', 'gif', 'webp', 'ico'])
        );
});

it('converts raster images and returns a download', function (string $sourceExtension, string $outputFormat, string $expectedMimeType, string $expectedDownloadName) {
    $response = $this->post(route('converter.store'), [
        'image' => fakeConvertibleImage($sourceExtension),
        'output_format' => $outputFormat,
    ]);

    $response->assertSuccessful()
        ->assertDownload($expectedDownloadName)
        ->assertHeader('content-type', $expectedMimeType);

    expect($response->getContent())->not->toBeEmpty();
})->with([
    'png to jpg' => ['png', 'jpg', 'image/jpeg', 'sample.jpg'],
    'jpg to png' => ['jpg', 'png', 'image/png', 'sample.png'],
    'jpeg to webp' => ['jpeg', 'webp', 'image/webp', 'sample.webp'],
    'gif to webp' => ['gif', 'webp', 'image/webp', 'sample.webp'],
    'png to ico' => ['png', 'ico', 'image/x-icon', 'sample.ico'],
    'ico to png' => ['ico', 'png', 'image/png', 'sample.png'],
]);

it('rejects unsupported formats', function () {
    $response = $this->from(route('converter.create'))->post(route('converter.store'), [
        'image' => UploadedFile::fake()->create('vector.svg', 10, 'image/svg+xml'),
        'output_format' => 'png',
    ]);

    $response->assertRedirect(route('converter.create'))
        ->assertSessionHasErrors('image');
});

it('rejects svg as an output format', function () {
    $response = $this->from(route('converter.create'))->post(route('converter.store'), [
        'image' => fakeConvertibleImage('png'),
        'output_format' => 'svg',
    ]);

    $response->assertRedirect(route('converter.create'))
        ->assertSessionHasErrors('output_format');
});
