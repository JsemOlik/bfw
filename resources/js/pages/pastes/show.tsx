import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import FileTypeIcon from '@/components/file-type-icon';
import MarketingNavbar from '@/components/marketing-navbar';
import PasteVideoPlayer from '@/components/paste-video-player';
import { formatDateTime } from '@/lib/dates';

interface HighlightedToken {
    content: string;
    type: string;
}

interface Paste {
    type: 'text' | 'image' | 'video' | 'file';
    content: string | null;
    syntax: string | null;
    slug: string;
    raw_url: string;
    download_url: string | null;
    media_url: string | null;
    original_filename: string | null;
    mime_type: string | null;
    size_bytes: number | null;
    image_width: number | null;
    image_height: number | null;
    created_at: string;
    highlighted_lines: HighlightedToken[][];
}

interface Props {
    paste: Paste;
}

function formatBytes(size: number | null): string | null {
    if (!size) {
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

export default function Show({ paste }: Props) {
    const [copied, setCopied] = useState(false);
    const isImagePaste = paste.type === 'image';
    const isVideoPaste = paste.type === 'video';
    const isFilePaste = paste.type === 'file';
    const isStoredUploadPaste = isImagePaste || isVideoPaste || isFilePaste;
    const copyLabel = 'Copy Raw';
    const badgeLabel = isStoredUploadPaste ? paste.type : (paste.syntax ?? 'plaintext');
    const metadata = [
        paste.original_filename,
        isImagePaste && paste.image_width && paste.image_height
            ? `${paste.image_width}×${paste.image_height}`
            : null,
        formatBytes(paste.size_bytes),
        paste.mime_type,
    ].filter(Boolean);

    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timeout);
        }
    }, [copied]);

    return (
        <div className="flex min-h-screen flex-col bg-[#FDFDFC] dark:bg-[#0a0a0a]">
            <MarketingNavbar />
            <Head title={`Paste: ${paste.slug}`} />

            <div className="container mx-auto max-w-7xl px-4 pt-32 pb-12 sm:px-6 lg:px-8">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            /{paste.slug}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Created {formatDateTime(paste.created_at)}
                        </p>
                        {metadata.length > 0 && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {metadata.join(' • ')}
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold tracking-wider text-gray-600 uppercase dark:bg-[#161615] dark:text-gray-400">
                            {badgeLabel}
                        </span>
                        {isStoredUploadPaste ? (
                            <>
                                <a
                                    href={paste.download_url}
                                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition-all ${
                                        isFilePaste
                                            ? 'bg-[#f53003] text-white shadow-red-500/20 hover:bg-[#e22c02] dark:bg-[#FF4433] dark:hover:bg-[#f63d2d]'
                                            : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-gray-200 dark:hover:bg-[#202020]'
                                    }`}
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
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <path d="M7 10l5 5 5-5"></path>
                                        <path d="M12 15V3"></path>
                                    </svg>
                                    Download
                                </a>
                                {!isFilePaste && (
                                    <a
                                        href={paste.raw_url}
                                        className="flex items-center gap-2 rounded-lg bg-[#f53003] px-4 py-2 text-sm font-bold text-white shadow-sm shadow-red-500/20 transition-all hover:bg-[#e22c02] dark:bg-[#FF4433] dark:hover:bg-[#f63d2d]"
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
                                            <path d="M14 3h7v7"></path>
                                            <path d="M10 14 21 3"></path>
                                            <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"></path>
                                        </svg>
                                        Open Raw
                                    </a>
                                )}
                            </>
                        ) : (
                            <>
                                <a
                                    href={paste.raw_url}
                                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-[#3E3E3A] dark:bg-[#161615] dark:text-gray-200 dark:hover:bg-[#202020]"
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
                                        <path d="M14 3h7v7"></path>
                                        <path d="M10 14 21 3"></path>
                                        <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"></path>
                                    </svg>
                                    View Raw
                                </a>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(paste.content ?? '');
                                        setCopied(true);
                                    }}
                                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition-all ${
                                        copied
                                            ? 'bg-green-500 text-white shadow-green-500/20'
                                            : 'bg-[#f53003] text-white shadow-red-500/20 hover:bg-[#e22c02] dark:bg-[#FF4433] dark:hover:bg-[#f63d2d]'
                                    }`}
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
                                            {copyLabel}
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-[#3E3E3A] dark:bg-[#161615]">
                    <div className="overflow-x-auto p-4 sm:p-6">
                        {isImagePaste ? (
                            <div className="flex justify-center">
                                {paste.media_url && (
                                    <img
                                        src={paste.media_url}
                                        alt={paste.original_filename ?? paste.slug}
                                        className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain"
                                    />
                                )}
                            </div>
                        ) : isVideoPaste ? (
                            <div className="flex justify-center">
                                {paste.media_url && (
                                    <PasteVideoPlayer
                                        src={paste.media_url}
                                        title={
                                            paste.original_filename ??
                                            'Video paste'
                                        }
                                        wrapperClassName="w-full max-w-full"
                                        videoClassName="max-h-[75vh] w-full max-w-full bg-black object-contain"
                                    />
                                )}
                            </div>
                        ) : isFilePaste ? (
                            <div className="flex justify-center">
                                <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-[#3E3E3A] dark:bg-[#0a0a0a]">
                                    <FileTypeIcon
                                        filename={paste.original_filename}
                                        mimeType={paste.mime_type}
                                        className="mx-auto h-20 w-20 rounded-3xl"
                                        badgeClassName="text-[11px]"
                                    />
                                    <p className="mt-4 truncate text-base font-semibold text-gray-900 dark:text-white">
                                        {paste.original_filename ?? 'File paste'}
                                    </p>
                                    {metadata.length > 0 && (
                                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                            {metadata.join(' • ')}
                                        </p>
                                    )}
                                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                                        Download the original file directly.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <pre className="paste-code font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                                <code>
                                    {paste.highlighted_lines.map((line, lineIndex) => (
                                        <span key={lineIndex}>
                                            {line.map((token, tokenIndex) => (
                                                <span
                                                    key={`${lineIndex}-${tokenIndex}`}
                                                    className={`token-${token.type}`}
                                                >
                                                    {token.content}
                                                </span>
                                            ))}
                                            {lineIndex <
                                                paste.highlighted_lines.length - 1 &&
                                                '\n'}
                                        </span>
                                    ))}
                                </code>
                            </pre>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
