<?php

use App\Http\Controllers\Admin\LinkController;
use App\Http\Controllers\Admin\PasteController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::redirect('/', '/admin/users')->name('index');
    Route::get('users', [UserController::class, 'index'])->name('users.index');
    Route::patch('users/{user}', [UserController::class, 'update'])->name('users.update');
    Route::get('links', [LinkController::class, 'index'])->name('links.index');
    Route::delete('links/{link}', [LinkController::class, 'destroy'])->name('links.destroy');
    Route::get('pastes', [PasteController::class, 'index'])->name('pastes.index');
    Route::delete('pastes/{paste}', [PasteController::class, 'destroy'])->name('pastes.destroy');
});
