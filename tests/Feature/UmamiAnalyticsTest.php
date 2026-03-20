<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
});

it('renders the umami script when analytics is enabled', function () {
    config()->set('services.umami.enabled', true);
    config()->set('services.umami.website_id', 'website-123');
    config()->set('services.umami.script_url', 'https://stats.example.com/script.js');

    $response = $this->get('/');

    $response->assertOk();
    $response->assertSee('https://stats.example.com/script.js', escape: false);
    $response->assertSee('data-website-id="website-123"', escape: false);
    $response->assertDontSee('data-host-url=', escape: false);
    $response->assertDontSee('data-domains=', escape: false);
    $response->assertDontSee('data-do-not-track=', escape: false);
});

it('does not render the umami script when analytics is disabled', function () {
    config()->set('services.umami.enabled', false);
    config()->set('services.umami.website_id', 'website-123');
    config()->set('services.umami.script_url', 'https://stats.example.com/script.js');

    $response = $this->get('/');

    $response->assertOk();
    $response->assertDontSee('data-website-id="website-123"', escape: false);
    $response->assertDontSee('https://stats.example.com/script.js', escape: false);
});
