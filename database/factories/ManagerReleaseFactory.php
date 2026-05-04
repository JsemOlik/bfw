<?php

namespace Database\Factories;

use App\Models\ManagerRelease;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ManagerRelease>
 */
class ManagerReleaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'version' => $this->faker->unique()->numerify('#.#.#'),
            'notes' => $this->faker->sentence(),
            'pub_date' => now(),
            'platform' => 'windows-x86_64',
            'signature' => base64_encode($this->faker->sha256()),
            'storage_disk' => 'public',
            'storage_path' => '4c-manager/releases/1.0.0/4CAMPS.Manager_1.0.0_x64_en-US.msi.zip',
            'original_filename' => '4CAMPS.Manager_1.0.0_x64_en-US.msi.zip',
            'mime_type' => 'application/zip',
            'size_bytes' => 1024,
            'is_active' => false,
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
        ]);
    }
}
