<?php

namespace App\Support;

use App\Models\User;
use Carbon\CarbonInterface;

class ExpirationResolver
{
    public function resolveForUser(?User $user): ?CarbonInterface
    {
        if ($user === null) {
            return now()->addDay();
        }

        if ($user->isAdmin()) {
            return null;
        }

        return now()->addMonthsNoOverflow(2);
    }

    public function resolveForUserId(?int $userId): ?CarbonInterface
    {
        if ($userId === null) {
            return $this->resolveForUser(null);
        }

        return $this->resolveForUser(User::query()->find($userId));
    }
}
