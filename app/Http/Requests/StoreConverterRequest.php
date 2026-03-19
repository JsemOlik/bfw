<?php

namespace App\Http\Requests;

use App\Support\ImageConverter;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;

class StoreConverterRequest extends FormRequest
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
                'mimes:png,jpg,jpeg,gif,webp,ico',
                'max:10240',
            ],
            'output_format' => [
                'required',
                'string',
                Rule::in(ImageConverter::supportedExtensions()),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'images.required' => 'Please choose at least one image to convert.',
            'images.array' => 'Please choose valid images to convert.',
            'images.min' => 'Please choose at least one image to convert.',
            'images.max' => 'You can convert up to 20 images at a time.',
            'images.*.required' => 'Each selected image is required.',
            'images.*.mimes' => 'Please upload PNG, JPG, GIF, WebP, or ICO images only.',
            'images.*.max' => 'Each image must be 10 MB or smaller.',
            'output_format.required' => 'Please choose the format you want to convert to.',
            'output_format.in' => 'That output format is not supported.',
        ];
    }

    /**
     * @return list<UploadedFile>
     */
    public function images(): array
    {
        return array_values($this->file('images', []));
    }

    public function outputFormat(): string
    {
        return (string) $this->input('output_format');
    }
}
