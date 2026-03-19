<?php

namespace App\Http\Requests;

use App\Support\ImageConverter;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
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
            'image' => [
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
            'image.required' => 'Please choose an image to convert.',
            'image.mimes' => 'Please upload a PNG, JPG, GIF, WebP, or ICO image.',
            'image.max' => 'Images must be 10 MB or smaller.',
            'output_format.required' => 'Please choose the format you want to convert to.',
            'output_format.in' => 'That output format is not supported.',
        ];
    }

    public function outputFormat(): string
    {
        return (string) $this->input('output_format');
    }
}
