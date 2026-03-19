<?php

namespace App\Exceptions;

use RuntimeException;

class SlugUnavailableException extends RuntimeException
{
    public static function forSlug(string $slug): self
    {
        return new self(sprintf('The slug "%s" is unavailable.', $slug));
    }
}
