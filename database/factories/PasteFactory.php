<?php

namespace Database\Factories;

use App\Models\Paste;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

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
            'slug' => Str::random(6),
            'type' => 'text',
            'content' => $this->faker->text(500),
            'syntax' => 'plaintext',
            'expires_at' => now()->addHours(24),
        ];
    }

    public function image(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'image',
            'content' => null,
            'syntax' => null,
            'storage_disk' => 'paste_media',
            'storage_path' => 'pastes/images/test/example.png',
            'original_filename' => 'example.png',
            'mime_type' => 'image/png',
            'size_bytes' => 1024,
            'image_width' => 320,
            'image_height' => 240,
        ]);
    }
}
