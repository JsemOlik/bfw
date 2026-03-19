import { Head } from '@inertiajs/react';
import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type DragEvent,
    type FormEvent,
} from 'react';
import ConverterController from '@/actions/App/Http/Controllers/ConverterController';
import AppLayout from '@/layouts/app-layout';

const supportedMimeTypes = new Set([
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/x-icon',
    'image/vnd.microsoft.icon',
]);

const supportedExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico']);

type Props = {
    supportedFormats: string[];
};

type ValidationErrors = {
    images?: string | string[];
    output_format?: string;
};

type SelectedImage = {
    id: string;
    file: File;
    previewUrl: string;
};

export default function Create({ supportedFormats }: Props) {
    const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
    const [outputFormat, setOutputFormat] = useState<string>(supportedFormats[0] ?? 'png');
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        };
    }, [selectedImages]);

    const previewStack = useMemo(() => selectedImages.slice(0, 3), [selectedImages]);

    const isSupportedImageFile = (file: File): boolean => {
        if (supportedMimeTypes.has(file.type)) {
            return true;
        }

        const extension = file.name.split('.').pop()?.toLowerCase();

        return extension ? supportedExtensions.has(extension) : false;
    };

    const normalizeServerErrors = (payload: unknown): ValidationErrors => {
        if (!payload || typeof payload !== 'object' || !('errors' in payload)) {
            return {
                images: 'We could not convert those images right now. Please try again.',
            };
        }

        const serverErrors = payload.errors;

        if (!serverErrors || typeof serverErrors !== 'object') {
            return {
                images: 'We could not convert those images right now. Please try again.',
            };
        }

        const imageErrors = Object.entries(serverErrors)
            .filter(([key]) => key === 'images' || key.startsWith('images.'))
            .flatMap(([, value]) => Array.isArray(value) ? value : []);

        return {
            images: imageErrors.length > 0 ? imageErrors : undefined,
            output_format: Array.isArray(serverErrors.output_format)
                ? serverErrors.output_format[0]
                : undefined,
        };
    };

    const clearSelectedImages = (): void => {
        selectedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        setSelectedImages([]);
    };

    const updateSelectedImages = (files: FileList | File[]): void => {
        setSuccessMessage(null);

        const nextFiles = Array.from(files);

        if (nextFiles.length === 0) {
            clearSelectedImages();
            setErrors({});
            return;
        }

        const unsupportedFiles = nextFiles.filter((file) => !isSupportedImageFile(file));

        if (unsupportedFiles.length > 0) {
            clearSelectedImages();
            setErrors({
                images: "Woops, you can't convert one of those formats!",
            });
            return;
        }

        clearSelectedImages();

        setSelectedImages(
            nextFiles.map((file, index) => ({
                id: `${file.name}-${file.size}-${index}`,
                file,
                previewUrl: URL.createObjectURL(file),
            })),
        );
        setErrors({});
    };

    const removeSelectedImage = (imageId: string): void => {
        setSelectedImages((currentImages) => {
            const imageToRemove = currentImages.find((image) => image.id === imageId);

            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.previewUrl);
            }

            const nextImages = currentImages.filter((image) => image.id !== imageId);

            if (nextImages.length === 0) {
                setErrors({});
            }

            return nextImages;
        });
        setSuccessMessage(null);
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>): void => {
        updateSelectedImages(event.target.files ? Array.from(event.target.files) : []);
        event.target.value = '';
    };

    const handleDragOver = (event: DragEvent<HTMLLabelElement>): void => {
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLLabelElement>): void => {
        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (event: DragEvent<HTMLLabelElement>): void => {
        event.preventDefault();
        setIsDragging(false);
        updateSelectedImages(event.dataTransfer.files ? Array.from(event.dataTransfer.files) : []);
    };

    const parseFileName = (contentDisposition: string | null): string | null => {
        if (!contentDisposition) {
            return null;
        }

        const match = contentDisposition.match(/filename="([^"]+)"/i);

        return match?.[1] ?? null;
    };

    const imageErrorMessage = Array.isArray(errors.images)
        ? errors.images[0]
        : errors.images;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();

        if (selectedImages.length === 0) {
            setErrors({
                images: 'Please choose at least one image to convert.',
            });
            return;
        }

        setIsProcessing(true);
        setErrors({});
        setSuccessMessage(null);

        const formData = new FormData();

        selectedImages.forEach((image) => {
            formData.append('images[]', image.file);
        });

        formData.append('output_format', outputFormat);

        const csrfToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content');

        try {
            const response = await fetch(ConverterController.store().url, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);

                setErrors(normalizeServerErrors(payload));

                return;
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            const fileName = parseFileName(response.headers.get('Content-Disposition'))
                ?? (selectedImages.length > 1
                    ? `converted-images-${outputFormat}.zip`
                    : `converted-image.${outputFormat}`);

            downloadLink.href = objectUrl;
            downloadLink.download = fileName;
            downloadLink.click();

            URL.revokeObjectURL(objectUrl);
            setSuccessMessage(
                selectedImages.length > 1
                    ? `Done — downloaded ${fileName} with ${selectedImages.length} converted images.`
                    : `Done — downloaded ${fileName}.`,
            );
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Convert Images" />
            <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-start py-10">
                <div className="flex w-full max-w-3xl flex-col items-center gap-8">
                    <div className="text-center">
                        <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                            Convert Images
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Convert one image or a whole batch of PNG, JPG, GIF, WebP, or ICO files into one format.
                        </p>
                    </div>

                    <div className="w-full rounded-2xl bg-white p-8 shadow-xl ring-1 shadow-black/5 ring-gray-200 dark:bg-[#161615] dark:ring-[#fffaed2d]">
                        <div className="mb-8 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/20 dark:bg-blue-900/10">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-400">
                                Drop in multiple images and we will convert them all into one chosen format. Batch downloads arrive as a ZIP.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Image Files
                                </label>
                                <label
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-10 text-center transition-all ${
                                        isDragging
                                            ? 'border-[#f53003] bg-red-50/60 dark:border-[#FF4433] dark:bg-red-950/30'
                                            : 'border-gray-300 bg-gray-50 hover:border-[#f53003] hover:bg-red-50/30 dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:hover:border-[#FF4433] dark:hover:bg-red-950/20'
                                    }`}
                                >
                                    {previewStack.length > 0 ? (
                                        <div className="relative mb-2 flex h-44 w-full max-w-sm items-center justify-center">
                                            {previewStack.map((image, index) => {
                                                const transforms = [
                                                    '-rotate-6 -translate-x-8',
                                                    'rotate-0 translate-y-1',
                                                    'rotate-6 translate-x-8',
                                                ];

                                                return (
                                                    <div
                                                        key={image.id}
                                                        className={`absolute w-44 overflow-hidden rounded-2xl border border-white/70 bg-white p-2 shadow-xl shadow-black/10 ring-1 ring-black/5 transition-transform dark:border-white/10 dark:bg-[#111111] dark:ring-white/10 ${transforms[index] ?? ''}`}
                                                    >
                                                        <img
                                                            src={image.previewUrl}
                                                            alt={image.file.name}
                                                            className="h-28 w-full rounded-xl object-cover"
                                                        />
                                                        <div className="mt-2 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                            {image.file.name}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {selectedImages.length > 3 && (
                                                <div className="absolute right-2 bottom-0 rounded-full bg-[#f53003] px-3 py-1 text-xs font-bold text-white shadow-md shadow-red-500/20 dark:bg-[#FF4433]">
                                                    +{selectedImages.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-gray-400 dark:text-gray-500"
                                        >
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                            <path d="m21 15-5-5L5 21"></path>
                                        </svg>
                                    )}

                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {selectedImages.length > 0
                                            ? `${selectedImages.length} image${selectedImages.length === 1 ? '' : 's'} selected`
                                            : 'Choose one or more images to convert'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {isDragging
                                            ? 'Drop your images here'
                                            : 'PNG, JPG, GIF, WebP, or ICO — up to 10 MB each'}
                                    </span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/png,image/jpeg,image/gif,image/webp,image/x-icon,image/vnd.microsoft.icon,.png,.jpg,.jpeg,.gif,.webp,.ico"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                                {imageErrorMessage && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {imageErrorMessage}
                                    </p>
                                )}
                            </div>

                            {selectedImages.length > 0 && (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {selectedImages.map((image) => (
                                        <div
                                            key={image.id}
                                            className="rounded-2xl border border-gray-200 bg-gray-50 p-3 shadow-sm dark:border-[#2b2b28] dark:bg-[#0f0f0f]"
                                        >
                                            <img
                                                src={image.previewUrl}
                                                alt={image.file.name}
                                                className="h-28 w-full rounded-xl object-cover"
                                            />
                                            <div className="mt-3 space-y-1">
                                                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                                    {image.file.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {(image.file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeSelectedImage(image.id)}
                                                className="mt-3 text-xs font-semibold text-gray-500 transition-colors hover:text-[#f53003] dark:text-gray-400 dark:hover:text-[#FF4433]"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Convert Everything To
                                </label>
                                <select
                                    value={outputFormat}
                                    onChange={(event) => setOutputFormat(event.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:text-[#EDEDEC] dark:focus:border-blue-400 dark:focus:ring-blue-400"
                                >
                                    {supportedFormats.map((format) => (
                                        <option key={format} value={format}>
                                            {format.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    This format applies to every selected image in the batch.
                                </p>
                                {errors.output_format && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.output_format}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full rounded-xl bg-[#f53003] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-[#e22c02] active:scale-[0.98] disabled:opacity-50 dark:bg-[#FF4433] dark:shadow-red-900/20 dark:hover:bg-[#f63d2d]"
                            >
                                {isProcessing
                                    ? 'Converting images...'
                                    : `Convert ${selectedImages.length > 0 ? selectedImages.length : ''} image${selectedImages.length === 1 ? '' : 's'}`.trim()}
                            </button>
                        </form>

                        {successMessage && (
                            <div className="mt-6 rounded-lg border border-green-100 bg-green-50 p-4 dark:border-green-900/20 dark:bg-green-900/10">
                                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                    {successMessage}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
