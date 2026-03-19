<?php

use App\Models\Link;
use App\Models\Paste;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

function fakeRateLimitedImage(string $extension = 'png', ?string $name = null): UploadedFile
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
    $image->newImage(120, 80, new ImagickPixel('white'));
    $image->setImageFormat($imagickFormat);

    if (in_array($normalizedExtension, ['jpg', 'jpeg', 'webp'], true)) {
        $image->setImageCompressionQuality(90);
    }

    return UploadedFile::fake()
        ->createWithContent($name ?? "sample.$normalizedExtension", $image->getImageBlob())
        ->mimeType($mimeType);
}

it('rate limits guest compressions by ip', function () {
    $this->from(route('compressor.create'))->post(route('compressor.store'), [
        'images' => [fakeRateLimitedImage('jpg')],
        'compression_mode' => 'quality',
        'quality' => 60,
        'target_size_value' => 1,
        'target_size_unit' => 'mb',
    ])->assertSuccessful();

    $response = $this->from(route('compressor.create'))->post(route('compressor.store'), [
        'images' => [fakeRateLimitedImage('jpg', 'second.jpg')],
        'compression_mode' => 'quality',
        'quality' => 60,
        'target_size_value' => 1,
        'target_size_unit' => 'mb',
    ]);

    $response->assertRedirect(route('compressor.create'))
        ->assertSessionHasErrors('images');
});

it('rate limits guest conversions by ip', function () {
    $this->from(route('converter.create'))->post(route('converter.store'), [
        'images' => [fakeRateLimitedImage('png')],
        'output_format' => 'jpg',
    ])->assertSuccessful();

    $response = $this->from(route('converter.create'))->post(route('converter.store'), [
        'images' => [fakeRateLimitedImage('png', 'second.png')],
        'output_format' => 'jpg',
    ]);

    $response->assertRedirect(route('converter.create'))
        ->assertSessionHasErrors('images');
});

it('rate limits guest link creation by ip', function () {
    $this->from(route('link.create'))->post(route('link.store'), [
        'url' => 'https://example.com/first',
    ])->assertRedirect(route('link.create'));

    $response = $this->from(route('link.create'))->post(route('link.store'), [
        'url' => 'https://example.com/second',
    ]);

    $response->assertRedirect(route('link.create'))
        ->assertSessionHasErrors('url');

    expect(Link::count())->toBe(1);
});

it('rate limits guest paste creation by ip', function () {
    $this->from(route('paste.create'))->post(route('paste.store'), [
        'content' => 'first paste',
        'syntax' => 'plaintext',
    ])->assertRedirect(route('paste.create'));

    $response = $this->from(route('paste.create'))->post(route('paste.store'), [
        'content' => 'second paste',
        'syntax' => 'plaintext',
    ]);

    $response->assertRedirect(route('paste.create'))
        ->assertSessionHasErrors('content');

    expect(Paste::count())->toBe(1);
});
