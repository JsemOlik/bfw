import { Head, Link as InertiaLink, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import DeleteConfirmModal from '@/components/delete-confirm-modal';
import FileTypeIcon from '@/components/file-type-icon';
import PasteVideoPlayer from '@/components/paste-video-player';
import PasteController from '@/actions/App/Http/Controllers/PasteController';
import MarketingNavbar from '@/components/marketing-navbar';
import { formatDateTime } from '@/lib/dates';

function formatBytes(size: number | null): string | null {
    if (! size) {
        return null;
    }

    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
    paste: {
        id: number;
        user_id: number | null;
        type: 'text' | 'image' | 'video' | 'file';
        slug: string;
        public_url: string;
        download_url: string;
        syntax: string | null;
        snippet: string;
        view_count: number;
        today_view_count: number;
        media_url: string | null;
        original_filename: string | null;
        mime_type: string | null;
        size_bytes?: number | null;
        created_at: string;
        expires_at: string | null;
        is_expired: boolean;
    };
}

export default function Status({ paste }: Props) {
    const { auth } = usePage<{ auth: { user?: { id: number } | null } }>().props;
    const shortUrl = paste.public_url;
    const expiresAtText = paste.expires_at
        ? formatDateTime(paste.expires_at)
        : 'Never';
    const [copied, setCopied] = useState(false);

    const { delete: destroy, processing } = useForm();
    const isOwner = auth.user && paste.user_id === auth.user.id;
    const isImagePaste = paste.type === 'image';
    const isVideoPaste = paste.type === 'video';
    const isFilePaste = paste.type === 'file';
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timeout);
        }
    }, [copied]);

    const handleDelete = (e: React.MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();
        setIsModalOpen(true);
    };

    const confirmDelete = (): void => {
        destroy(PasteController.destroy(paste.id).url, {
            onSuccess: () => setIsModalOpen(false),
        });
    };

    return (
        <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] px-6 pt-32 pb-6 lg:px-8 lg:pb-8 dark:bg-[#0a0a0a]">
            <MarketingNavbar />
            <Head title={`Status: ${paste.slug}`} />

            <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5 dark:border-[#3E3E3A] dark:bg-[#161615]">
                <div className="relative bg-gradient-to-br from-[#f53003] via-[#ff4433] to-[#e22c02] p-8 text-white">
                    <div className="relative z-10">
                        <h1 className="mb-1 text-2xl font-bold">
                            Paste Details
                        </h1>
                        <p className="text-sm text-white/80">
                            Status for{' '}
                            <span className="rounded bg-black/10 px-2 py-0.5 font-mono italic">
                                /{paste.slug}
                            </span>
                        </p>
                    </div>
                    {isOwner && (
                        <div className="absolute top-8 right-8 z-10">
                            <span className="rounded-md bg-white/20 px-2 py-1 text-[10px] font-bold tracking-wider text-white uppercase ring-1 ring-white/30 backdrop-blur-sm">
                                This paste is yours
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-8 p-8">
                    <div>
                        <label className="mb-3 block text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
                            {isImagePaste
                                ? 'Image Preview'
                                : isVideoPaste
                                  ? 'Video Preview'
                                  : isFilePaste
                                    ? 'File Preview'
                                : `Snippet Preview (${paste.syntax ?? 'plaintext'})`}
                        </label>
                        {isImagePaste && paste.media_url ? (
                            <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-[#3E3E3A] dark:bg-[#0a0a0a]">
                                <img
                                    src={paste.media_url}
                                    alt={paste.original_filename ?? paste.slug}
                                    className="max-h-80 w-full rounded-lg object-contain"
                                />
                                <p className="mt-3 truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {paste.original_filename ?? 'Image paste'}
                                </p>
                            </div>
                        ) : isVideoPaste && paste.media_url ? (
                            <div className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-[#3E3E3A] dark:bg-[#0a0a0a]">
                                <PasteVideoPlayer
                                    src={paste.media_url}
                                    title={
                                        paste.original_filename ??
                                        'Video paste'
                                    }
                                    videoClassName="max-h-80 w-full rounded-lg bg-black object-contain"
                                />
                            </div>
                        ) : isFilePaste ? (
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center dark:border-[#3E3E3A] dark:bg-[#0a0a0a]">
                                <FileTypeIcon
                                    filename={paste.original_filename}
                                    mimeType={paste.mime_type}
                                    className="mx-auto h-20 w-20 rounded-3xl"
                                    badgeClassName="text-[11px]"
                                />
                                <p className="mt-4 truncate text-sm font-semibold text-gray-900 dark:text-white">
                                    {paste.original_filename ?? 'File paste'}
                                </p>
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                    {[paste.mime_type, formatBytes(paste.size_bytes ?? null)]
                                        .filter(Boolean)
                                        .join(' • ')}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 font-mono text-sm leading-snug break-all text-gray-900 dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                                {paste.snippet}
                                {!isImagePaste && !isFilePaste && '...'}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="mb-3 block text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
                            Paste Link
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                readOnly
                                value={shortUrl}
                                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 font-mono text-sm text-gray-700 focus:outline-none dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:text-gray-300"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(shortUrl);
                                    setCopied(true);
                                }}
                                className={`flex w-[130px] items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white shadow-md transition-all active:scale-95 ${copied ? 'bg-green-500 shadow-green-500/20' : 'bg-gray-900 shadow-black/10 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200'}`}
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
                                            strokeWidth="2.5"
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
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 border-y border-gray-100 py-6 lg:grid-cols-4 dark:border-[#3E3E3A]">
                        <div>
                            <label className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
                                Created At
                            </label>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {formatDateTime(paste.created_at)}
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
                                Viewed
                            </label>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {paste.view_count.toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
                                Viewed Today
                            </label>
                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {paste.today_view_count.toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">
                                Expires At
                            </label>
                            <div
                                className={`flex items-center gap-2 text-sm font-bold ${paste.is_expired ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}
                            >
                                {expiresAtText}
                                {paste.is_expired && (
                                    <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] ring-1 ring-red-100 dark:bg-red-900/20 dark:ring-red-900/50">
                                        EXPIRED
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-2 sm:flex-row">
                        <div className="flex flex-1 gap-4">
                            <InertiaLink
                                href="/"
                                className="flex-1 rounded-2xl border border-gray-100 bg-gray-50 py-4 text-center font-bold text-gray-600 transition-all hover:bg-gray-100 dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-gray-300 dark:hover:bg-[#202020]"
                            >
                                Home
                            </InertiaLink>
                        </div>
                        {isOwner && (
                            <button
                                onClick={(e) => handleDelete(e)}
                                type="button"
                                disabled={processing}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-8 py-4 font-bold text-red-500 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50 sm:w-auto dark:border-red-900/30 dark:bg-red-900/10"
                            >
                                <svg
                                    width="18"
                                    height="18"
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
                                Delete/Expire
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <DeleteConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={confirmDelete}
                processing={processing}
            />
        </div>
    );
}
