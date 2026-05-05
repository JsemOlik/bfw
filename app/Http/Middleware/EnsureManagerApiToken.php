<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureManagerApiToken
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $configuredToken = (string) config('services.manager.api_token', '');

        if ($configuredToken === '') {
            return new JsonResponse([
                'message' => 'Manager API is not configured.',
            ], 503);
        }

        $providedToken = $request->bearerToken() ?? (string) $request->header('X-Manager-Token', '');

        if ($providedToken === '' || ! hash_equals($configuredToken, $providedToken)) {
            return new JsonResponse([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        return $next($request);
    }
}
