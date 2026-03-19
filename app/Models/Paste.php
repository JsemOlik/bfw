<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable(['user_id', 'slug', 'content', 'syntax', 'expires_at'])]
class Paste extends Model
{
    /** @use HasFactory<\Database\Factories\PasteFactory> */
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
     * Get the user that owns the paste.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the prunable model query.
     */
    public function prunable(): \Illuminate\Database\Eloquent\Builder
    {
        return static::where('expires_at', '<', now());
    }

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function (Paste $paste) {
            if (! $paste->slug) {
                // Ensure unique slug logic if we wanted, but randomly 6 chars is fine for now
                $paste->slug = Str::random(6);
            }

            if (! $paste->expires_at) {
                $paste->expires_at = now()->addHours(24);
            }
        });
    }
}
