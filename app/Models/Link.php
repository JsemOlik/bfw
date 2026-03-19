<?php

namespace App\Models;

use App\Support\ExpirationResolver;
use Database\Factories\LinkFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable(['original_url', 'slug', 'expires_at', 'user_id'])]
class Link extends Model
{
    /** @use HasFactory<LinkFactory> */
    use HasFactory, Prunable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the link.
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
        static::creating(function (Link $link) {
            if (! $link->slug) {
                $link->slug = Str::random(6);
            }

            if (! $link->isDirty('expires_at')) {
                $link->expires_at = app(ExpirationResolver::class)->resolveForUserId($link->user_id);
            }
        });
    }
}
