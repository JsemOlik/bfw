<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (app()->isProduction()) {
            URL::forceScheme('https');
        }

        $this->configureDefaults();
        $this->configureFeatureRateLimiting();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    protected function configureFeatureRateLimiting(): void
    {
        RateLimiter::for('compressor-creations', function (Request $request) {
            return Limit::perSecond(1)
                ->by($this->featureRateLimiterKey($request, 'compressor'))
                ->response(fn () => $this->rateLimitedResponse(
                    $request,
                    'images',
                    'Please wait a second before starting another compression.',
                ));
        });

        RateLimiter::for('converter-creations', function (Request $request) {
            return Limit::perSecond(1)
                ->by($this->featureRateLimiterKey($request, 'converter'))
                ->response(fn () => $this->rateLimitedResponse(
                    $request,
                    'images',
                    'Please wait a second before starting another conversion.',
                ));
        });

        RateLimiter::for('link-creations', function (Request $request) {
            return Limit::perSecond(1)
                ->by($this->featureRateLimiterKey($request, 'link'))
                ->response(fn () => $this->rateLimitedResponse(
                    $request,
                    'url',
                    'Please wait a second before shortening another link.',
                ));
        });

        RateLimiter::for('paste-creations', function (Request $request) {
            return Limit::perSecond(1)
                ->by($this->featureRateLimiterKey($request, 'paste'))
                ->response(fn () => $this->rateLimitedResponse(
                    $request,
                    $this->pasteRateLimitField($request),
                    'Please wait a second before creating another paste.',
                ));
        });
    }

    protected function featureRateLimiterKey(Request $request, string $feature): string
    {
        return sprintf('%s|%s', $feature, $request->ip() ?? 'unknown');
    }

    protected function pasteRateLimitField(Request $request): string
    {
        return match ((string) $request->input('type', 'text')) {
            'image' => 'image',
            'video' => 'video',
            default => 'content',
        };
    }

    protected function rateLimitedResponse(
        Request $request,
        string $field,
        string $message,
    ): SymfonyResponse|RedirectResponse {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'errors' => [
                    $field => [$message],
                ],
            ], 429);
        }

        return back()
            ->withErrors([$field => $message])
            ->withInput();
    }
}
