<?php

namespace App\Support;

use App\Exceptions\SlugUnavailableException;
use App\Models\SlugRegistry;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

class SlugRegistryManager
{
    public function generateUniqueSlug(int $length = 6): string
    {
        do {
            $slug = Str::random($length);
        } while (! $this->isSlugAvailable($slug));

        return $slug;
    }

    public function ensureSlugIsAvailable(string $slug, ?Model $ignore = null): void
    {
        if (! $this->isSlugAvailable($slug, $ignore)) {
            throw SlugUnavailableException::forSlug($slug);
        }
    }

    public function syncFor(Model $model): void
    {
        try {
            SlugRegistry::query()->updateOrCreate(
                [
                    'sluggable_type' => $model->getMorphClass(),
                    'sluggable_id' => $model->getKey(),
                ],
                [
                    'slug' => (string) $model->getAttribute('slug'),
                ],
            );
        } catch (QueryException $exception) {
            throw SlugUnavailableException::forSlug((string) $model->getAttribute('slug'));
        }
    }

    public function forgetFor(Model $model): void
    {
        SlugRegistry::query()
            ->where('sluggable_type', $model->getMorphClass())
            ->where('sluggable_id', $model->getKey())
            ->delete();
    }

    /**
     * @return list<string>
     */
    public function reservedSlugs(): array
    {
        return once(function (): array {
            return collect(Route::getRoutes()->getRoutes())
                ->map(fn ($route) => trim($route->uri(), '/'))
                ->filter()
                ->map(fn (string $uri) => explode('/', $uri)[0])
                ->filter(fn (string $segment) => $segment !== '' && ! str_contains($segment, '{'))
                ->unique()
                ->values()
                ->all();
        });
    }

    protected function isSlugAvailable(string $slug, ?Model $ignore = null): bool
    {
        if (in_array($slug, $this->reservedSlugs(), true)) {
            return false;
        }

        return ! SlugRegistry::query()
            ->where('slug', $slug)
            ->when(
                $ignore?->exists,
                function ($query) use ($ignore) {
                    $query->where(function ($nestedQuery) use ($ignore) {
                        $nestedQuery
                            ->where('sluggable_type', '!=', $ignore->getMorphClass())
                            ->orWhere('sluggable_id', '!=', $ignore->getKey());
                    });
                },
            )
            ->exists();
    }
}
