<?php

namespace App\Models;

use Database\Factories\ManagerReleaseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'version',
    'notes',
    'pub_date',
    'platform',
    'signature',
    'storage_disk',
    'storage_path',
    'original_filename',
    'mime_type',
    'size_bytes',
    'is_active',
])]
class ManagerRelease extends Model
{
    /** @use HasFactory<ManagerReleaseFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'pub_date' => 'immutable_datetime',
            'size_bytes' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function downloadUrl(): string
    {
        return route('manager.download', [
            'filename' => $this->original_filename,
        ]);
    }

    /**
     * @return array{
     *     version: string,
     *     notes: string,
     *     pub_date: string,
     *     platforms: array<string, array{signature: string, url: string}>
     * }
     */
    public function updaterJson(): array
    {
        return [
            'version' => $this->version,
            'notes' => $this->notes ?? '',
            'pub_date' => $this->pub_date->toJSON(),
            'platforms' => [
                $this->platform => [
                    'signature' => $this->signature ?? '',
                    'url' => $this->downloadUrl(),
                ],
            ],
        ];
    }
}
