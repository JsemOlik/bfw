<?php

namespace App\Models;

use Database\Factories\SlugRegistryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SlugRegistry extends Model
{
    /** @use HasFactory<SlugRegistryFactory> */
    use HasFactory;

    protected $fillable = [
        'slug',
        'sluggable_type',
        'sluggable_id',
    ];

    public function sluggable(): MorphTo
    {
        return $this->morphTo();
    }
}
