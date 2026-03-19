import { Head } from '@inertiajs/react';
import {
    useEffect,
    useMemo,
    useRef,
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
    const [isImageListOpen, setIsImageListOpen] = useState(false);
    const [isClearingImages, setIsClearingImages] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const selectedImagesRef = useRef<SelectedImage[]>([]);
    const clearImagesTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        selectedImagesRef.current = selectedImages;
    }, [selectedImages]);

    useEffect(() => {
        return () => {
            if (clearImagesTimeoutRef.current !== null) {
                window.clearTimeout(clearImagesTimeoutRef.current);
            }

            selectedImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        };
    }, []);

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

    const handleClearAllImages = (): void => {
        if (selectedImages.length === 0 || isClearingImages) {
            return;
        }

        setIsClearingImages(true);
        setErrors({});
        setSuccessMessage(null);

        clearImagesTimeoutRef.current = window.setTimeout(() => {
            clearSelectedImages();
            setIsImageListOpen(false);
            setIsClearingImages(false);
            clearImagesTimeoutRef.current = null;
        }, 420);
    };

    const updateSelectedImages = (files: FileList | File[]): void => {
        setSuccessMessage(null);

        const nextFiles = Array.from(files);

        if (nextFiles.length === 0) {
            return;
        }

        if (clearImagesTimeoutRef.current !== null) {
            window.clearTimeout(clearImagesTimeoutRef.current);
            clearImagesTimeoutRef.current = null;
            setIsClearingImages(false);
        }

        const unsupportedFiles = nextFiles.filter((file) => !isSupportedImageFile(file));

        if (unsupportedFiles.length > 0) {
            setErrors({
                images: "Woops, you can't convert one of those formats!",
            });
            return;
        }

        setSelectedImages((currentImages) => [
            ...currentImages,
            ...nextFiles.map((file, index) => ({
                id: `${file.name}-${file.size}-${currentImages.length + index}`,
                file,
                previewUrl: URL.createObjectURL(file),
            })),
        ]);
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
                setIsImageListOpen(false);
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

    const previewTransforms = useMemo(() => {
        if (previewStack.length <= 1) {
            return ['translate-x-0 translate-y-0 rotate-0 scale-100'];
        }

        if (previewStack.length === 2) {
            return [
                '-translate-x-12 rotate-[-8deg] scale-[0.98]',
                'translate-x-12 rotate-[8deg] scale-[0.98]',
            ];
        }

        return [
            '-translate-x-14 rotate-[-10deg] scale-[0.97]',
            'translate-x-0 translate-y-1 rotate-0 scale-[1.02]',
            'translate-x-14 rotate-[10deg] scale-[0.97]',
        ];
    }, [previewStack.length]);

    const burnTransforms = [
        '-translate-x-6 translate-y-6 rotate-[-16deg] scale-90',
        'translate-y-7 rotate-[8deg] scale-90',
        'translate-x-6 translate-y-6 rotate-[16deg] scale-90',
    ];

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
                                We do not store your images — every conversion happens immediately and your files are returned right away.
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
                                                return (
                                                    <div
                                                        key={image.id}
                                                        className={`absolute w-44 overflow-hidden rounded-2xl border border-white/70 bg-white p-2 shadow-xl shadow-black/10 ring-1 ring-black/5 transition-all duration-400 ease-out dark:border-white/10 dark:bg-[#111111] dark:ring-white/10 ${
                                                            isClearingImages
                                                                ? `${burnTransforms[index] ?? 'translate-y-6 rotate-0 scale-90'} pointer-events-none opacity-0 blur-lg saturate-0 brightness-50`
                                                                : previewTransforms[index] ?? ''
                                                        }`}
                                                        style={{ zIndex: previewStack.length - index }}
                                                    >
                                                        <div className="relative overflow-hidden rounded-xl">
                                                            <img
                                                                src={image.previewUrl}
                                                                alt={image.file.name}
                                                                className="h-28 w-full rounded-xl object-cover"
                                                            />
                                                            <div
                                                                className={`pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-black/70 via-[#f53003]/45 to-yellow-200/30 mix-blend-multiply transition-opacity duration-300 ${
                                                                    isClearingImages ? 'opacity-100' : 'opacity-0'
                                                                }`}
                                                            />
                                                            <div
                                                                className={`pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-b from-yellow-200/70 via-orange-500/45 to-transparent transition-all duration-400 ${
                                                                    isClearingImages
                                                                        ? 'translate-y-8 opacity-100'
                                                                        : '-translate-y-6 opacity-0'
                                                                }`}
                                                            />
                                                            <div
                                                                className={`pointer-events-none absolute inset-x-4 top-2 h-10 rounded-full bg-orange-300/70 blur-2xl transition-all duration-300 ${
                                                                    isClearingImages
                                                                        ? 'translate-y-3 opacity-100'
                                                                        : '-translate-y-2 opacity-0'
                                                                }`}
                                                            />
                                                            <div
                                                                className={`pointer-events-none absolute right-4 bottom-3 h-12 w-12 rounded-full bg-zinc-900/70 blur-xl transition-all duration-400 ${
                                                                    isClearingImages
                                                                        ? 'translate-y-4 scale-125 opacity-100'
                                                                        : 'scale-75 opacity-0'
                                                                }`}
                                                            />
                                                            <div
                                                                className={`pointer-events-none absolute left-4 bottom-2 h-2 w-2 rounded-full bg-zinc-700 transition-all duration-500 ${
                                                                    isClearingImages
                                                                        ? 'translate-x-2 translate-y-6 opacity-100'
                                                                        : 'opacity-0'
                                                                }`}
                                                            />
                                                            <div
                                                                className={`pointer-events-none absolute left-10 bottom-5 h-1.5 w-1.5 rounded-full bg-zinc-800 transition-all delay-75 duration-500 ${
                                                                    isClearingImages
                                                                        ? '-translate-x-3 translate-y-8 opacity-100'
                                                                        : 'opacity-0'
                                                                }`}
                                                            />
                                                            <div
                                                                className={`pointer-events-none absolute right-8 bottom-4 h-1.5 w-1.5 rounded-full bg-zinc-700 transition-all delay-100 duration-500 ${
                                                                    isClearingImages
                                                                        ? 'translate-x-4 translate-y-7 opacity-100'
                                                                        : 'opacity-0'
                                                                }`}
                                                            />
                                                        </div>
                                                        <div className="mt-2 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                            {image.file.name}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {selectedImages.length > 3 && (
                                                <div className="animate-in fade-in zoom-in-75 slide-in-from-bottom-2 absolute right-2 bottom-0 rounded-full bg-[#f53003] px-3 py-1 text-xs font-bold text-white shadow-md shadow-red-500/20 duration-300 dark:bg-[#FF4433]">
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
                                <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3 shadow-sm dark:border-[#2b2b28] dark:bg-[#0f0f0f]">
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsImageListOpen((current) => !current)}
                                            className="flex min-w-0 flex-1 cursor-pointer items-center justify-between rounded-xl px-2 py-1.5 text-left transition-colors hover:text-[#f53003] dark:hover:text-[#FF4433]"
                                            aria-expanded={isImageListOpen}
                                        >
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                View all images
                                            </span>
                                            <span
                                                className={`text-xs font-semibold text-gray-500 transition-transform dark:text-gray-400 ${
                                                    isImageListOpen ? 'rotate-180' : ''
                                                }`}
                                            >
                                                ↓
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClearAllImages}
                                            className="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-gray-500 transition-colors hover:text-[#f53003] dark:text-gray-400 dark:hover:text-[#FF4433]"
                                        >
                                            Clear all
                                        </button>
                                    </div>

                                    <div
                                        className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${
                                            isImageListOpen
                                                ? 'mt-3 grid-rows-[1fr] opacity-100'
                                                : 'grid-rows-[0fr] opacity-0'
                                        }`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                {selectedImages.map((image) => (
                                                    <div
                                                        key={image.id}
                                                        className={`rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all duration-300 ease-out dark:border-[#2b2b28] dark:bg-[#161615] ${
                                                            isClearingImages
                                                                ? 'pointer-events-none translate-y-4 scale-95 opacity-0 blur-md saturate-0'
                                                                : 'opacity-100'
                                                        }`}
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
                                                            className="mt-3 text-xs font-semibold text-gray-500 transition-colors hover:text-[#f53003] disabled:pointer-events-none disabled:opacity-40 dark:text-gray-400 dark:hover:text-[#FF4433]"
                                                            disabled={isClearingImages}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {selectedImages.length <= 1 ? 'Convert To' : 'Convert Everything To'}
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
