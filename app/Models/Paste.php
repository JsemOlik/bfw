<?php

namespace App\Models;

use App\Models\Concerns\HasSlugRegistry;
use App\Support\ExpirationResolver;
use App\Support\PasteMediaManager;
use Database\Factories\PasteFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

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
            'view_count' => 'integer',
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

    public function rawUrl(): string
    {
        return route('paste.raw', ['slugRegistry' => $this->slug]);
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

    public function recordView(): void
    {
        $viewedOn = today()->toDateString();

        DB::transaction(function () use ($viewedOn): void {
            DB::table($this->getTable())
                ->where('id', $this->id)
                ->increment('view_count');

            DB::table('paste_daily_views')->insertOrIgnore([
                'paste_id' => $this->id,
                'viewed_on' => $viewedOn,
                'view_count' => 0,
            ]);

            DB::table('paste_daily_views')
                ->where('paste_id', $this->id)
                ->where('viewed_on', $viewedOn)
                ->increment('view_count');
        });
    }

    public function viewedTodayCount(): int
    {
        return (int) (DB::table('paste_daily_views')
            ->where('paste_id', $this->id)
            ->where('viewed_on', today()->toDateString())
            ->value('view_count') ?? 0);
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

    protected function pruning(): void
    {
        app(PasteMediaManager::class)->delete($this);
    }
}
