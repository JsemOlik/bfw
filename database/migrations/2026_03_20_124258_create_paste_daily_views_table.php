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
        Schema::create('paste_daily_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paste_id')->constrained()->cascadeOnDelete();
            $table->date('viewed_on');
            $table->unsignedBigInteger('view_count')->default(0);

            $table->unique(['paste_id', 'viewed_on']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paste_daily_views');
    }
};
