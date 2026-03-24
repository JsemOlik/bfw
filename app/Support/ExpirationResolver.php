<?php

namespace App\Support;

use App\Models\User;
use Carbon\CarbonInterface;

class ExpirationResolver
{
    public function resolveForUser(?User $user, string $context = 'paste.text'): ?CarbonInterface
    {
        if ($user === null) {
            return now()->addDay();
        }

        if ($user->isAdmin()) {
            return null;
        }

        return match ($context) {
            'link' => now()->addMonthsNoOverflow(3),
            'paste.image', 'paste.video', 'paste.file' => now()->addDays(14),
            default => now()->addMonthsNoOverflow(2),
        };
    }

    public function resolveForUserId(?int $userId, string $context = 'paste.text'): ?CarbonInterface
    {
        if ($userId === null) {
            return $this->resolveForUser(null, $context);
        }

        return $this->resolveForUser(User::query()->find($userId), $context);
    }
}
