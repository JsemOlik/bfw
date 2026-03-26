import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import DeleteConfirmModal from '@/components/delete-confirm-modal';
import FileTypeIcon from '@/components/file-type-icon';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import PasteController from '@/actions/App/Http/Controllers/PasteController';
import AppLayout from '@/layouts/app-layout';
import { getFileTypePresentation, getPasteTabRecommendation, type PasteTabRecommendation } from '@/lib/file-type';

interface UserPaste {
    id: number;
    type: 'text' | 'image' | 'video' | 'file';
    slug: string;
    public_url: string;
    status_url: string;
    syntax: string;
    snippet: string;
    is_expired: boolean;
}

interface PasteFormData {
    type: 'text' | 'image' | 'video' | 'file';
    content: string;
    syntax: string;
    slug: string;
    image: File | null;
    video: File | null;
    file: File | null;
}

function formatBytes(size: number | null | undefined): string | null {
    if (size === null || size === undefined) {
        return null;
    }

    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function Create({ userPastes = [] }: { userPastes?: UserPaste[] }) {
    const { auth, flash } = usePage<{
        auth: { user?: { role?: string } | null };
        flash: { shortened_link?: string };
    }>().props;

    const [copied, setCopied] = useState(false);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pasteToDelete, setPasteToDelete] = useState<number | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const [imageSelectionError, setImageSelectionError] = useState<string | null>(null);
    const [videoThumbnailUrl, setVideoThumbnailUrl] = useState<string | null>(null);
    const [isDraggingVideo, setIsDraggingVideo] = useState(false);
    const [videoSelectionError, setVideoSelectionError] = useState<string | null>(null);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [fileSelectionError, setFileSelectionError] = useState<string | null>(null);
    const [fileRecommendation, setFileRecommendation] = useState<PasteTabRecommendation | null>(null);
    const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
    const dashboardRef = useRef<HTMLDivElement | null>(null);

    const { delete: destroy, processing: deleting } = useForm();

    const { data, setData, post, processing, progress, errors, reset } =
        useForm<PasteFormData>({
            type: 'text',
            content: '',
            syntax: 'plaintext',
            slug: '',
            image: null,
            video: null,
            file: null,
        });

    const shortenedLink = flash?.shortened_link;
    const isAdmin = auth.user?.role === 'admin';
    const mediaUploadLimitLabel = isAdmin ? '32 GB' : '25 MB';
    const currentPasteLabel = data.type === 'text'
        ? 'text paste'
        : data.type === 'image'
          ? 'image paste'
          : data.type === 'video'
            ? 'video paste'
            : 'file paste';
    const expiryDescription = isAdmin
        ? `Create a ${currentPasteLabel}. Admin pastes never expire ;)`
        : auth.user
          ? data.type === 'text'
            ? 'Paste text, your code, or even logs. Expires in 3 months.'
            : data.type === 'image'
              ? 'Upload your cat, dog, or any other image. Expires in 2 weeks.'
              : data.type === 'video'
                ? 'Upload your birthday party, or any other video. Expires in 2 weeks.'
                : 'Upload documents, archives, or other classic files. Expires in 2 weeks.'
          : data.type === 'text'
            ? 'Paste text, your code, or even logs. Expires in 24 hours.'
            : data.type === 'image'
              ? 'Upload your cat, dog, or any other image. Expires in 24 hours.'
              : data.type === 'video'
                ? 'Upload your birthday party, or any other video. Expires in 24 hours.'
                : 'Upload documents, archives, or other classic files. Expires in 24 hours.';
    const successExpiryNote = isAdmin
        ? '* Admin pastes do not expire. You can still manage them from My Pastes below.'
        : auth.user
          ? data.type === 'text'
            ? '* This text paste expires in 2 months. You can see its status in the My Pastes dropdown below.'
            : data.type === 'image'
              ? '* This image paste expires in 2 weeks. You can see its status in the My Pastes dropdown below.'
              : data.type === 'video'
                ? '* This video paste expires in 2 weeks. You can see its status in the My Pastes dropdown below.'
                : '* This file paste expires in 2 weeks. You can see its status in the My Pastes dropdown below.'
          : '* This paste expires in 24 hours. You can see its status in the My Pastes dropdown below.';
    const selectedFilePresentation = data.file
        ? getFileTypePresentation(data.file.name, data.file.type)
        : null;
    const selectedUpload = data.type === 'image'
        ? data.image
        : data.type === 'video'
          ? data.video
          : data.type === 'file'
            ? data.file
            : null;
    const uploadedBytes = progress?.loaded ?? null;
    const totalUploadBytes = progress?.total ?? selectedUpload?.size ?? null;
    const progressPercentage = progress?.percentage ?? null;
    const uploadProgressLabel = uploadedBytes !== null && totalUploadBytes !== null
        ? `${formatBytes(uploadedBytes)} of ${formatBytes(totalUploadBytes)} uploaded`
        : totalUploadBytes !== null
          ? `Uploading ${formatBytes(totalUploadBytes)} file...`
          : 'Uploading file...';

    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timeout);
        }
    }, [copied]);

    useEffect(() => {
        if (! isDashboardOpen) {
            return;
        }

        const animationFrame = requestAnimationFrame(() => {
            dashboardRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        });

        return () => cancelAnimationFrame(animationFrame);
    }, [isDashboardOpen]);

    useEffect(() => {
        if (! data.image) {
            setImagePreviewUrl(null);
            return;
        }

        const previewUrl = URL.createObjectURL(data.image);

        setImagePreviewUrl(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [data.image]);

    useEffect(() => {
        if (! data.video) {
            setVideoThumbnailUrl(null);
            return;
        }

        const previewUrl = URL.createObjectURL(data.video);
        const previewVideo = document.createElement('video');
        let isCancelled = false;

        previewVideo.preload = 'metadata';
        previewVideo.muted = true;
        previewVideo.playsInline = true;
        previewVideo.src = previewUrl;

        const generateThumbnail = (): void => {
            if (isCancelled || previewVideo.videoWidth === 0 || previewVideo.videoHeight === 0) {
                setVideoThumbnailUrl(null);
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.width = previewVideo.videoWidth;
            canvas.height = previewVideo.videoHeight;

            const context = canvas.getContext('2d');

            if (! context) {
                setVideoThumbnailUrl(null);
                return;
            }

            context.drawImage(previewVideo, 0, 0, canvas.width, canvas.height);
            setVideoThumbnailUrl(canvas.toDataURL('image/jpeg', 0.92));
        };

        previewVideo.addEventListener('loadeddata', generateThumbnail);
        previewVideo.addEventListener('error', () => {
            if (! isCancelled) {
                setVideoThumbnailUrl(null);
            }
        });

        return () => {
            isCancelled = true;
            previewVideo.pause();
            previewVideo.removeAttribute('src');
            previewVideo.load();
            URL.revokeObjectURL(previewUrl);
        };
    }, [data.video]);

    const handleDelete = (id: number): void => {
        setPasteToDelete(id);
        setIsModalOpen(true);
    };

    const confirmDelete = (): void => {
        if (pasteToDelete) {
            destroy(PasteController.destroy(pasteToDelete).url, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    setPasteToDelete(null);
                },
            });
        }
    };

    const switchType = (type: 'text' | 'image' | 'video' | 'file'): void => {
        setData('type', type);

        if (type !== 'image') {
            setData('image', null);
            setImageSelectionError(null);
            setIsDraggingImage(false);
        }

        if (type !== 'video') {
            setData('video', null);
            setVideoSelectionError(null);
            setIsDraggingVideo(false);
        }

        if (type !== 'file') {
            setData('file', null);
            setFileSelectionError(null);
            setIsDraggingFile(false);
        }
    };

    const supportedImageTypes = new Set([
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/x-icon',
        'image/vnd.microsoft.icon',
    ]);
    const supportedImageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico']);
    const supportedVideoTypes = new Set([
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime',
        'video/x-matroska',
    ]);
    const supportedVideoExtensions = new Set(['mp4', 'webm', 'ogg', 'ogv', 'mov', 'mkv']);

    const isSupportedImageFile = (file: File): boolean => {
        if (supportedImageTypes.has(file.type)) {
            return true;
        }

        const extension = file.name.split('.').pop()?.toLowerCase();

        return extension ? supportedImageExtensions.has(extension) : false;
    };

    const isSupportedVideoFile = (file: File): boolean => {
        if (supportedVideoTypes.has(file.type)) {
            return true;
        }

        const extension = file.name.split('.').pop()?.toLowerCase();

        return extension ? supportedVideoExtensions.has(extension) : false;
    };

    const setSelectedImage = (file: File | null): void => {
        if (! file) {
            setImageSelectionError(null);
            setData('image', null);
            return;
        }

        if (isSupportedImageFile(file)) {
            setImageSelectionError(null);
            setData('image', file);
            return;
        }

        setImageSelectionError("Woops, you can't upload this format!");
        setData('image', null);
    };

    const handleImageChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0] ?? null;

        setSelectedImage(file);

        if (file && ! isSupportedImageFile(file)) {
            event.target.value = '';
        }
    };

    const handleImageDragOver = (event: DragEvent<HTMLLabelElement>): void => {
        event.preventDefault();
        setIsDraggingImage(true);
    };

    const handleImageDragLeave = (event: DragEvent<HTMLLabelElement>): void => {
        event.preventDefault();
        setIsDraggingImage(false);
    };

    const handleImageDrop = (event: DragEvent<HTMLLabelElement>): void => {
        event.preventDefault();
        setIsDraggingImage(false);
        setSelectedImage(event.dataTransfer.files?.[0] ?? null);
    };

    const setSelectedVideo = (file: File | null): void => {
        if (! file) {
            setVideoSelectionError(null);
            setData('video', null);
            return;
        }

        if (isSupportedVideoFile(file)) {
            setVideoSelectionError(null);
            setData('video', file);
            return;
        }

        setVideoSelectionError("Woops, you can't upload this format!");
        setData('video', null);
    };

    const handleVideoChange = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0] ?? null;

        setSelectedVideo(file);

        if (file && ! isSupportedVideoFile(file)) {
            event.target.value = '';
        }
    };

    const handleVideoDragOver = (event: DragEvent<HTMLLabelElement>): void => {
        event.preventDefault();
        setIsDraggingVideo(true);
    };

    const handleVideoDragLeave = (event: DragEvent<HTMLLabelElement>): void => {
        event.preventDefault();
        setIsDraggingVideo(false);
    };

    const handleVideoDrop = (event: DragEvent<HTMLLabelElement>): void => {
        event.preventDefault();
        setIsDraggingVideo(false);
        setSelectedVideo(event.dataTransfer.files?.[0] ?? null);
    };

    const setSelectedFile = (file: File | null): void => {
        if (! file) {
            setFileSelectionError(null);
            setData('file', null);
            closeRecommendation();
            return;
        }

        setFileSelectionError(null);
        setData('file', file);

        const recommendation = getPasteTabRecommendation(file);

        if (recommendation) {
            setFileRecommendation(recommendation);
            setIsRecommendationOpen(true);
            return;
        }

        closeRecommendation();
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setSelectedFile(event.target.files?.[0] ?? null);
    };

    const handleFileDragOver = (event: DragEvent<HTMLLabelElement>): void => {
        event.preventDefault();
        setIsDraggingFile(true);
    };

    const handleFileDragLeave = (event: DragEvent<HTMLLabelElement>): void => {
        event.preventDefault();
        setIsDraggingFile(false);
    };

    const handleFileDrop = (event: DragEvent<HTMLLabelElement>): void => {
        event.preventDefault();
        setIsDraggingFile(false);
        setSelectedFile(event.dataTransfer.files?.[0] ?? null);
    };

    const closeRecommendation = (): void => {
        setIsRecommendationOpen(false);
        setFileRecommendation(null);
    };

    const continueWithFileTab = (): void => {
        closeRecommendation();
    };

    const switchToRecommendedTab = async (): Promise<void> => {
        if (!fileRecommendation || !data.file) {
            closeRecommendation();
            return;
        }

        const selectedFile = data.file;
        const recommendation = fileRecommendation;

        closeRecommendation();

        if (recommendation.targetType === 'image') {
            switchType('image');
            setData('image', selectedFile);
            return;
        }

        if (recommendation.targetType === 'video') {
            switchType('video');
            setData('video', selectedFile);
            return;
        }

        try {
            const fileContents = await selectedFile.text();

            switchType('text');
            setData('content', fileContents);
            setData('syntax', 'plaintext');
        } catch {
            setFileSelectionError('We could not read that text file. Please try again.');
            switchType('file');
            setData('file', selectedFile);
        }
    };

    return (
        <AppLayout>
            <Head title="Create a Paste" />
            <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center">
                <div className="flex w-full max-w-2xl translate-y-0 flex-col items-center gap-8 opacity-100 transition-all duration-500 ease-out starting:translate-y-4 starting:opacity-0">
                    <div className="text-center">
                        <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                            Create a Paste
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            {expiryDescription}
                        </p>
                    </div>

                    <div className="w-full rounded-2xl bg-white p-8 shadow-xl ring-1 shadow-black/5 ring-gray-200 dark:bg-[#161615] dark:ring-[#fffaed2d]">
                        {!auth.user && (
                            <div className="mb-8 rounded-lg border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/20 dark:bg-amber-900/10">
                                <div className="flex items-center gap-3 text-amber-900 dark:text-amber-400">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                    </svg>
                                    <p className="text-sm font-medium">
                                        You are pasting as a guest.
                                        <span className="mt-1 block font-normal italic opacity-80">
                                            This {currentPasteLabel} will not be tied to an
                                            account. You won&apos;t be able to delete or
                                            expire it manually. Log in to bump the expiry
                                            from 24 hours to{' '}
                                            {data.type === 'text' ? '3 months' : '2 weeks'}.
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                post(PasteController.store().url, {
                                    preserveScroll: true,
                                    forceFormData: true,
                                    onSuccess: () => reset(),
                                });
                            }}
                            className="space-y-6"
                        >
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Paste Type
                                </label>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <button
                                        type="button"
                                        onClick={() => switchType('text')}
                                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                                            data.type === 'text'
                                                ? 'border-[#f53003] bg-red-50 text-[#f53003] dark:border-[#FF4433] dark:bg-red-950/30 dark:text-[#FF4433]'
                                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:text-gray-300'
                                        }`}
                                    >
                                        Text
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => switchType('image')}
                                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                                            data.type === 'image'
                                                ? 'border-[#f53003] bg-red-50 text-[#f53003] dark:border-[#FF4433] dark:bg-red-950/30 dark:text-[#FF4433]'
                                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:text-gray-300'
                                        }`}
                                    >
                                        Image
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => switchType('video')}
                                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                                            data.type === 'video'
                                                ? 'border-[#f53003] bg-red-50 text-[#f53003] dark:border-[#FF4433] dark:bg-red-950/30 dark:text-[#FF4433]'
                                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:text-gray-300'
                                        }`}
                                    >
                                        Video
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => switchType('file')}
                                        className={`rounded-xl border px-4 py-3 text-sm font-bold transition-all ${
                                            data.type === 'file'
                                                ? 'border-[#f53003] bg-red-50 text-[#f53003] dark:border-[#FF4433] dark:bg-red-950/30 dark:text-[#FF4433]'
                                                : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:text-gray-300'
                                        }`}
                                    >
                                        Files
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div
                                    aria-hidden={data.type !== 'text'}
                                    className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${
                                        data.type === 'text'
                                            ? 'grid-rows-[1fr] opacity-100'
                                            : 'pointer-events-none grid-rows-[0fr] -translate-y-1 opacity-0'
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    Text Content
                                                </label>
                                                <textarea
                                                    value={data.content}
                                                    onChange={(e) =>
                                                        setData('content', e.target.value)
                                                    }
                                                    placeholder="Paste your text here..."
                                                    required={data.type === 'text'}
                                                    rows={6}
                                                    className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:text-[#EDEDEC] dark:focus:border-blue-400 dark:focus:ring-blue-400"
                                                />
                                                {errors.content && (
                                                    <p className="mt-1 text-xs text-red-500">
                                                        {errors.content}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    Syntax Highlighting
                                                </label>
                                                <select
                                                    value={data.syntax}
                                                    onChange={(e) =>
                                                        setData('syntax', e.target.value)
                                                    }
                                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:text-[#EDEDEC] dark:focus:border-blue-400 dark:focus:ring-blue-400"
                                                >
                                                    <option value="plaintext">Plain Text</option>
                                                    <option value="json">JSON</option>
                                                    <option value="yaml">YAML</option>
                                                    <option value="bash">Bash / Shell</option>
                                                    <option value="powershell">PowerShell</option>
                                                    <option value="lua">Lua</option>
                                                    <option value="javascript">
                                                        JavaScript / TypeScript
                                                    </option>
                                                    <option value="go">Go</option>
                                                    <option value="php">PHP</option>
                                                    <option value="python">Python</option>
                                                    <option value="rust">Rust</option>
                                                    <option value="ruby">Ruby</option>
                                                    <option value="c">C</option>
                                                    <option value="cpp">C++</option>
                                                    <option value="csharp">C#</option>
                                                    <option value="xml">XML / HTML</option>
                                                </select>
                                                {errors.syntax && (
                                                    <p className="mt-1 text-xs text-red-500">
                                                        {errors.syntax}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    aria-hidden={data.type !== 'image'}
                                    className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${
                                        data.type === 'image'
                                            ? 'grid-rows-[1fr] opacity-100'
                                            : 'pointer-events-none grid-rows-[0fr] translate-y-1 opacity-0'
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Image File
                                            </label>
                                            <label
                                                onDragOver={handleImageDragOver}
                                                onDragLeave={handleImageDragLeave}
                                                onDrop={handleImageDrop}
                                                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition-all ${
                                                    isDraggingImage
                                                        ? 'border-[#f53003] bg-red-50/60 dark:border-[#FF4433] dark:bg-red-950/30'
                                                        : 'border-gray-300 bg-gray-50 hover:border-[#f53003] hover:bg-red-50/30 dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:hover:border-[#FF4433] dark:hover:bg-red-950/20'
                                                }`}
                                            >
                                                {imagePreviewUrl && (
                                                    <img
                                                        src={imagePreviewUrl}
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
                                                    <rect
                                                        x="3"
                                                        y="3"
                                                        width="18"
                                                        height="18"
                                                        rx="2"
                                                        ry="2"
                                                    ></rect>
                                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                    <path d="m21 15-5-5L5 21"></path>
                                                </svg>
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    {data.image
                                                        ? data.image.name
                                                        : 'Choose an image to upload'}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {isDraggingImage
                                                        ? 'Drop your image here'
                                                        : `PNG, JPG, GIF, WebP, SVG or ICO up to ${mediaUploadLimitLabel}`}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.svg,.ico"
                                                    className="hidden"
                                                    onChange={handleImageChange}
                                                />
                                            </label>
                                            {(imageSelectionError || errors.image) && (
                                                <p className="mt-1 text-xs text-red-500">
                                                    {imageSelectionError ?? errors.image}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    aria-hidden={data.type !== 'file'}
                                    className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${
                                        data.type === 'file'
                                            ? 'grid-rows-[1fr] opacity-100'
                                            : 'pointer-events-none grid-rows-[0fr] translate-y-1 opacity-0'
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                File Upload
                                            </label>
                                            <label
                                                onDragOver={handleFileDragOver}
                                                onDragLeave={handleFileDragLeave}
                                                onDrop={handleFileDrop}
                                                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition-all ${
                                                    isDraggingFile
                                                        ? 'border-[#f53003] bg-red-50/60 dark:border-[#FF4433] dark:bg-red-950/30'
                                                        : 'border-gray-300 bg-gray-50 hover:border-[#f53003] hover:bg-red-50/30 dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:hover:border-[#FF4433] dark:hover:bg-red-950/20'
                                                }`}
                                            >
                                                {data.file ? (
                                                    <FileTypeIcon
                                                        filename={data.file.name}
                                                        mimeType={data.file.type}
                                                        className="h-20 w-20 rounded-3xl"
                                                    />
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
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                        <polyline points="14 2 14 8 20 8"></polyline>
                                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                                        <line x1="10" y1="9" x2="8" y2="9"></line>
                                                    </svg>
                                                )}
                                                <span className="max-w-full truncate text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    {data.file
                                                        ? data.file.name
                                                        : 'Choose a file to upload'}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {isDraggingFile
                                                        ? 'Drop your file here'
                                                        : `Any file up to ${mediaUploadLimitLabel}`}
                                                </span>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                />
                                            </label>
                                            {(fileSelectionError || errors.file) && (
                                                <p className="mt-1 text-xs text-red-500">
                                                    {fileSelectionError ?? errors.file}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    aria-hidden={data.type !== 'video'}
                                    className={`grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${
                                        data.type === 'video'
                                            ? 'grid-rows-[1fr] opacity-100'
                                            : 'pointer-events-none grid-rows-[0fr] translate-y-1 opacity-0'
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Video File
                                            </label>
                                            <label
                                                onDragOver={handleVideoDragOver}
                                                onDragLeave={handleVideoDragLeave}
                                                onDrop={handleVideoDrop}
                                                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition-all ${
                                                    isDraggingVideo
                                                        ? 'border-[#f53003] bg-red-50/60 dark:border-[#FF4433] dark:bg-red-950/30'
                                                        : 'border-gray-300 bg-gray-50 hover:border-[#f53003] hover:bg-red-50/30 dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:hover:border-[#FF4433] dark:hover:bg-red-950/20'
                                                }`}
                                            >
                                                {videoThumbnailUrl && (
                                                    <>
                                                        <img
                                                            src={videoThumbnailUrl}
                                                            alt={
                                                                data.video?.name ??
                                                                'Video paste thumbnail'
                                                            }
                                                            className="max-h-56 w-full rounded-lg border border-gray-200 bg-black object-contain shadow-sm dark:border-[#3E3E3A]"
                                                        />
                                                        <span className="max-w-full truncate text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                            {data.video?.name ?? 'Video paste'}
                                                        </span>
                                                    </>
                                                )}
                                                {!data.video && (
                                                    <>
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
                                                            <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                                        </svg>
                                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                            Choose a video to upload
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {isDraggingVideo
                                                                ? 'Drop your video here'
                                                                : `MP4, WebM, OGG, MOV or MKV up to ${mediaUploadLimitLabel}`}
                                                        </span>
                                                    </>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska,.mp4,.webm,.ogg,.ogv,.mov,.mkv"
                                                    className="hidden"
                                                    onChange={handleVideoChange}
                                                />
                                            </label>
                                            {(videoSelectionError || errors.video) && (
                                                <p className="mt-1 text-xs text-red-500">
                                                    {videoSelectionError ?? errors.video}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Custom Slug (Optional)
                                    </label>
                                    <div className="flex items-stretch overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-[#3E3E3A] dark:bg-[#0a0a0a]">
                                        <div className="flex items-center border-r border-gray-200 bg-gray-100/50 px-4 font-mono text-sm text-black select-none dark:border-white/10 dark:bg-white/5 dark:text-gray-500">
                                            {window.location.host}/
                                        </div>
                                        <input
                                            type="text"
                                            value={data.slug}
                                            onChange={(e) =>
                                                setData('slug', e.target.value)
                                            }
                                            placeholder="my-paste"
                                            className="flex-1 border-none bg-transparent px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset dark:text-[#EDEDEC] dark:focus:ring-blue-400"
                                        />
                                    </div>
                                    {errors.slug && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.slug}
                                        </p>
                                    )}
                                </div>

                                {selectedUpload && (progress || processing) && (
                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-[#3E3E3A] dark:bg-[#0a0a0a]">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                    Upload Progress
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {uploadProgressLabel}
                                                </p>
                                            </div>
                                            <span className="text-sm font-bold text-[#f53003] dark:text-[#FF4433]">
                                                {progressPercentage ?? 100}%
                                            </span>
                                        </div>

                                        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-[#202020]">
                                            <div
                                                className={`h-full rounded-full bg-[#f53003] transition-all duration-300 dark:bg-[#FF4433] ${
                                                    progressPercentage === null ? 'w-full animate-pulse opacity-80' : ''
                                                }`}
                                                style={progressPercentage !== null ? { width: `${progressPercentage}%` } : undefined}
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-xl bg-[#f53003] px-6 py-4 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-[#e22c02] active:scale-[0.98] disabled:opacity-50 dark:bg-[#FF4433] dark:shadow-red-900/20 dark:hover:bg-[#f63d2d]"
                                >
                                    {processing
                                        ? 'Saving Paste...' : 'Create Paste'}
                                </button>
                            </div>
                        </form>

                        {shortenedLink && (
                            <div className="mt-10 overflow-hidden rounded-2xl border border-green-100 bg-green-50/50 p-6 dark:border-green-900/20 dark:bg-green-900/10">
                                <div className="mb-4 flex items-center gap-2 text-green-700 dark:text-green-400">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                    <h3 className="font-bold">
                                        Paste Created Successfully!
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-green-100 bg-white p-4 sm:flex-row sm:items-center dark:border-green-900/30 dark:bg-[#0a0a0a]">
                                        <a
                                            href={shortenedLink}
                                            target="_blank"
                                            className="truncate font-mono text-sm font-medium text-[#f53003] hover:underline dark:text-[#FF4433]"
                                        >
                                            {shortenedLink}
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(shortenedLink);
                                                setCopied(true);
                                            }}
                                            className={`flex w-[130px] items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold shadow-sm transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200'}`}
                                        >
                                            {copied ? (
                                                <>
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="3"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                    </svg>
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <rect
                                                            x="9"
                                                            y="9"
                                                            width="13"
                                                            height="13"
                                                            rx="2"
                                                            ry="2"
                                                        ></rect>
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                    </svg>
                                                    Copy Link
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="px-1 text-[11px] font-medium text-green-700/70 italic dark:text-green-400/50">
                                        {successExpiryNote}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex w-full flex-col items-center gap-6">
                        <div className="flex items-center gap-6 text-sm font-medium">
                            <button
                                onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                                className="flex items-center gap-2 text-gray-600 transition-colors hover:text-black dark:text-gray-400 dark:hover:text-white"
                            >
                                <span className="font-semibold">My Pastes</span>
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={`transition-transform duration-200 ${isDashboardOpen ? 'rotate-180' : ''}`}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                        </div>

                        {isDashboardOpen && (
                            <div
                                ref={dashboardRef}
                                className="w-full max-w-2xl animate-in duration-300 fade-in slide-in-from-top-4"
                            >
                                <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white/50 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                                    {!auth.user ? (
                                        <div className="p-8 text-center text-sm text-gray-500">
                                            To use this feature, please{' '}
                                            <Link
                                                href="/login"
                                                className="font-bold text-[#f53003] hover:underline dark:text-[#FF4433]"
                                            >
                                                log in
                                            </Link>
                                            .
                                        </div>
                                    ) : userPastes.length === 0 ? (
                                        <div className="p-8 text-center text-sm text-gray-500">
                                            You haven&apos;t pasted anything yet.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-white/10">
                                            {userPastes.map((paste) => (
                                                <div
                                                    key={paste.id}
                                                    className="group flex flex-col gap-3 p-4 transition-colors hover:bg-gray-50/50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-white/5"
                                                >
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            {paste.type === 'file' && (
                                                                <FileTypeIcon
                                                                    filename={paste.snippet}
                                                                    className="h-10 w-10 rounded-xl"
                                                                    badgeClassName="text-[9px]"
                                                                />
                                                            )}
                                                            <a
                                                                href={paste.public_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="group flex items-center gap-1.5 font-mono text-sm font-bold text-gray-900 underline decoration-gray-300 decoration-2 underline-offset-4 transition-all hover:text-[#f53003] hover:decoration-[#f53003] dark:text-white dark:decoration-white/10 dark:hover:text-[#FF4433] dark:hover:decoration-[#FF4433]"
                                                            >
                                                                <span>/{paste.slug}</span>
                                                                <svg
                                                                    width="12"
                                                                    height="12"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="3"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    className="opacity-0 transition-opacity group-hover:opacity-100"
                                                                >
                                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                                    <polyline points="15 3 21 3 21 9"></polyline>
                                                                    <line
                                                                        x1="10"
                                                                        y1="14"
                                                                        x2="21"
                                                                        y2="3"
                                                                    ></line>
                                                                </svg>
                                                            </a>
                                                            {paste.is_expired && (
                                                                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 uppercase dark:bg-red-900/20 dark:text-red-400">
                                                                    Expired
                                                                </span>
                                                            )}
                                                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 uppercase dark:bg-gray-800 dark:text-gray-400">
                                                                {paste.type === 'image'
                                                                    ? 'image'
                                                                    : paste.type === 'video'
                                                                      ? 'video'
                                                                      : paste.type === 'file'
                                                                        ? 'file'
                                                                        : paste.syntax}
                                                            </span>
                                                        </div>
                                                        <p className="max-w-[300px] truncate font-mono text-xs text-gray-500">
                                                            {paste.snippet}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={paste.status_url}
                                                            className="rounded-lg bg-gray-100 p-2 text-gray-500 transition-all hover:bg-gray-900 hover:text-white dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white dark:hover:text-black"
                                                        >
                                                            <svg
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2.5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <circle
                                                                    cx="12"
                                                                    cy="12"
                                                                    r="10"
                                                                ></circle>
                                                                <line
                                                                    x1="12"
                                                                    y1="16"
                                                                    x2="12"
                                                                    y2="12"
                                                                ></line>
                                                                <line
                                                                    x1="12"
                                                                    y1="8"
                                                                    x2="12.01"
                                                                    y2="8"
                                                                ></line>
                                                            </svg>
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(paste.id)
                                                            }
                                                            className="rounded-lg bg-red-50 p-2 text-red-500 transition-all hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                                                        >
                                                            <svg
                                                                width="14"
                                                                height="14"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2.5"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                            >
                                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Dialog
                open={isRecommendationOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeRecommendation();
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <div className="mb-4 flex justify-center">
                            <FileTypeIcon
                                filename={data.file?.name}
                                mimeType={data.file?.type}
                                className="h-20 w-20 rounded-3xl"
                                badgeClassName="text-[11px]"
                            />
                        </div>
                        <DialogTitle className="text-center text-xl font-bold text-gray-900 dark:text-white">
                            {fileRecommendation?.title}
                        </DialogTitle>
                        <DialogDescription className="text-center text-gray-500 dark:text-gray-400">
                            {fileRecommendation?.description}
                        </DialogDescription>
                    </DialogHeader>

                    {data.file && selectedFilePresentation && fileRecommendation && (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4 text-center dark:border-white/10 dark:bg-white/[0.03]">
                                <p className="truncate text-sm font-semibold text-foreground">
                                    {data.file.name}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {selectedFilePresentation.label} file detected
                                </p>
                            </div>

                            <div className="rounded-2xl border border-[#f53003]/10 bg-[#f53003]/5 p-4 dark:border-[#ff4433]/15 dark:bg-[#ff4433]/10">
                                <p className="text-sm font-semibold text-foreground">
                                    Why switch?
                                </p>
                                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                                    {fileRecommendation.benefits.map((benefit) => (
                                        <li key={benefit} className="flex items-start gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#f53003] dark:bg-[#ff4433]"></span>
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={continueWithFileTab}
                            className="h-12 rounded-xl"
                        >
                            Continue with Files
                        </Button>
                        <Button
                            type="button"
                            onClick={() => void switchToRecommendedTab()}
                            className="h-12 rounded-xl bg-[#f53003] text-white shadow-lg shadow-red-500/20 hover:bg-[#e22c02] dark:bg-[#FF4433] dark:hover:bg-[#f63d2d]"
                        >
                            Switch to {fileRecommendation?.targetType === 'text'
                                ? 'Text'
                                : fileRecommendation?.targetType === 'image'
                                  ? 'Image'
                                  : 'Video'} tab
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <DeleteConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={confirmDelete}
                processing={deleting}
            />
        </AppLayout>
    );
}
