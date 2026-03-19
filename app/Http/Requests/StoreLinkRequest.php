<?php

namespace App\Http\Requests;

use App\Support\SlugRegistryManager;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLinkRequest extends FormRequest
{
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
            'url' => ['required', 'url'],
            'slug' => [
                'nullable',
                'alpha_dash',
                'max:20',
                Rule::notIn(app(SlugRegistryManager::class)->reservedSlugs()),
                Rule::unique('slug_registries', 'slug'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.not_in' => 'That slug is reserved by the app.',
            'slug.unique' => 'That slug is already taken.',
        ];
    }
}
