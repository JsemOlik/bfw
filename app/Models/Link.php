<?php

namespace App\Models;

use App\Models\Concerns\HasSlugRegistry;
use App\Support\ExpirationResolver;
use Database\Factories\LinkFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

#[Fillable(['original_url', 'slug', 'expires_at', 'user_id'])]
class Link extends Model
{
    /** @use HasFactory<LinkFactory> */
    use HasFactory, HasSlugRegistry, Prunable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'open_count' => 'integer',
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

    public function recordOpen(): void
    {
        $openedOn = today()->toDateString();

        DB::transaction(function () use ($openedOn): void {
            DB::table($this->getTable())
                ->where('id', $this->id)
                ->increment('open_count');

            DB::table('link_daily_opens')->insertOrIgnore([
                'link_id' => $this->id,
                'opened_on' => $openedOn,
                'open_count' => 0,
            ]);

            DB::table('link_daily_opens')
                ->where('link_id', $this->id)
                ->where('opened_on', $openedOn)
                ->increment('open_count');
        });
    }

    public function openedTodayCount(): int
    {
        return (int) (DB::table('link_daily_opens')
            ->where('link_id', $this->id)
            ->where('opened_on', today()->toDateString())
            ->value('open_count') ?? 0);
    }

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function (Link $link) {
            if (! $link->isDirty('expires_at')) {
                $link->expires_at = app(ExpirationResolver::class)->resolveForUserId($link->user_id, 'link');
            }
        });
    }
}
