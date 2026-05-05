<?php

use App\Http\Controllers\Api\ManagerReleaseController;
use Illuminate\Support\Facades\Route;

Route::middleware(['manager.api', 'throttle:30,1'])->group(function () {
    Route::post('4c-manager/releases', [ManagerReleaseController::class, 'store'])
        ->name('api.manager.releases.store');
});
