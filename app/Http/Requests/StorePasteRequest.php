<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StorePasteRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'content' => ['required', 'string', 'max:16777215'], // 16MB max limit for mediumtext/longtext
            'slug' => ['nullable', 'string', 'max:50', 'alpha_dash', 'unique:pastes,slug'],
            'syntax' => ['nullable', 'string', 'max:50'],
        ];
    }
}
