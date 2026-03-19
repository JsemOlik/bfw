<?php

use App\Http\Controllers\LinkController;
use Illuminate\Support\Facades\Route;

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
Route::get('paste', [PasteController::class, 'create'])->name('paste.create');
Route::post('paste', [PasteController::class, 'store'])->name('paste.store');
Route::get('paste/{slug}/status', [PasteController::class, 'status'])->name('paste.status');
Route::delete('paste/{paste}', [PasteController::class, 'destroy'])->name('paste.destroy');

// Redirection route must be last to avoid catching sub-routes
Route::get('paste/{slug}', [PasteController::class, 'show'])->name('paste.show');

require __DIR__.'/settings.php';
