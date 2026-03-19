<?php

use App\Http\Controllers\LinkController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome')->name('home');

// Link routes
Route::get('link', [LinkController::class, 'create'])->name('link.create');
Route::post('link', [LinkController::class, 'store'])->name('link.store');
Route::get('link/{slug}/status', [LinkController::class, 'status'])->name('link.status');
Route::delete('link/{link}', [LinkController::class, 'destroy'])->name('link.destroy');

// Redirection route must be last to avoid catching sub-routes
Route::get('link/{slug}', [LinkController::class, 'show'])->name('link.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
