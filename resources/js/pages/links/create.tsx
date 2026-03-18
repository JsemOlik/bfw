import { Head, Link, usePage } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import LinkController from '@/actions/App/Http/Controllers/LinkController';

export default function Create() {
    const { auth, flash } = usePage<{
        auth: any;
        flash: { shortened_link?: string };
    }>().props;

    const [copied, setCopied] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        url: '',
        slug: '',
    });

    const shortened_link = flash?.shortened_link;

    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timeout);
        }
    }, [copied]);

    return (
        <>
            <Head title="Shorten a Link" />
            <div className="flex min-h-screen flex-col items-center bg-[#FDFDFC] p-6 text-[#1b1b18] lg:justify-center lg:p-8 dark:bg-[#0a0a0a]">
                <div className="flex w-full max-w-2xl flex-col items-center gap-8">
                    <div className="text-center">
                        <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                            Shorten a Link
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Create a custom, short URL that expires in 24 hours.
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
                                        <line
                                            x1="12"
                                            y1="9"
                                            x2="12"
                                            y2="13"
                                        ></line>
                                        <line
                                            x1="12"
                                            y1="17"
                                            x2="12.01"
                                            y2="17"
                                        ></line>
                                    </svg>
                                    <p className="text-sm font-medium">
                                        You are shortening as a guest.
                                        <span className="mt-1 block font-normal italic opacity-80">
                                            This link will not be tied to an
                                            account. You won't be able to delete
                                            or expire it manually.
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                post(LinkController.store().url, {
                                    preserveScroll: true,
                                    onSuccess: () => reset('url', 'slug'),
                                });
                            }}
                            className="space-y-6"
                        >
                            <div className="space-y-1">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Long URL
                                </label>
                                <input
                                    type="url"
                                    value={data.url}
                                    onChange={(e) =>
                                        setData('url', e.target.value)
                                    }
                                    placeholder="https://example.com/very-long-url-to-shorten"
                                    required
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-[#f53003] focus:ring-1 focus:ring-[#f53003] dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:text-[#EDEDEC] dark:focus:border-[#FF4433] dark:focus:ring-[#FF4433]"
                                />
                                {errors.url && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.url}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Custom Slug (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={data.slug}
                                        onChange={(e) =>
                                            setData('slug', e.target.value)
                                        }
                                        placeholder="my-link"
                                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-[#f53003] focus:ring-1 focus:ring-[#f53003] dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:text-[#EDEDEC] dark:focus:border-[#FF4433] dark:focus:ring-[#FF4433]"
                                    />
                                    {errors.slug && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.slug}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full rounded-xl bg-[#f53003] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-[#e22c02] active:scale-[0.98] disabled:opacity-50 dark:bg-[#FF4433] dark:shadow-red-900/20 dark:hover:bg-[#f63d2d]"
                                    >
                                        {processing
                                            ? 'Shortening...'
                                            : 'Get Short Link'}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {shortened_link && (
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
                                        Link Created Successfully!
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-green-100 bg-white p-4 sm:flex-row sm:items-center dark:border-green-900/30 dark:bg-[#0a0a0a]">
                                        <a
                                            href={shortened_link}
                                            target="_blank"
                                            className="truncate font-mono text-sm font-medium text-[#f53003] hover:underline dark:text-[#FF4433]"
                                        >
                                            {shortened_link}
                                        </a>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    shortened_link,
                                                );
                                                setCopied(true);
                                            }}
                                            className={`flex min-w-[120px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-all ${copied ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200'}`}
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
                                        * Link expires in 24 hours. Go to{' '}
                                        <Link
                                            href={LinkController.index().url}
                                            className="underline"
                                        >
                                            All Links
                                        </Link>{' '}
                                        to see its status.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-6 text-sm font-medium">
                        <Link
                            href="/"
                            className="text-gray-500 transition-colors hover:text-black dark:text-gray-400 dark:hover:text-white"
                        >
                            ← Back Home
                        </Link>
                        <span className="h-4 w-px bg-gray-200 dark:bg-gray-800"></span>
                        <Link
                            href={LinkController.index().url}
                            className="text-[#f53003] hover:underline dark:text-[#FF4433]"
                        >
                            View All Links
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
