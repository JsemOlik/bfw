<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;

class StoreCompressorRequest extends FormRequest
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
            'images' => [
                'required',
                'array',
                'min:1',
                'max:20',
            ],
            'images.*' => [
                'required',
                'file',
                'mimes:png,jpg,jpeg,webp',
                'max:10240',
            ],
            'compression_mode' => [
                'required',
                'string',
                Rule::in(['quality', 'target_size']),
            ],
            'quality' => [
                'required',
                'integer',
                'between:10,100',
            ],
            'target_size_mb' => [
                'required',
                'numeric',
                'between:0.1,10',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'images.required' => 'Please choose at least one image to compress.',
            'images.array' => 'Please choose valid images to compress.',
            'images.min' => 'Please choose at least one image to compress.',
            'images.max' => 'You can compress up to 20 images at a time.',
            'images.*.required' => 'Each selected image is required.',
            'images.*.mimes' => 'Please upload PNG, JPG, or WebP images only.',
            'images.*.max' => 'Each image must be 10 MB or smaller.',
            'compression_mode.required' => 'Please choose how you want to compress your images.',
            'compression_mode.in' => 'That compression mode is not supported.',
            'quality.required' => 'Please choose a quality level.',
            'quality.integer' => 'The quality level must be a whole number.',
            'quality.between' => 'Please choose a quality between 10 and 100.',
            'target_size_mb.required' => 'Please choose a target size in MB.',
            'target_size_mb.numeric' => 'The target size must be a number.',
            'target_size_mb.between' => 'Please choose a target size between 0.1 MB and 10 MB.',
        ];
    }

    /**
     * @return list<UploadedFile>
     */
    public function images(): array
    {
        return array_values($this->file('images', []));
    }

    public function compressionMode(): string
    {
        return (string) $this->input('compression_mode', 'quality');
    }

    public function quality(): int
    {
        return max(10, min(100, (int) $this->integer('quality', 75)));
    }

    public function targetSizeBytes(): int
    {
        return (int) round(((float) $this->input('target_size_mb', 1)) * 1024 * 1024);
    }
}
