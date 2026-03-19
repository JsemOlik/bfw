<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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
            'target_size_value' => [
                'required',
                'numeric',
                'min:0.1',
            ],
            'target_size_unit' => [
                'required',
                'string',
                Rule::in(['kb', 'mb']),
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
            'target_size_value.required' => 'Please choose a target size.',
            'target_size_value.numeric' => 'The target size must be a number.',
            'target_size_value.min' => 'The target size must be greater than 0.',
            'target_size_unit.required' => 'Please choose KB or MB for the target size.',
            'target_size_unit.in' => 'The target size unit must be KB or MB.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $targetSizeBytes = $this->targetSizeBytes();

            if ($targetSizeBytes < 10 * 1024 || $targetSizeBytes > 10 * 1024 * 1024) {
                $validator->errors()->add(
                    'target_size_value',
                    'Please choose a target size between 10 KB and 10 MB.',
                );
            }
        });
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
        $targetSizeValue = (float) $this->input('target_size_value', 1);
        $targetSizeUnit = (string) $this->input('target_size_unit', 'mb');
        $multiplier = $targetSizeUnit === 'kb' ? 1024 : 1024 * 1024;

        return (int) round($targetSizeValue * $multiplier);
    }
}
