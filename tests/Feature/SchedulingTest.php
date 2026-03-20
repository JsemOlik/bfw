<?php

use Illuminate\Console\Scheduling\Schedule;

test('expired models are pruned every fifteen minutes', function () {
    $event = collect(app(Schedule::class)->events())
        ->first(fn ($event) => str_contains($event->command, 'model:prune'));

    expect($event)->not->toBeNull();
    expect($event->expression)->toBe('*/15 * * * *');
});
