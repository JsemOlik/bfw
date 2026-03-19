import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import DeleteConfirmModal from '@/components/delete-confirm-modal';
import PasteController from '@/actions/App/Http/Controllers/PasteController';
import AppLayout from '@/layouts/app-layout';

interface UserPaste {
    id: number;
    type: 'text' | 'image' | 'video';
    slug: string;
    public_url: string;
    status_url: string;
    syntax: string;
    snippet: string;
    is_expired: boolean;
}

interface PasteFormData {
    type: 'text' | 'image' | 'video';
    content: string;
    syntax: string;
    slug: string;
    image: File | null;
    video: File | null;
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
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
    const [isDraggingVideo, setIsDraggingVideo] = useState(false);
    const [videoSelectionError, setVideoSelectionError] = useState<string | null>(null);
    const dashboardRef = useRef<HTMLDivElement | null>(null);

    const { delete: destroy, processing: deleting } = useForm();

    const { data, setData, post, processing, errors, reset } =
        useForm<PasteFormData>({
            type: 'text',
            content: '',
            syntax: 'plaintext',
            slug: '',
            image: null,
            video: null,
        });

    const shortenedLink = flash?.shortened_link;
    const isAdmin = auth.user?.role === 'admin';
    const currentPasteLabel = data.type === 'text'
        ? 'text paste'
        : data.type === 'image'
          ? 'image paste'
          : 'video paste';
    const expiryDescription = isAdmin
        ? `Create a ${currentPasteLabel}. Admin pastes never expire ;).`
        : auth.user
          ? data.type === 'text'
            ? 'Paste text, your code, or even logs. Expires in 3 months.'
            : data.type === 'image'
              ? 'Upload your cat, dog, or any other image. Expires in 2 weeks.'
              : 'Upload your birthday party, or any other video. Expires in 2 weeks.'
          : data.type === 'text'
            ? 'Paste text, your code, or even logs. Expires in 24 hours.'
            : data.type === 'image'
              ? 'Upload your cat, dog, or any other image. Expires in 24 hours.'
              : 'Upload your birthday party, or any other video. Expires in 24 hours.';
    const successExpiryNote = isAdmin
        ? '* Admin pastes do not expire. You can still manage them from My Pastes below.'
        : auth.user
          ? data.type === 'text'
            ? '* This text paste expires in 2 months. You can see its status in the My Pastes dropdown below.'
            : data.type === 'image'
              ? '* This image paste expires in 2 weeks. You can see its status in the My Pastes dropdown below.'
              : '* This video paste expires in 2 weeks. You can see its status in the My Pastes dropdown below.'
          : '* This paste expires in 24 hours. You can see its status in the My Pastes dropdown below.';

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
            setVideoPreviewUrl(null);
            return;
        }

        const previewUrl = URL.createObjectURL(data.video);

        setVideoPreviewUrl(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
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

    const switchType = (type: 'text' | 'image' | 'video'): void => {
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
                                <div className="grid grid-cols-3 gap-3">
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
                                                        : 'PNG, JPG, GIF, WebP, SVG or ICO up to 10 MB'}
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
                                                {videoPreviewUrl && (
                                                    <video
                                                        src={videoPreviewUrl}
                                                        controls
                                                        className="max-h-56 w-full rounded-lg border border-gray-200 bg-black object-contain shadow-sm dark:border-[#3E3E3A]"
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
                                                    <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                                                </svg>
                                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                    {data.video
                                                        ? data.video.name
                                                        : 'Choose a video to upload'}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {isDraggingVideo
                                                        ? 'Drop your video here'
                                                        : 'MP4, WebM, OGG, MOV or MKV up to 25 MB'}
                                                </span>
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
            <DeleteConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={confirmDelete}
                processing={deleting}
            />
        </AppLayout>
    );
}
