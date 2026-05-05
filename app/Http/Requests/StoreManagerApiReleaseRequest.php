<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreManagerApiReleaseRequest extends FormRequest
{
    protected const INSTALLER_MAX_KILOBYTES = 256_000;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'payload' => ['required', 'json'],
            'version' => [
                'required',
                'string',
                'max:40',
                'regex:/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/',
                Rule::unique('manager_releases', 'version'),
            ],
            'notes' => ['nullable', 'string'],
            'pub_date' => ['required', 'date'],
            'platform' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z0-9._-]+$/'],
            'signature' => ['nullable', 'string'],
            'installer' => ['required', 'file', 'max:'.self::INSTALLER_MAX_KILOBYTES],
            'is_active' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'payload.required' => 'Please send a payload JSON body.',
            'payload.json' => 'Payload must be valid JSON.',
            'version.regex' => 'Use a desktop app version like 1.4.0 or 1.4.0-beta.1.',
            'platform.regex' => 'Use a platform key like windows-x86_64.',
            'installer.max' => 'Installers must be 250 MB or smaller.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $payload = $this->decodePayload();
        $platforms = is_array($payload['platforms'] ?? null) ? $payload['platforms'] : [];
        $platformKey = array_key_first($platforms);
        $platformData = is_string($platformKey) && is_array($platforms[$platformKey] ?? null)
            ? $platforms[$platformKey]
            : [];

        $this->merge([
            'version' => $this->input('version', $payload['version'] ?? null),
            'notes' => $this->input('notes', $payload['notes'] ?? null),
            'pub_date' => $this->input('pub_date', $payload['pub_date'] ?? null),
            'platform' => $this->input('platform', is_string($platformKey) ? $platformKey : null),
            'signature' => $this->input('signature', $platformData['signature'] ?? null),
            'is_active' => filter_var(
                $this->input('is_active', $payload['is_active'] ?? true),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE,
            ),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function decodePayload(): array
    {
        $rawPayload = (string) $this->input('payload', '');

        if ($rawPayload === '') {
            return [];
        }

        $decoded = json_decode($rawPayload, true);

        return is_array($decoded) ? $decoded : [];
    }
}
