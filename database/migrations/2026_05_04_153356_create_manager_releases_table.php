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
        Schema::create('manager_releases', function (Blueprint $table) {
            $table->id();
            $table->string('version');
            $table->text('notes')->nullable();
            $table->timestamp('pub_date');
            $table->string('platform')->default('windows-x86_64');
            $table->longText('signature')->nullable();
            $table->string('storage_disk');
            $table->string('storage_path');
            $table->string('original_filename');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->boolean('is_active')->default(false);
            $table->timestamps();

            $table->unique('version');
            $table->index('is_active');
            $table->index('original_filename');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manager_releases');
    }
};
