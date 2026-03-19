<?php

namespace App\Models;

use App\Models\Concerns\HasSlugRegistry;
use App\Support\ExpirationResolver;
use Database\Factories\PasteFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'slug',
    'type',
    'content',
    'syntax',
    'storage_disk',
    'storage_path',
    'original_filename',
    'mime_type',
    'size_bytes',
    'image_width',
    'image_height',
    'expires_at',
])]
class Paste extends Model
{
    /** @use HasFactory<PasteFactory> */
    use HasFactory, HasSlugRegistry, Prunable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => 'string',
            'expires_at' => 'datetime',
            'size_bytes' => 'integer',
            'image_width' => 'integer',
            'image_height' => 'integer',
        ];
    }

    public function isText(): bool
    {
        return $this->type === 'text';
    }

    public function isImage(): bool
    {
        return $this->type === 'image';
    }

    public function isVideo(): bool
    {
        return $this->type === 'video';
    }

    public function isMedia(): bool
    {
        return $this->isImage() || $this->isVideo();
    }

    /**
     * Get the user that owns the paste.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the prunable model query.
     */
    public function prunable(): Builder
    {
        return static::whereNotNull('expires_at')
            ->where('expires_at', '<', now());
    }

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function (Paste $paste) {
            if (! $paste->isDirty('expires_at')) {
                $paste->expires_at = app(ExpirationResolver::class)->resolveForUserId(
                    $paste->user_id,
                    sprintf('paste.%s', $paste->type ?: 'text'),
                );
            }
        });
    }
}
