import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import AppLayout from '@/layouts/app-layout';
import AdminLayout from '@/layouts/admin/layout';
import { index as adminUsersIndex } from '@/routes/admin/users';
import type { BreadcrumbItem } from '@/types';

type AdminUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    email_verified_at: string | null;
    created_at: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin users',
        href: adminUsersIndex(),
    },
];

export default function AdminUsers({ users }: { users: AdminUser[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin users" />

            <h1 className="sr-only">Admin users</h1>

            <AdminLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Registered users"
                        description="Review every account currently registered on bfw.cz"
                    />

                    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/80 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-black/30 dark:ring-white/10">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-black/5 dark:divide-white/10">
                                <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                                    <tr className="text-left">
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Email
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Role
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Verified
                                        </th>
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Joined
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 dark:divide-white/10">
                                    {users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                                        >
                                            <td className="px-4 py-4 text-sm font-semibold text-foreground">
                                                {user.name}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-muted-foreground">
                                                {user.email}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-foreground">
                                                <span className="inline-flex rounded-full bg-[#f53003]/10 px-2.5 py-1 text-xs font-semibold text-[#f53003] dark:bg-[#ff4433]/15 dark:text-[#ff786c]">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-sm text-muted-foreground">
                                                {user.email_verified_at
                                                    ? 'Verified'
                                                    : 'Unverified'}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-muted-foreground">
                                                {new Date(
                                                    user.created_at,
                                                ).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        </AppLayout>
    );
}
