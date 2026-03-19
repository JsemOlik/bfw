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

use App\Http\Controllers\PasteController;

// Paste routes
Route::get('text', [PasteController::class, 'create'])->name('paste.create');
Route::post('text', [PasteController::class, 'store'])->name('paste.store');
Route::get('text/{slug}/status', [PasteController::class, 'status'])->name('paste.status');
Route::delete('text/{paste}', [PasteController::class, 'destroy'])->name('paste.destroy');

// Redirection route must be last to avoid catching sub-routes
Route::get('text/{slug}', [PasteController::class, 'show'])->name('paste.show');

require __DIR__ . '/settings.php';
