<?php

use App\Http\Controllers\LinkController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::post('link', [LinkController::class, 'store'])->name('link.store');
Route::get('links', [LinkController::class, 'index'])->name('link.index');
Route::get('link/{slug}/status', [LinkController::class, 'status'])->name('link.status');
Route::get('link/{slug}', [LinkController::class, 'show'])->name('link.show');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
