import { Head, router } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import DeleteConfirmModal from '@/components/delete-confirm-modal';
import Heading from '@/components/heading';
import PaginationNav from '@/components/pagination-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import AdminLayout from '@/layouts/admin/layout';
import { formatDateTime } from '@/lib/dates';
import {
    destroy as adminLinksDestroy,
    index as adminLinksIndex,
} from '@/routes/admin/links';
import type { BreadcrumbItem } from '@/types';

type AdminLink = {
    id: number;
    slug: string;
    original_url: string;
    public_url: string;
    status_url: string;
    created_at: string;
    expires_at: string | null;
    is_expired: boolean;
    owner_name: string | null;
    owner_email: string | null;
};

type PaginatedLinks = {
    data: AdminLink[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin links',
        href: adminLinksIndex(),
    },
];

export default function AdminLinks({
    links,
    filters,
}: {
    links: PaginatedLinks;
    filters: {
        search: string;
    };
}) {
    const [linkToDelete, setLinkToDelete] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState(filters.search);

    function confirmDelete(): void {
        if (linkToDelete === null) {
            return;
        }

        setDeleting(true);

        router.delete(adminLinksDestroy(linkToDelete).url, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setLinkToDelete(null);
            },
        });
    }

    function submitSearchForm(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const trimmedSearch = search.trim();

        router.get(
            adminLinksIndex.url(
                trimmedSearch === ''
                    ? undefined
                    : { query: { search: trimmedSearch } },
            ),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    }

    function clearSearch(): void {
        setSearch('');

        router.get(adminLinksIndex.url(), {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin links" />

            <h1 className="sr-only">Admin links</h1>

            <AdminLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Shortened links"
                        description="Review every shortened link created across bfw.cz"
                    />

                    <form
                        onSubmit={submitSearchForm}
                        className="flex flex-col gap-3 sm:flex-row"
                    >
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search by link ID, slug, URL, or owner"
                                className="h-11 rounded-2xl border-black/10 bg-white/80 pr-11 pl-10 dark:border-white/10 dark:bg-black/30"
                            />
                            {search !== '' ? (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-[#f53003] dark:hover:text-[#ff4433]"
                                    aria-label="Clear search"
                                >
                                    <X className="size-4" />
                                </button>
                            ) : null}
                        </div>

                        <Button
                            type="submit"
                            className="h-11 rounded-2xl bg-[#f53003] px-5 text-white shadow-lg shadow-red-500/20 hover:bg-[#e22c02] focus-visible:ring-[#f53003]/30 dark:bg-[#ff4433] dark:hover:bg-[#f63d2d] dark:focus-visible:ring-[#ff4433]/30"
                        >
                            Search
                        </Button>
                    </form>

                    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/80 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-black/30 dark:ring-white/10">
                        {links.data.length === 0 ? (
                            <div className="px-6 py-14 text-center">
                                <p className="text-base font-semibold text-foreground">
                                    It&apos;s pretty empty in here...
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {filters.search !== ''
                                        ? 'Try a different search and we might find some links for you.'
                                        : 'No shortened links have been created yet.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-black/5 dark:divide-white/10">
                                    <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                                        <tr className="text-left">
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                ID
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Slug
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Original URL
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Owner
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Expires
                                            </th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Created
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Delete
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5 dark:divide-white/10">
                                        {links.data.map((link, index) => (
                                            <tr
                                                key={link.id}
                                                className={`transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03] ${index % 2 === 1 ? 'bg-black/[0.015] dark:bg-white/[0.02]' : ''}`}
                                            >
                                                <td className="px-4 py-4 text-sm font-semibold text-muted-foreground">
                                                    #{link.id}
                                                </td>
                                                <td className="px-4 py-4 text-sm font-semibold text-foreground">
                                                    <a
                                                        href={link.public_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="group inline-flex items-center gap-1.5 font-mono text-sm font-bold underline decoration-gray-300 decoration-2 underline-offset-4 transition-all hover:text-[#f53003] hover:decoration-[#f53003] dark:decoration-white/10 dark:hover:text-[#FF4433] dark:hover:decoration-[#FF4433]"
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
                                                </td>
                                                <td className="px-4 py-4 text-sm text-muted-foreground">
                                                    <a
                                                        href={link.original_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block max-w-[260px] truncate whitespace-nowrap transition-colors hover:text-[#f53003] dark:hover:text-[#ff4433]"
                                                    >
                                                        {link.original_url}
                                                    </a>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-muted-foreground">
                                                    {link.owner_name ?? 'Guest'}
                                                    <div className="text-xs">
                                                        {link.owner_email ??
                                                            'No account'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-muted-foreground">
                                                    {link.expires_at
                                                        ? formatDateTime(
                                                              link.expires_at,
                                                          )
                                                        : 'Never'}
                                                    {link.is_expired ? (
                                                        <div className="text-xs font-semibold text-red-500">
                                                            Expired
                                                        </div>
                                                    ) : null}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-muted-foreground">
                                                    {formatDateTime(
                                                        link.created_at,
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="rounded-lg bg-red-50 p-2 text-red-500 transition-all hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                                                        onClick={() =>
                                                            setLinkToDelete(
                                                                link.id,
                                                            )
                                                        }
                                                        aria-label={`Delete ${link.slug}`}
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
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <PaginationNav
                            currentPage={links.current_page}
                            lastPage={links.last_page}
                            from={links.from}
                            to={links.to}
                            total={links.total}
                            getPageHref={(page) =>
                                adminLinksIndex.url({
                                    query: {
                                        ...(filters.search !== ''
                                            ? { search: filters.search }
                                            : {}),
                                        page,
                                    },
                                })
                            }
                        />
                    </div>
                </div>
            </AdminLayout>
            <DeleteConfirmModal
                isOpen={linkToDelete !== null}
                onClose={() => setLinkToDelete(null)}
                onConfirm={confirmDelete}
                processing={deleting}
                description="This link will be permanently deleted and will no longer redirect users."
            />
        </AppLayout>
    );
}
