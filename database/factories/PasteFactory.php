<?php

namespace Database\Factories;

use App\Models\Paste;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Paste>
 */
class PasteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => null,
            'slug' => \Illuminate\Support\Str::random(6),
            'content' => $this->faker->text(500),
            'syntax' => 'plaintext',
            'expires_at' => now()->addHours(24),
        ];
    }
}
