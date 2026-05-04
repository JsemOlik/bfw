<?php

use App\Models\ManagerRelease;
use App\Models\User;
use App\Support\ManagerReleaseStorage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
    config([
        'filesystems.manager_disk' => 'public',
        'filesystems.manager_cdn_url' => null,
    ]);
});

it('shows the 4c manager admin tab to admins', function () {
    config(['filesystems.manager_cdn_url' => 'https://cdn.bfw.cz']);

    $admin = User::factory()->admin()->create();

    ManagerRelease::factory()->active()->create([
        'version' => '1.4.0',
        'original_filename' => '4CAMPS.Manager_1.4.0_x64_en-US.msi.zip',
        'storage_path' => '4c-manager/releases/1.4.0/4CAMPS.Manager_1.4.0_x64_en-US.msi.zip',
    ]);

    expect(route('admin.manager.index', absolute: false))->toBe('/admin/4c-manager');

    $response = $this->actingAs($admin)->get('/admin/4c-manager');

    $response->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/manager/index')
            ->where('jsonUrl', route('manager.json'))
            ->has('releases', 1)
            ->where('releases.0.version', '1.4.0')
            ->where('releases.0.is_active', true)
            ->where('releases.0.download_url', 'https://cdn.bfw.cz/4c-manager/releases/1.4.0/4CAMPS.Manager_1.4.0_x64_en-US.msi.zip')
            ->etc()
        );
});

it('forbids non-admin users from managing 4c manager releases', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('admin.manager.index'))
        ->assertForbidden();
});

it('lets admins upload a release and exposes it through the permanent json endpoint', function () {
    Storage::fake('public');
    config(['filesystems.manager_cdn_url' => 'https://cdn.bfw.cz']);

    $admin = User::factory()->admin()->create();
    $installer = UploadedFile::fake()->create(
        '4CAMPS.Manager_1.4.0_x64_en-US.msi.zip',
        128,
        'application/zip',
    );

    $response = $this->actingAs($admin)->post(route('admin.manager.store'), [
        'version' => '1.4.0',
        'notes' => '',
        'pub_date' => '2025-07-01T12:24:47.829Z',
        'platform' => 'windows-x86_64',
        'signature' => 'signed-by-tauri',
        'installer' => $installer,
        'is_active' => true,
    ]);

    $response->assertRedirect(route('admin.manager.index'));

    $release = ManagerRelease::query()->sole();

    expect($release->version)->toBe('1.4.0')
        ->and($release->is_active)->toBeTrue()
        ->and($release->original_filename)->toBe('4CAMPS.Manager_1.4.0_x64_en-US.msi.zip')
        ->and($release->storage_path)->toBe('4c-manager/releases/1.4.0/4CAMPS.Manager_1.4.0_x64_en-US.msi.zip');

    Storage::disk('public')->assertExists($release->storage_path);

    $this->get(route('manager.json'))
        ->assertSuccessful()
        ->assertJsonPath('version', '1.4.0')
        ->assertJsonPath('notes', '')
        ->assertJsonPath('platforms.windows-x86_64.signature', 'signed-by-tauri')
        ->assertJsonPath('platforms.windows-x86_64.url', 'https://cdn.bfw.cz/4c-manager/releases/1.4.0/4CAMPS.Manager_1.4.0_x64_en-US.msi.zip');
});

it('lets admins upload an inactive release while the permanent json endpoint stays unavailable', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $installer = UploadedFile::fake()->create(
        '4CAMPS.Manager_1.4.0_x64_en-US.msi.zip',
        128,
        'application/zip',
    );

    $response = $this->actingAs($admin)->post(route('admin.manager.store'), [
        'version' => '1.4.0',
        'notes' => '',
        'pub_date' => '2025-07-01T12:24:47.829Z',
        'platform' => 'windows-x86_64',
        'signature' => 'signed-by-tauri',
        'installer' => $installer,
        'is_active' => false,
    ]);

    $response->assertRedirect(route('admin.manager.index'));

    expect(ManagerRelease::query()->sole()->is_active)->toBeFalse();

    $this->get(route('manager.json'))->assertNotFound();
});

it('rejects manager installer uploads larger than 250 mb', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $installer = UploadedFile::fake()->create(
        '4CAMPS.Manager_1.4.0_x64_en-US.msi.zip',
        256_001,
        'application/zip',
    );

    $response = $this->actingAs($admin)->post(route('admin.manager.store'), [
        'version' => '1.4.0',
        'notes' => '',
        'pub_date' => '2025-07-01T12:24:47.829Z',
        'platform' => 'windows-x86_64',
        'signature' => 'signed-by-tauri',
        'installer' => $installer,
        'is_active' => true,
    ]);

    $response->assertSessionHasErrors([
        'installer' => 'Installers must be 250 MB or smaller.',
    ]);

    expect(ManagerRelease::query()->exists())->toBeFalse();
});

it('lets admins update metadata and promote only one active release', function () {
    $admin = User::factory()->admin()->create();
    $oldRelease = ManagerRelease::factory()->active()->create([
        'version' => '1.3.0',
        'pub_date' => '2025-06-01 12:00:00',
        'original_filename' => '4CAMPS.Manager_1.3.0_x64_en-US.msi.zip',
    ]);
    $newRelease = ManagerRelease::factory()->create([
        'version' => '1.4.0',
        'pub_date' => '2025-07-01 12:00:00',
        'original_filename' => '4CAMPS.Manager_1.4.0_x64_en-US.msi.zip',
        'signature' => 'old-signature',
    ]);

    $response = $this->actingAs($admin)->patch(route('admin.manager.update', $newRelease), [
        'version' => '1.4.1',
        'notes' => 'Bug fixes',
        'pub_date' => '2025-07-02T12:24:47.829Z',
        'platform' => 'windows-x86_64',
        'signature' => 'new-signature',
        'is_active' => true,
    ]);

    $response->assertRedirect(route('admin.manager.index'));

    expect($newRelease->fresh()->is_active)->toBeTrue()
        ->and($newRelease->fresh()->version)->toBe('1.4.1')
        ->and($newRelease->fresh()->signature)->toBe('new-signature')
        ->and($oldRelease->fresh()->is_active)->toBeFalse();

    $this->get(route('manager.json'))
        ->assertSuccessful()
        ->assertJsonPath('version', '1.4.1')
        ->assertJsonPath('notes', 'Bug fixes')
        ->assertJsonPath('platforms.windows-x86_64.signature', 'new-signature');
});

it('lets admins disable the active release so the permanent json endpoint returns 404', function () {
    $admin = User::factory()->admin()->create();
    $release = ManagerRelease::factory()->active()->create([
        'version' => '1.4.0',
        'pub_date' => '2025-07-01 12:00:00',
        'original_filename' => '4CAMPS.Manager_1.4.0_x64_en-US.msi.zip',
    ]);

    $response = $this->actingAs($admin)->patch(route('admin.manager.update', $release), [
        'version' => '1.4.0',
        'notes' => 'Paused rollout',
        'pub_date' => '2025-07-01T12:24:47.829Z',
        'platform' => 'windows-x86_64',
        'signature' => 'signed-by-tauri',
        'is_active' => false,
    ]);

    $response->assertRedirect(route('admin.manager.index'));

    expect($release->fresh()->is_active)->toBeFalse();

    $this->get(route('manager.json'))->assertNotFound();
});

it('redirects downloads through the configured cdn url', function () {
    config(['filesystems.manager_cdn_url' => 'https://cdn.bfw.cz']);

    $release = ManagerRelease::factory()->active()->create([
        'storage_path' => '4c-manager/releases/1.4.0/4CAMPS.Manager_1.4.0_x64_en-US.msi.zip',
        'original_filename' => '4CAMPS.Manager_1.4.0_x64_en-US.msi.zip',
    ]);

    $this->get(route('manager.download', [
        'filename' => $release->original_filename,
    ]))->assertRedirect('https://cdn.bfw.cz/4c-manager/releases/1.4.0/4CAMPS.Manager_1.4.0_x64_en-US.msi.zip');
});

it('redirects downloads when the url filename contains encoded characters', function () {
    config(['filesystems.manager_cdn_url' => 'https://cdn.bfw.cz']);

    $release = ManagerRelease::factory()->active()->create([
        'storage_path' => '4c-manager/releases/1.4.0/4CAMPS-Manager-1.4.0-x64-.msi.zip',
        'original_filename' => '4CAMPS Manager 1.4.0 (x64).msi.zip',
    ]);

    $this->get('/4c-manager/download/'.rawurlencode($release->original_filename))
        ->assertRedirect('https://cdn.bfw.cz/4c-manager/releases/1.4.0/4CAMPS-Manager-1.4.0-x64-.msi.zip');
});

it('lets admins delete active releases without promoting another release', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $archivedRelease = ManagerRelease::factory()->create([
        'version' => '1.3.0',
        'pub_date' => '2025-06-01 12:00:00',
        'storage_disk' => 'public',
        'storage_path' => '4c-manager/releases/1.3.0/old.zip',
    ]);
    $activeRelease = ManagerRelease::factory()->active()->create([
        'version' => '1.4.0',
        'pub_date' => '2025-07-01 12:00:00',
        'storage_disk' => 'public',
        'storage_path' => '4c-manager/releases/1.4.0/current.zip',
    ]);

    Storage::disk('public')->put($activeRelease->storage_path, 'installer');

    $response = $this->actingAs($admin)->delete(route('admin.manager.destroy', $activeRelease));

    $response->assertRedirect();
    $this->assertDatabaseMissing('manager_releases', ['id' => $activeRelease->id]);
    Storage::disk('public')->assertMissing($activeRelease->storage_path);
    expect($archivedRelease->fresh()->is_active)->toBeFalse();
    $this->get(route('manager.json'))->assertNotFound();
});

it('keeps the release record when installer deletion fails', function () {
    $admin = User::factory()->admin()->create();
    $activeRelease = ManagerRelease::factory()->active()->create([
        'version' => '1.4.0',
        'storage_disk' => 's3',
        'storage_path' => '4c-manager/releases/1.4.0/current.zip',
    ]);

    $this->mock(ManagerReleaseStorage::class, function ($mock) use ($activeRelease): void {
        $mock->shouldReceive('delete')
            ->once()
            ->withArgs(fn (ManagerRelease $release) => $release->is($activeRelease))
            ->andThrow(new RuntimeException('S3 delete failed.'));
    });

    $this->withoutExceptionHandling();

    try {
        $this->actingAs($admin)->delete(route('admin.manager.destroy', $activeRelease));
    } catch (RuntimeException $exception) {
        expect($exception->getMessage())->toBe('S3 delete failed.');
    }

    $this->assertDatabaseHas('manager_releases', [
        'id' => $activeRelease->id,
        'is_active' => true,
    ]);
});
