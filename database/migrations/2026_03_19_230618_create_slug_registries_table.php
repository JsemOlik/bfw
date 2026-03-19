<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('slug_registries', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('sluggable_type');
            $table->unsignedBigInteger('sluggable_id');
            $table->timestamps();

            $table->unique(['sluggable_type', 'sluggable_id']);
        });

        $records = collect();

        DB::table('links')
            ->select('id', 'slug', 'created_at', 'updated_at')
            ->orderBy('id')
            ->cursor()
            ->each(function (object $link) use ($records): void {
                $records->push([
                    'slug' => $link->slug,
                    'sluggable_type' => 'link',
                    'sluggable_id' => $link->id,
                    'created_at' => $link->created_at,
                    'updated_at' => $link->updated_at,
                ]);
            });

        DB::table('pastes')
            ->select('id', 'slug', 'created_at', 'updated_at')
            ->orderBy('id')
            ->cursor()
            ->each(function (object $paste) use ($records): void {
                $records->push([
                    'slug' => $paste->slug,
                    'sluggable_type' => 'paste',
                    'sluggable_id' => $paste->id,
                    'created_at' => $paste->created_at,
                    'updated_at' => $paste->updated_at,
                ]);
            });

        if ($records->isEmpty()) {
            return;
        }

        $duplicateSlugs = $records
            ->pluck('slug')
            ->duplicates()
            ->unique()
            ->values()
            ->all();

        if ($duplicateSlugs !== []) {
            throw new RuntimeException(sprintf(
                'Cannot migrate to shared public slugs because these slugs already exist in multiple features: %s',
                implode(', ', $duplicateSlugs),
            ));
        }

        $reservedSlugs = collect([
            '_boost',
            'compressor',
            'converter',
            'email',
            'forgot-password',
            'link',
            'login',
            'logout',
            'paste',
            'register',
            'reset-password',
            'settings',
            'storage',
            'two-factor-challenge',
            'up',
            'user',
        ]);

        $reservedConflicts = $records
            ->pluck('slug')
            ->intersect($reservedSlugs)
            ->values()
            ->all();

        if ($reservedConflicts !== []) {
            throw new RuntimeException(sprintf(
                'Cannot migrate to shared public slugs because these slugs conflict with application routes: %s',
                implode(', ', $reservedConflicts),
            ));
        }

        DB::table('slug_registries')->insert($records->all());
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('slug_registries');
    }
};
