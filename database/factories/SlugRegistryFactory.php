<?php

namespace Database\Factories;

use App\Models\SlugRegistry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SlugRegistry>
 */
class SlugRegistryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'slug' => $this->faker->unique()->slug(2),
            'sluggable_type' => 'link',
            'sluggable_id' => 1,
        ];
    }
}
