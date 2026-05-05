<?php

use App\Models\ManagerRelease;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'filesystems.manager_disk' => 'public',
        'filesystems.manager_cdn_url' => 'https://cdn.bfw.cz',
        'services.manager.api_token' => 'secret-manager-token',
    ]);
});

it('rejects manager api uploads without a valid token', function () {
    $installer = UploadedFile::fake()->create(
        '4CAMPS.Manager_1.4.0_x64_en-US.msi.zip',
        128,
        'application/zip',
    );

    $response = $this->post('/api/4c-manager/releases', [
        'payload' => json_encode([
            'version' => '1.4.0',
            'notes' => '',
            'pub_date' => '2025-07-01T12:24:47.829Z',
            'platforms' => [
                'windows-x86_64' => [
                    'signature' => 'signed-by-tauri',
                ],
            ],
        ], JSON_THROW_ON_ERROR),
        'installer' => $installer,
        'is_active' => true,
    ]);

    $response->assertUnauthorized();
    expect(ManagerRelease::query()->exists())->toBeFalse();
});

it('creates a manager release from api payload and uploaded file', function () {
    Storage::fake('public');

    $installer = UploadedFile::fake()->create(
        '4CAMPS.Manager_1.4.0_x64_en-US.msi.zip',
        128,
        'application/zip',
    );

    $response = $this
        ->withToken('secret-manager-token')
        ->post('/api/4c-manager/releases', [
            'payload' => json_encode([
                'version' => '1.4.0',
                'notes' => 'Ship it',
                'pub_date' => '2025-07-01T12:24:47.829Z',
                'platforms' => [
                    'windows-x86_64' => [
                        'signature' => 'signed-by-tauri',
                        'url' => 'https://ignored.example/file.zip',
                    ],
                ],
            ], JSON_THROW_ON_ERROR),
            'installer' => $installer,
            'is_active' => false,
        ]);

    $response->assertCreated()
        ->assertJsonPath('message', '4C Manager release uploaded via API.')
        ->assertJsonPath('release.version', '1.4.0')
        ->assertJsonPath('release.platform', 'windows-x86_64')
        ->assertJsonPath('release.signature', 'signed-by-tauri')
        ->assertJsonPath('release.is_active', false)
        ->assertJsonPath('release.download_url', 'https://cdn.bfw.cz/4c-manager/releases/1.4.0/4CAMPS.Manager_1.4.0_x64_en-US.msi.zip');

    $release = ManagerRelease::query()->sole();

    expect($release->version)->toBe('1.4.0')
        ->and($release->is_active)->toBeFalse()
        ->and($release->notes)->toBe('Ship it')
        ->and($release->platform)->toBe('windows-x86_64')
        ->and($release->signature)->toBe('signed-by-tauri')
        ->and($release->storage_path)->toBe('4c-manager/releases/1.4.0/4CAMPS.Manager_1.4.0_x64_en-US.msi.zip');

    Storage::disk('public')->assertExists($release->storage_path);
    $this->get(route('manager.json'))->assertNotFound();
});
