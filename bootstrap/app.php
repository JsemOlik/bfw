<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (HttpExceptionInterface $exception, Request $request) {
            $status = $exception->getStatusCode();

            if ($status !== 403) {
                return null;
            }

            return Inertia::render('errors/forbidden', [
                'status' => $status,
            ])->toResponse($request)->setStatusCode($status);
        });

        $exceptions->render(function (PostTooLargeException $exception, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Images must be 10 MB or smaller.',
                    'errors' => [
                        'image' => ['Images must be 10 MB or smaller.'],
                    ],
                ], 413);
            }

            return redirect()
                ->back()
                ->withErrors([
                    'image' => 'Images must be 10 MB or smaller.',
                ])
                ->withInput();
        });
    })->create();
