import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import DeleteConfirmModal from '@/components/delete-confirm-modal';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import AdminLayout from '@/layouts/admin/layout';
import {
    destroy as adminPastesDestroy,
    index as adminPastesIndex,
} from '@/routes/admin/pastes';
import type { BreadcrumbItem } from '@/types';

type AdminPaste = {
    id: number;
    type: string;
    slug: string;
    public_url: string;
    status_url: string;
    created_at: string;
    expires_at: string | null;
    is_expired: boolean;
    syntax: string | null;
    mime_type: string | null;
    original_filename: string | null;
    owner_name: string | null;
    owner_email: string | null;
    snippet: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin pastes',
        href: adminPastesIndex(),
    },
];

export default function AdminPastes({ pastes }: { pastes: AdminPaste[] }) {
    const [pasteToDelete, setPasteToDelete] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    function confirmDelete(): void {
        if (pasteToDelete === null) {
            return;
        }

        setDeleting(true);

        router.delete(adminPastesDestroy(pasteToDelete).url, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setPasteToDelete(null);
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin pastes" />

            <h1 className="sr-only">Admin pastes</h1>

            <AdminLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Pastes"
                        description="Review every text, image, and video paste created on bfw.cz"
                    />

                    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/80 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-black/30 dark:ring-white/10">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-black/5 dark:divide-white/10">
                                <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                                    <tr className="text-left">
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            ID
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Slug
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Content
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Owner
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Expires
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Delete
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 dark:divide-white/10">
                                    {pastes.map((paste) => (
                                        <tr
                                            key={paste.id}
                                            className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                                        >
                                            <td className="px-4 py-4 text-sm font-semibold text-muted-foreground">
                                                #{paste.id}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-foreground">
                                                <span className="inline-flex rounded-full bg-[#f53003]/10 px-2.5 py-1 text-xs font-semibold capitalize text-[#f53003] dark:bg-[#ff4433]/15 dark:text-[#ff786c]">
                                                    {paste.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-semibold text-foreground">
                                                <a
                                                    href={paste.public_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="group inline-flex items-center gap-1.5 font-mono text-sm font-bold underline decoration-gray-300 decoration-2 underline-offset-4 transition-all hover:text-[#f53003] hover:decoration-[#f53003] dark:decoration-white/10 dark:hover:text-[#FF4433] dark:hover:decoration-[#FF4433]"
                                                >
                                                    <span>
                                                        /{paste.slug}
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
                                            <td className="max-w-sm px-4 py-4 text-sm text-muted-foreground">
                                                <div className="line-clamp-3 break-words">
                                                    {paste.snippet}
                                                </div>
                                                <div className="mt-1 text-xs">
                                                    {paste.original_filename ??
                                                        paste.mime_type ??
                                                        paste.syntax ??
                                                        'No extra metadata'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-muted-foreground">
                                                {paste.owner_name ?? 'Guest'}
                                                <div className="text-xs">
                                                    {paste.owner_email ??
                                                        'No account'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-muted-foreground">
                                                {paste.expires_at
                                                    ? new Date(
                                                          paste.expires_at,
                                                      ).toLocaleString()
                                                    : 'Never'}
                                                {paste.is_expired && (
                                                    <div className="text-xs font-semibold text-red-500">
                                                        Expired
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="rounded-lg bg-red-50 p-2 text-red-500 transition-all hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                                                    onClick={() =>
                                                        setPasteToDelete(
                                                            paste.id,
                                                        )
                                                    }
                                                    aria-label={`Delete ${paste.slug}`}
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
                    </div>
                </div>
            </AdminLayout>
            <DeleteConfirmModal
                isOpen={pasteToDelete !== null}
                onClose={() => setPasteToDelete(null)}
                onConfirm={confirmDelete}
                processing={deleting}
                description="This paste will be permanently deleted and will no longer be available."
            />
        </AppLayout>
    );
}
