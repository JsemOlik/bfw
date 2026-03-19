import { Head } from '@inertiajs/react';
import { useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
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
    image?: string;
    output_format?: string;
};

export default function Create({ supportedFormats }: Props) {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [outputFormat, setOutputFormat] = useState<string>(supportedFormats[0] ?? 'png');
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const isSupportedImageFile = (file: File): boolean => {
        if (supportedMimeTypes.has(file.type)) {
            return true;
        }

        const extension = file.name.split('.').pop()?.toLowerCase();

        return extension ? supportedExtensions.has(extension) : false;
    };

    const updateSelectedImage = (file: File | null): void => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        setSuccessMessage(null);

        if (!file) {
            setSelectedImage(null);
            setPreviewUrl(null);
            setErrors({});
            return;
        }

        if (!isSupportedImageFile(file)) {
            setSelectedImage(null);
            setPreviewUrl(null);
            setErrors({
                image: "Woops, you can't convert this format!",
            });
            return;
        }

        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        setErrors({});
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>): void => {
        updateSelectedImage(event.target.files?.[0] ?? null);
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
        updateSelectedImage(event.dataTransfer.files?.[0] ?? null);
    };

    const parseFileName = (contentDisposition: string | null): string | null => {
        if (!contentDisposition) {
            return null;
        }

        const match = contentDisposition.match(/filename="([^"]+)"/i);

        return match?.[1] ?? null;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();

        if (!selectedImage) {
            setErrors({
                image: 'Please choose an image to convert.',
            });
            return;
        }

        setIsProcessing(true);
        setErrors({});
        setSuccessMessage(null);

        const formData = new FormData();
        formData.append('image', selectedImage);
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

                setErrors(payload?.errors ?? {
                    image: 'We could not convert that image right now. Please try another file.',
                });

                return;
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            const downloadLink = document.createElement('a');
            const fileName = parseFileName(response.headers.get('Content-Disposition'))
                ?? `converted-image.${outputFormat}`;

            downloadLink.href = objectUrl;
            downloadLink.download = fileName;
            downloadLink.click();

            URL.revokeObjectURL(objectUrl);
            setSuccessMessage(`Done — downloaded ${fileName}.`);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Convert Images" />
            <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-start py-10">
                <div className="flex w-full max-w-2xl flex-col items-center gap-8">
                    <div className="text-center">
                        <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                            Convert Images
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Convert PNG, JPG, GIF, WebP, or ICO files instantly.
                        </p>
                    </div>

                    <div className="w-full rounded-2xl bg-white p-8 shadow-xl ring-1 shadow-black/5 ring-gray-200 dark:bg-[#161615] dark:ring-[#fffaed2d]">
                        <div className="mb-8 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/20 dark:bg-blue-900/10">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-400">
                                Your image is converted on demand and returned immediately. Nothing is stored.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Image File
                                </label>
                                <label
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition-all ${
                                        isDragging
                                            ? 'border-[#f53003] bg-red-50/60 dark:border-[#FF4433] dark:bg-red-950/30'
                                            : 'border-gray-300 bg-gray-50 hover:border-[#f53003] hover:bg-red-50/30 dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:hover:border-[#FF4433] dark:hover:bg-red-950/20'
                                    }`}
                                >
                                    {previewUrl && (
                                        <img
                                            src={previewUrl}
                                            alt="Selected image preview"
                                            className="max-h-48 w-auto rounded-lg border border-gray-200 object-contain shadow-sm dark:border-[#3E3E3A]"
                                        />
                                    )}
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
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {selectedImage ? selectedImage.name : 'Choose an image to convert'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {isDragging
                                            ? 'Drop your image here'
                                            : 'PNG, JPG, GIF, WebP, or ICO up to 10 MB'}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/gif,image/webp,image/x-icon,image/vnd.microsoft.icon,.png,.jpg,.jpeg,.gif,.webp,.ico"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </label>
                                {errors.image && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.image}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Convert To
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
                                {isProcessing ? 'Converting...' : 'Convert Image'}
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
