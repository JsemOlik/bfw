<?php

namespace App\Http\Requests\Admin;

use App\Models\ManagerRelease;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateManagerReleaseRequest extends FormRequest
{
    protected const INSTALLER_MAX_KILOBYTES = 256_000;

    protected function prepareForValidation(): void
    {
        if (! $this->has('is_active')) {
            return;
        }

        $this->merge([
            'is_active' => filter_var($this->input('is_active'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
        ]);
    }

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
        $release = $this->route('release');

        return [
            'version' => [
                'required',
                'string',
                'max:40',
                'regex:/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/',
                Rule::unique('manager_releases', 'version')
                    ->ignore($release instanceof ManagerRelease ? $release->id : null),
            ],
            'notes' => ['nullable', 'string'],
            'pub_date' => ['required', 'date'],
            'platform' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z0-9._-]+$/'],
            'signature' => ['nullable', 'string'],
            'installer' => ['nullable', 'file', 'max:'.self::INSTALLER_MAX_KILOBYTES],
            'is_active' => ['required', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'version.regex' => 'Use a desktop app version like 1.4.0 or 1.4.0-beta.1.',
            'platform.regex' => 'Use a platform key like windows-x86_64.',
            'installer.max' => 'Installers must be 250 MB or smaller.',
        ];
    }
}
