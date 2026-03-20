import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Search, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import AdminLayout from '@/layouts/admin/layout';
import { index as adminUsersIndex, update as adminUsersUpdate } from '@/routes/admin/users';
import type { BreadcrumbItem } from '@/types';

type AdminUser = {
    id: number;
    name: string;
    email: string;
    role: string;
    email_verified_at: string | null;
    two_factor_confirmed_at: string | null;
    created_at: string;
    updated_at: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin users',
        href: adminUsersIndex(),
    },
];

export default function AdminUsers({
    users,
    filters,
}: {
    users: AdminUser[];
    filters: {
        search: string;
    };
}) {
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [search, setSearch] = useState(filters.search);
    const { data, setData, patch, processing, errors, clearErrors, reset } =
        useForm({
            name: '',
            email: '',
            role: 'user',
            email_verified: false,
            password: '',
            password_confirmation: '',
        });

    const userMeta = useMemo(() => {
        if (editingUser === null) {
            return [];
        }

        return [
            { label: 'User ID', value: `#${editingUser.id}` },
            {
                label: 'Verified',
                value: editingUser.email_verified_at
                    ? `Yes — ${new Date(editingUser.email_verified_at).toLocaleString()}`
                    : 'No',
            },
            {
                label: 'Joined',
                value: new Date(editingUser.created_at).toLocaleString(),
            },
            {
                label: 'Last updated',
                value: new Date(editingUser.updated_at).toLocaleString(),
            },
            {
                label: 'Two-factor',
                value: editingUser.two_factor_confirmed_at
                    ? `Enabled — ${new Date(editingUser.two_factor_confirmed_at).toLocaleString()}`
                    : 'Not enabled',
            },
        ];
    }, [editingUser]);

    function openEditModal(user: AdminUser): void {
        setEditingUser(user);
        setData({
            name: user.name,
            email: user.email,
            role: user.role,
            email_verified: user.email_verified_at !== null,
            password: '',
            password_confirmation: '',
        });
        clearErrors();
    }

    function closeEditModal(): void {
        setEditingUser(null);
        clearErrors();
        reset();
    }

    function submitEditForm(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (editingUser === null) {
            return;
        }

        patch(adminUsersUpdate(editingUser.id), {
            preserveScroll: true,
            onSuccess: () => closeEditModal(),
        });
    }

    function submitSearchForm(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const trimmedSearch = search.trim();

        router.get(
            adminUsersIndex.url(
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

        router.get(adminUsersIndex.url(), {}, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    }

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
                                placeholder="Search by user ID, name, or email"
                                className="h-11 rounded-2xl border-black/10 bg-white/80 pr-11 pl-10 dark:border-white/10 dark:bg-black/30"
                            />
                            {search !== '' && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-[#f53003] dark:hover:text-[#ff4433]"
                                    aria-label="Clear search"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="h-11 rounded-2xl bg-[#f53003] px-5 text-white shadow-lg shadow-red-500/20 hover:bg-[#e22c02] focus-visible:ring-[#f53003]/30 dark:bg-[#ff4433] dark:hover:bg-[#f63d2d] dark:focus-visible:ring-[#ff4433]/30"
                        >
                            Search
                        </Button>
                    </form>

                    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/80 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-black/30 dark:ring-white/10">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-black/5 dark:divide-white/10">
                                <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                                    <tr className="text-left">
                                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            ID
                                        </th>
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
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Edit
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 dark:divide-white/10">
                                    {users.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                                        >
                                            <td className="px-4 py-4 text-sm font-semibold text-muted-foreground">
                                                #{user.id}
                                            </td>
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
                                            <td className="px-4 py-4 text-right">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="cursor-pointer rounded-full text-muted-foreground transition-colors hover:text-[#f53003] dark:hover:text-[#ff4433]"
                                                    onClick={() =>
                                                        openEditModal(user)
                                                    }
                                                    aria-label={`Edit ${user.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <Dialog
                    open={editingUser !== null}
                    onOpenChange={(open) => !open && closeEditModal()}
                >
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Edit user</DialogTitle>
                            <DialogDescription>
                                Update the account details for{' '}
                                {editingUser?.name ?? 'this user'}.
                            </DialogDescription>
                        </DialogHeader>

                        <form
                            onSubmit={submitEditForm}
                            className="space-y-6"
                        >
                            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">
                                            Name
                                        </Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(event) =>
                                                setData(
                                                    'name',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(event) =>
                                                setData(
                                                    'email',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="role">
                                            Role
                                        </Label>
                                        <Select
                                            value={data.role}
                                            onValueChange={(value) =>
                                                setData('role', value)
                                            }
                                        >
                                            <SelectTrigger
                                                id="role"
                                                className="w-full"
                                            >
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">
                                                    User
                                                </SelectItem>
                                                <SelectItem value="admin">
                                                    Admin
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.role} />
                                    </div>

                                    <div className="rounded-2xl border border-black/5 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                                        <div className="flex items-start gap-3">
                                            <Checkbox
                                                id="email_verified"
                                                checked={data.email_verified}
                                                onCheckedChange={(checked) =>
                                                    setData(
                                                        'email_verified',
                                                        checked === true,
                                                    )
                                                }
                                            />
                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="email_verified"
                                                    className="cursor-pointer"
                                                >
                                                    Mark email as verified
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Turn this off to require the
                                                    user to verify their email
                                                    again.
                                                </p>
                                            </div>
                                        </div>
                                        <InputError
                                            className="mt-3"
                                            message={errors.email_verified}
                                        />
                                    </div>

                                    <div className="grid gap-4 rounded-2xl border border-black/5 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold text-foreground">
                                                Reset password
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Leave these blank to keep the
                                                current password unchanged.
                                            </p>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password">
                                                New password
                                            </Label>
                                            <PasswordInput
                                                id="password"
                                                value={data.password}
                                                onChange={(event) =>
                                                    setData(
                                                        'password',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <InputError
                                                message={errors.password}
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="password_confirmation">
                                                Confirm new password
                                            </Label>
                                            <PasswordInput
                                                id="password_confirmation"
                                                value={
                                                    data.password_confirmation
                                                }
                                                onChange={(event) =>
                                                    setData(
                                                        'password_confirmation',
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 rounded-2xl border border-black/5 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            Account details
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Helpful read-only info from the
                                            database.
                                        </p>
                                    </div>

                                    <dl className="space-y-3">
                                        {userMeta.map((item) => (
                                            <div
                                                key={item.label}
                                                className="rounded-xl border border-black/5 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-black/20"
                                            >
                                                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    {item.label}
                                                </dt>
                                                <dd className="mt-1 text-sm text-foreground">
                                                    {item.value}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                </div>
                            </div>

                            <DialogFooter className="gap-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={closeEditModal}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-[#f53003] text-white shadow-lg shadow-red-500/20 hover:bg-[#e22c02] focus-visible:ring-[#f53003]/30 dark:bg-[#ff4433] dark:hover:bg-[#f63d2d] dark:focus-visible:ring-[#ff4433]/30"
                                >
                                    Save
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </AdminLayout>
        </AppLayout>
    );
}
