<?php

namespace App\Http\Requests;

use App\Support\SlugRegistryManager;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePasteRequest extends FormRequest
{
    protected const DEFAULT_MEDIA_MAX_KILOBYTES = 25_600;

    protected const ADMIN_MEDIA_MAX_KILOBYTES = 256_000;

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
            'type' => ['required', Rule::in(['text', 'image', 'video', 'file'])],
            'content' => [
                Rule::requiredIf($this->pasteType() === 'text'),
                'nullable',
                'string',
                'max:16777215',
            ],
            'slug' => [
                'nullable',
                'string',
                'max:50',
                'alpha_dash',
                Rule::notIn(app(SlugRegistryManager::class)->reservedSlugs()),
                Rule::unique('slug_registries', 'slug'),
            ],
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
                'max:'.$this->mediaUploadMaxKilobytes(),
            ],
            'video' => [
                Rule::requiredIf($this->pasteType() === 'video'),
                'nullable',
                'file',
                'mimes:mp4,webm,ogg,ogv,mov,mkv',
                'max:'.$this->mediaUploadMaxKilobytes(),
            ],
            'file' => [
                Rule::requiredIf($this->pasteType() === 'file'),
                'nullable',
                'file',
                'max:'.$this->mediaUploadMaxKilobytes(),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'content.required' => 'Please provide text content for the paste.',
            'image.required' => 'Please choose an image to upload.',
            'image.mimes' => 'Please upload a PNG, JPG, GIF, WebP, SVG, or ICO image.',
            'image.max' => sprintf('Images must be %s or smaller.', $this->mediaUploadMaxLabel()),
            'video.required' => 'Please choose a video to upload.',
            'video.mimes' => 'Please upload an MP4, WebM, OGG, MOV, or MKV video.',
            'video.max' => sprintf('Videos must be %s or smaller.', $this->mediaUploadMaxLabel()),
            'file.required' => 'Please choose a file to upload.',
            'file.max' => sprintf('Files must be %s or smaller.', $this->mediaUploadMaxLabel()),
            'type.in' => 'The selected paste type is invalid.',
            'slug.not_in' => 'That slug is reserved by the app.',
            'slug.unique' => 'That slug is already taken.',
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

    protected function mediaUploadMaxKilobytes(): int
    {
        return $this->user()?->isAdmin()
            ? self::ADMIN_MEDIA_MAX_KILOBYTES
            : self::DEFAULT_MEDIA_MAX_KILOBYTES;
    }

    protected function mediaUploadMaxLabel(): string
    {
        return $this->user()?->isAdmin() ? '250 MB' : '25 MB';
    }
}
