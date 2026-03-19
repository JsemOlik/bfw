<?php

namespace App\Models\Concerns;

use App\Models\SlugRegistry;
use App\Support\SlugRegistryManager;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphOne;

trait HasSlugRegistry
{
    public function slugRegistry(): MorphOne
    {
        return $this->morphOne(SlugRegistry::class, 'sluggable');
    }

    public function publicUrl(): string
    {
        return route('slug.show', ['slugRegistry' => $this->slug]);
    }

    public function statusUrl(): string
    {
        return route('slug.status', ['slugRegistry' => $this->slug]);
    }

    protected static function bootHasSlugRegistry(): void
    {
        static::creating(function (Model $model): void {
            /** @var SlugRegistryManager $slugRegistryManager */
            $slugRegistryManager = app(SlugRegistryManager::class);
            $slug = (string) $model->getAttribute('slug');

            if ($slug === '') {
                $model->setAttribute('slug', $slugRegistryManager->generateUniqueSlug());

                return;
            }

            $slugRegistryManager->ensureSlugIsAvailable($slug);
        });

        static::updating(function (Model $model): void {
            if (! $model->isDirty('slug')) {
                return;
            }

            app(SlugRegistryManager::class)->ensureSlugIsAvailable(
                (string) $model->getAttribute('slug'),
                $model,
            );
        });

        static::saved(function (Model $model): void {
            app(SlugRegistryManager::class)->syncFor($model);
        });

        static::deleted(function (Model $model): void {
            app(SlugRegistryManager::class)->forgetFor($model);
        });
    }
}
