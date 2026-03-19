<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['text', 'image', 'video'])],
            'content' => [
                Rule::requiredIf($this->pasteType() === 'text'),
                'nullable',
                'string',
                'max:16777215',
            ],
            'slug' => ['nullable', 'string', 'max:50', 'alpha_dash', 'unique:pastes,slug'],
            'syntax' => [
                Rule::requiredIf($this->pasteType() === 'text'),
                'nullable',
                'string',
                'max:50',
            ],
            'image' => [
                Rule::requiredIf($this->pasteType() === 'image'),
                'nullable',
                'file',
                'mimes:png,jpg,jpeg,gif,webp,svg,ico',
                'max:10240',
            ],
            'video' => [
                Rule::requiredIf($this->pasteType() === 'video'),
                'nullable',
                'file',
                'mimes:mp4,webm,ogg,ogv',
                'max:51200',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'content.required' => 'Please provide text content for the paste.',
            'image.required' => 'Please choose an image to upload.',
            'image.mimes' => 'Please upload a PNG, JPG, GIF, WebP, SVG, or ICO image.',
            'image.max' => 'Images must be 10 MB or smaller.',
            'video.required' => 'Please choose a video to upload.',
            'video.mimes' => 'Please upload an MP4, WebM, or OGG video.',
            'video.max' => 'Videos must be 50 MB or smaller.',
            'type.in' => 'The selected paste type is invalid.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'type' => $this->input('type', 'text'),
            'syntax' => $this->input('syntax', 'plaintext'),
        ]);
    }

    public function pasteType(): string
    {
        return (string) $this->input('type', 'text');
    }
}
