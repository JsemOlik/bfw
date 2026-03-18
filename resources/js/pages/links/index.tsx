import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import LinkController from '@/actions/App/Http/Controllers/LinkController';
import MarketingNavbar from '@/components/marketing-navbar';
import DeleteConfirmModal from '@/components/delete-confirm-modal';

interface LinkItem {
    id: number;
    original_url: string;
    slug: string;
    expires_at: string;
    user_id: number | null;
}

interface Props {
    links: LinkItem[];
}

export default function Index({ links }: Props) {
    const { auth } = usePage<any>().props;
    const { delete: destroy, processing } = useForm();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [linkToDelete, setLinkToDelete] = useState<number | null>(null);

    const handleDelete = (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
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
        <div className="flex min-h-screen flex-col items-center bg-[#F3F4F6] p-6 lg:p-12">
            <MarketingNavbar />
            <Head title="All Shortened Links" />

            <div className="mx-auto w-full max-w-6xl">
                <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                            Shortened Links
                        </h1>
                        <p className="mt-1 text-xs font-bold tracking-widest text-gray-500 uppercase">
                            Public & Managed Links
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href={LinkController.create().url}
                            className="rounded-xl bg-[#f53003] px-6 py-3 font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-[#e22c02] active:scale-95"
                        >
                            + Shorten New
                        </Link>
                    </div>
                </div>

                <div className="overflow-hidden overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-xl ring-1 ring-black/5">
                    <table className="w-full min-w-[800px] border-collapse text-left">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="px-6 py-5 text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    Original Destination
                                </th>
                                <th className="px-6 py-5 text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    Shortened Slug
                                </th>
                                <th className="px-6 py-5 text-center text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    Expires In
                                </th>
                                <th className="px-6 py-5 text-right text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {links.length > 0 ? (
                                links.map((link) => {
                                    const isExpired =
                                        new Date(link.expires_at) < new Date();
                                    const isOwner =
                                        auth.user &&
                                        link.user_id === auth.user.id;

                                    return (
                                        <tr
                                            key={link.id}
                                            className="group transition-colors hover:bg-gray-50/50"
                                        >
                                            <td className="px-6 py-5">
                                                <div
                                                    className="max-w-xs truncate text-sm font-medium text-gray-900"
                                                    title={link.original_url}
                                                >
                                                    {link.original_url}
                                                </div>
                                                {isOwner && (
                                                    <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold tracking-tighter text-blue-600 uppercase ring-1 ring-blue-100">
                                                        <svg
                                                            width="10"
                                                            height="10"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="3"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        >
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                            <circle
                                                                cx="12"
                                                                cy="7"
                                                                r="4"
                                                            ></circle>
                                                        </svg>
                                                        Your Link
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <Link
                                                    href={`/link/${link.slug}`}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 font-mono text-sm text-gray-700 transition-colors group-hover:bg-[#f53003]/10 group-hover:text-[#f53003]"
                                                >
                                                    <span>
                                                        /link/{link.slug}
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
                                                </Link>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {isExpired ? (
                                                    <span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 uppercase ring-1 ring-red-100">
                                                        Expired
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-col items-center text-xs font-bold text-gray-600">
                                                        <span>
                                                            {new Date(
                                                                link.expires_at,
                                                            ).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-[10px] font-medium tracking-tighter uppercase opacity-50">
                                                            {new Date(
                                                                link.expires_at,
                                                            ).toLocaleTimeString(
                                                                [],
                                                                {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={
                                                            LinkController.status(
                                                                link.slug,
                                                            ).url
                                                        }
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 shadow-sm transition-all hover:bg-gray-900 hover:text-white"
                                                        title="View Details"
                                                    >
                                                        <svg
                                                            width="16"
                                                            height="16"
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
                                                    {isOwner && (
                                                        <button
                                                            onClick={(e) =>
                                                                handleDelete(
                                                                    e,
                                                                    link.id,
                                                                )
                                                            }
                                                            type="button"
                                                            disabled={
                                                                processing
                                                            }
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
                                                            title="Delete Link"
                                                        >
                                                            <svg
                                                                width="16"
                                                                height="16"
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
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-20 text-center"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                                                <svg
                                                    width="32"
                                                    height="32"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="text-gray-300"
                                                >
                                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                                                </svg>
                                            </div>
                                            <p className="font-medium text-gray-500">
                                                No shortened links found.
                                            </p>
                                            <Link
                                                href={
                                                    LinkController.create().url
                                                }
                                                className="mt-4 font-bold text-[#f53003] underline-offset-4 hover:underline"
                                            >
                                                Create the first one →
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-sm font-medium text-gray-400">
                        * Expired links are automatically removed from our
                        servers after 24 hours.
                    </p>
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
