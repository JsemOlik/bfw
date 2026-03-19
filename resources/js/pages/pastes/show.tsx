import { Head, Link } from '@inertiajs/react';
import MarketingNavbar from '@/components/marketing-navbar';
import { useState, useEffect } from 'react';

interface Props {
    paste: {
        content: string;
        syntax: string;
        slug: string;
        created_at: string;
    };
}

export default function Show({ paste }: Props) {
    const [copied, setCopied] = useState(false);

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
                <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            /{paste.slug}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Created {new Date(paste.created_at).toLocaleString()}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 uppercase tracking-wider dark:bg-[#161615] dark:text-gray-400">
                            {paste.syntax}
                        </span>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(paste.content);
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
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                    Copy Raw
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-[#3E3E3A] dark:bg-[#161615]">
                    <div className="overflow-x-auto p-4 sm:p-6">
                        <pre className="font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                            <code>{paste.content}</code>
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
