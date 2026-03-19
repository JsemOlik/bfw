<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pastes', function (Blueprint $table) {
            $table->string('type')->default('text')->after('slug');
            $table->longText('content')->nullable()->change();
            $table->string('syntax')->nullable()->change();
            $table->string('storage_disk')->nullable()->after('syntax');
            $table->string('storage_path')->nullable()->after('storage_disk');
            $table->string('original_filename')->nullable()->after('storage_path');
            $table->string('mime_type')->nullable()->after('original_filename');
            $table->unsignedBigInteger('size_bytes')->nullable()->after('mime_type');
            $table->unsignedInteger('image_width')->nullable()->after('size_bytes');
            $table->unsignedInteger('image_height')->nullable()->after('image_width');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pastes', function (Blueprint $table) {
            $table->dropColumn([
                'type',
                'storage_disk',
                'storage_path',
                'original_filename',
                'mime_type',
                'size_bytes',
                'image_width',
                'image_height',
            ]);

            $table->longText('content')->nullable(false)->change();
            $table->string('syntax')->default('plaintext')->nullable(false)->change();
        });
    }
};
