<?php

use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::redirect('/', '/admin/users')->name('index');
    Route::get('users', [UserController::class, 'index'])->name('users.index');
});
