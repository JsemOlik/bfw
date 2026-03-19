<?php

use App\Http\Controllers\CompressorController;
use App\Http\Controllers\ConverterController;
use App\Http\Controllers\LinkController;
use App\Http\Controllers\PasteController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Compressor routes
Route::get('compressor', [CompressorController::class, 'create'])->name('compressor.create');
Route::post('compressor', [CompressorController::class, 'store'])
    ->middleware('throttle:compressor-creations')
    ->name('compressor.store');

// Converter routes
Route::get('converter', [ConverterController::class, 'create'])->name('converter.create');
Route::post('converter', [ConverterController::class, 'store'])
    ->middleware('throttle:converter-creations')
    ->name('converter.store');

// Link routes
Route::get('link', [LinkController::class, 'create'])->name('link.create');
Route::post('link', [LinkController::class, 'store'])
    ->middleware('throttle:link-creations')
    ->name('link.store');
Route::get('link/{slug}/status', [LinkController::class, 'status'])->name('link.status');
Route::delete('link/{link}', [LinkController::class, 'destroy'])->name('link.destroy');

// Redirection route must be last to avoid catching sub-routes
Route::get('link/{slug}', [LinkController::class, 'show'])->name('link.show');

// Paste routes
Route::get('paste', [PasteController::class, 'create'])->name('paste.create');
Route::post('paste', [PasteController::class, 'store'])
    ->middleware('throttle:paste-creations')
    ->name('paste.store');
Route::get('paste/{slug}/raw', [PasteController::class, 'raw'])->name('paste.raw');
Route::get('paste/{slug}/status', [PasteController::class, 'status'])->name('paste.status');
Route::delete('paste/{paste}', [PasteController::class, 'destroy'])->name('paste.destroy');

// Redirection route must be last to avoid catching sub-routes
Route::get('paste/{slug}', [PasteController::class, 'show'])->name('paste.show');

require __DIR__.'/settings.php';
