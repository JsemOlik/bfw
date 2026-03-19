import { Head, Link, usePage } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import LinkController from '@/actions/App/Http/Controllers/LinkController';
import AppLayout from '@/layouts/app-layout';
import DeleteConfirmModal from '@/components/delete-confirm-modal';

export default function Create({ userLinks = [] }: { userLinks?: any[] }) {
    const { auth, flash } = usePage<{
        auth: any;
        flash: { shortened_link?: string };
    }>().props;

    const [copied, setCopied] = useState(false);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [linkToDelete, setLinkToDelete] = useState<number | null>(null);

    const { delete: destroy, processing: deleting } = useForm();

    const { data, setData, post, processing, errors, reset } = useForm({
        url: '',
        slug: '',
    });

    const shortened_link = flash?.shortened_link;
    const isAdmin = auth.user?.role === 'admin';
    const expiryDescription = isAdmin
        ? 'Create a custom, short URL. Admin links never expire.'
        : auth.user
          ? 'Create a custom, short URL that expires in 3 months.'
          : 'Create a custom, short URL that expires in 24 hours.';

    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timeout);
        }
    }, [copied]);

    const handleDelete = (id: number) => {
        setLinkToDelete(id);
        setIsModalOpen(true);
    };

    const confirmDelete = () => {
        if (linkToDelete) {
            destroy(LinkController.destroy(linkToDelete).url, {
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    setLinkToDelete(null);
                },
            });
        }
    };

    return (
        <AppLayout>
            <Head title="Shorten a Link" />
            <div className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center">
                <div className="flex w-full max-w-2xl flex-col items-center gap-8">
                    <div className="text-center">
                        <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                            Shorten a Link
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            {expiryDescription}
                        </p>
                    </div>

                    <div className="w-full rounded-2xl bg-white p-8 shadow-xl ring-1 shadow-black/5 ring-gray-200 dark:bg-[#161615] dark:ring-[#fffaed2d]">
                        {isAdmin && (
                            <div className="mb-8 rounded-lg border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/20 dark:bg-emerald-900/10">
                                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-400">
                                    Oh wow, an admin, enjoy without expiry!
                                </p>
                            </div>
                        )}
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
                                            or expire it manually. Log in to
                                            bump the expiry from 24 hours to 3
                                            months.
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
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-[#3E3E3A] dark:bg-[#0a0a0a] dark:text-[#EDEDEC] dark:focus:border-blue-400 dark:focus:ring-blue-400"
                                />
                                {errors.url && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.url}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Custom Slug (Optional)
                                    </label>
                                    <div className="flex items-stretch overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-[#3E3E3A] dark:bg-[#0a0a0a]">
                                        <div className="flex items-center border-r border-gray-200 bg-gray-100/50 px-4 font-mono text-sm text-black select-none dark:border-white/10 dark:bg-white/5 dark:text-gray-500">
                                            {window.location.host}/link/
                                        </div>
                                        <input
                                            type="text"
                                            value={data.slug}
                                            onChange={(e) =>
                                                setData('slug', e.target.value)
                                            }
                                            placeholder="my-link"
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
                                        ? 'Shortening...'
                                        : 'Get Short Link'}
                                </button>
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
                                        * Link expires in 24 hours. You can see
                                        its status in the My Links dropdown
                                        below.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex w-full flex-col items-center gap-6">
                        <div className="flex items-center gap-6 text-sm font-medium">
                            <button
                                onClick={() =>
                                    setIsDashboardOpen(!isDashboardOpen)
                                }
                                className="flex items-center gap-2 text-gray-600 transition-colors hover:text-black dark:text-gray-400 dark:hover:text-white"
                            >
                                <span className="font-semibold">My Links</span>
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

                        {/* My Links Dropdown Content */}
                        {isDashboardOpen && (
                            <div className="w-full max-w-2xl animate-in duration-300 fade-in slide-in-from-top-4">
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
                                    ) : userLinks.length === 0 ? (
                                        <div className="p-8 text-center text-sm text-gray-500">
                                            You haven't shortened any links yet.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 dark:divide-white/10">
                                            {userLinks.map((link) => (
                                                <div
                                                    key={link.id}
                                                    className="group flex flex-col gap-3 p-4 transition-colors hover:bg-gray-50/50 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-white/5"
                                                >
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <a
                                                                href={`/link/${link.slug}`}
                                                                target="_blank"
                                                                className="group flex items-center gap-1.5 font-mono text-sm font-bold text-gray-900 underline decoration-gray-300 decoration-2 underline-offset-4 transition-all hover:text-[#f53003] hover:decoration-[#f53003] dark:text-white dark:decoration-white/10 dark:hover:text-[#FF4433] dark:hover:decoration-[#FF4433]"
                                                            >
                                                                <span>
                                                                    /{link.slug}
                                                                </span>
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
                                                            {link.is_expired && (
                                                                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600 uppercase dark:bg-red-900/20 dark:text-red-400">
                                                                    Expired
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="max-w-[300px] truncate text-xs text-gray-500">
                                                            {link.original_url}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={
                                                                LinkController.status(
                                                                    link.slug,
                                                                ).url
                                                            }
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
                                                            onClick={() =>
                                                                handleDelete(
                                                                    link.id,
                                                                )
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
