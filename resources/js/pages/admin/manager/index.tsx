import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle2, Copy, Download, Pencil, Trash2, UploadCloud } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import DeleteConfirmModal from '@/components/delete-confirm-modal';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin/layout';
import AppLayout from '@/layouts/app-layout';
import { formatDateTime } from '@/lib/dates';
import {
    destroy as adminManagerDestroy,
    index as adminManagerIndex,
    store as adminManagerStore,
    update as adminManagerUpdate,
} from '@/routes/admin/manager';
import type { BreadcrumbItem } from '@/types';

interface ManagerRelease {
    id: number;
    version: string;
    notes: string;
    pub_date: string;
    platform: string;
    signature: string;
    download_url: string;
    storage_url: string;
    original_filename: string;
    mime_type: string | null;
    size_bytes: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface ReleaseFormData {
    version: string;
    notes: string;
    pub_date: string;
    platform: string;
    signature: string;
    installer: File | null;
    is_active: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: '4C Manager',
        href: adminManagerIndex(),
    },
];

function formatBytes(size: number): string {
    if (size < 1024) {
        return `${size} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function toDateTimeLocal(value?: string): string {
    const date = value ? new Date(value) : new Date();
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);

    return localDate.toISOString().slice(0, 16);
}

function buildInitialData(activeRelease: ManagerRelease | undefined): ReleaseFormData {
    return {
        version: activeRelease?.version ?? '',
        notes: activeRelease?.notes ?? '',
        pub_date: toDateTimeLocal(activeRelease?.pub_date),
        platform: activeRelease?.platform ?? 'windows-x86_64',
        signature: activeRelease?.signature ?? '',
        installer: null,
        is_active: true,
    };
}

export default function ManagerIndex({
    jsonUrl,
    releases,
}: {
    jsonUrl: string;
    releases: ManagerRelease[];
}) {
    const activeRelease = releases.find((release) => release.is_active);
    const [editingRelease, setEditingRelease] = useState<ManagerRelease | null>(null);
    const [releaseToDelete, setReleaseToDelete] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [copiedJsonUrl, setCopiedJsonUrl] = useState(false);

    const { data, setData, post, processing, progress, errors, reset, clearErrors, transform } =
        useForm<ReleaseFormData>(buildInitialData(undefined));

    const currentJson = useMemo(() => {
        if (!activeRelease) {
            return '{\n  "error": "No active release yet"\n}';
        }

        return JSON.stringify(
            {
                version: activeRelease.version,
                notes: activeRelease.notes,
                pub_date: activeRelease.pub_date,
                platforms: {
                    [activeRelease.platform]: {
                        signature: activeRelease.signature,
                        url: activeRelease.download_url,
                    },
                },
            },
            null,
            2,
        );
    }, [activeRelease]);

    function selectRelease(release: ManagerRelease): void {
        setEditingRelease(release);
        clearErrors();
        setData({
            version: release.version,
            notes: release.notes,
            pub_date: toDateTimeLocal(release.pub_date),
            platform: release.platform,
            signature: release.signature,
            installer: null,
            is_active: release.is_active,
        });
    }

    function prepareNewRelease(): void {
        setEditingRelease(null);
        clearErrors();
        reset();
        setData(buildInitialData(undefined));
    }

    function handleInstallerChange(event: ChangeEvent<HTMLInputElement>): void {
        setData('installer', event.target.files?.[0] ?? null);
    }

    function submitForm(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (editingRelease) {
            transform((currentData) => ({
                ...currentData,
                _method: 'patch',
            }));

            post(adminManagerUpdate.url(editingRelease.id), {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    reset('installer');
                },
            });

            return;
        }

        transform((currentData) => currentData);
        post(adminManagerStore.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => prepareNewRelease(),
        });
    }

    function confirmDelete(): void {
        if (releaseToDelete === null) {
            return;
        }

        setDeleting(true);

        router.delete(adminManagerDestroy(releaseToDelete).url, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setReleaseToDelete(null);
            },
        });
    }

    async function copyJsonUrl(): Promise<void> {
        await navigator.clipboard.writeText(jsonUrl);
        setCopiedJsonUrl(true);

        window.setTimeout(() => setCopiedJsonUrl(false), 1400);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="4C Manager" />

            <h1 className="sr-only">4C Manager admin</h1>

            <AdminLayout>
                <div className="min-w-0 space-y-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <Heading
                            variant="small"
                            title="4C Manager"
                            description="Upload desktop installers, edit updater JSON, and choose the live release."
                        />

                        <Button
                            type="button"
                            onClick={prepareNewRelease}
                            className="h-11 rounded-2xl bg-[#f53003] px-5 text-white shadow-lg shadow-red-500/20 hover:bg-[#e22c02] dark:bg-[#ff4433] dark:hover:bg-[#f63d2d]"
                        >
                            New release
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="min-w-0 rounded-3xl border border-black/5 bg-white/80 p-5 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-black/30 dark:ring-white/10">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                        Permanent updater JSON
                                    </p>
                                    <a
                                        href={jsonUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-1 block break-all font-mono text-sm font-bold text-foreground underline decoration-gray-300 decoration-2 underline-offset-4 transition-colors hover:text-[#f53003] dark:decoration-white/10 dark:hover:text-[#ff4433]"
                                    >
                                        {jsonUrl}
                                    </a>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={copyJsonUrl}
                                    className="rounded-2xl"
                                >
                                    {copiedJsonUrl ? (
                                        <CheckCircle2 className="mr-2 size-4" />
                                    ) : (
                                        <Copy className="mr-2 size-4" />
                                    )}
                                    {copiedJsonUrl ? 'Copied' : 'Copy'}
                                </Button>
                            </div>

                            <pre className="mt-4 max-h-[360px] max-w-full overflow-y-auto overflow-x-hidden rounded-2xl bg-zinc-950 p-4 text-xs leading-relaxed whitespace-pre-wrap break-all text-zinc-100 shadow-inner">
                                {currentJson}
                            </pre>
                        </div>

                        <div className="min-w-0 rounded-3xl border border-black/5 bg-gradient-to-br from-[#fff7f4] to-white p-5 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:from-[#2a0f0b]/60 dark:to-black/30 dark:ring-white/10">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Live release
                            </p>
                            {activeRelease ? (
                                <div className="mt-3 space-y-3">
                                    <div>
                                        <p className="text-3xl font-black tracking-tight text-foreground">
                                            {activeRelease.version}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDateTime(activeRelease.pub_date)}
                                        </p>
                                    </div>
                                    <a
                                        href={activeRelease.download_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#f53003] dark:bg-white dark:text-black dark:hover:bg-[#ff4433] dark:hover:text-white"
                                    >
                                        <Download className="size-4" />
                                        Download installer
                                    </a>
                                    <p className="break-all text-xs text-muted-foreground">
                                        {activeRelease.original_filename}
                                    </p>
                                </div>
                            ) : (
                                <p className="mt-3 text-sm text-muted-foreground">
                                    Upload the first release and it will become active automatically.
                                </p>
                            )}
                        </div>
                    </div>

                    <form
                        onSubmit={submitForm}
                        className="space-y-5 rounded-3xl border border-black/5 bg-white/80 p-5 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-black/30 dark:ring-white/10"
                    >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">
                                    {editingRelease ? `Edit ${editingRelease.version}` : 'Upload a new release'}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    These fields become the JSON consumed by the desktop updater.
                                </p>
                            </div>
                            {editingRelease ? (
                                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-bold text-muted-foreground dark:bg-white/10">
                                    File is optional when editing
                                </span>
                            ) : null}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="version">Version</Label>
                                <Input
                                    id="version"
                                    value={data.version}
                                    onChange={(event) => setData('version', event.target.value)}
                                    placeholder="1.4.0"
                                    className="h-11 rounded-2xl"
                                />
                                <InputError message={errors.version} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="platform">Platform key</Label>
                                <Input
                                    id="platform"
                                    value={data.platform}
                                    onChange={(event) => setData('platform', event.target.value)}
                                    placeholder="windows-x86_64"
                                    className="h-11 rounded-2xl"
                                />
                                <InputError message={errors.platform} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pub_date">Publish date</Label>
                                <Input
                                    id="pub_date"
                                    type="datetime-local"
                                    value={data.pub_date}
                                    onChange={(event) => setData('pub_date', event.target.value)}
                                    className="h-11 rounded-2xl"
                                />
                                <InputError message={errors.pub_date} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="installer">Installer file</Label>
                                <label className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-input bg-background px-3 text-sm transition-colors hover:border-[#f53003] dark:hover:border-[#ff4433]">
                                    <UploadCloud className="size-4 text-muted-foreground" />
                                    <span className="truncate text-muted-foreground">
                                        {data.installer?.name ?? (editingRelease ? 'Keep existing file' : 'Choose .zip or installer')}
                                    </span>
                                    <input
                                        id="installer"
                                        type="file"
                                        onChange={handleInstallerChange}
                                        className="sr-only"
                                    />
                                </label>
                                {progress ? (
                                    <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                                        <div
                                            className="h-full rounded-full bg-[#f53003] transition-all dark:bg-[#ff4433]"
                                            style={{ width: `${progress.percentage}%` }}
                                        />
                                    </div>
                                ) : null}
                                <InputError message={errors.installer} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="signature">Signature</Label>
                            <textarea
                                id="signature"
                                value={data.signature}
                                onChange={(event) => setData('signature', event.target.value)}
                                rows={4}
                                placeholder="Paste the Tauri updater signature here"
                                className="w-full resize-y rounded-2xl border border-input bg-background px-4 py-3 font-mono text-xs shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                            />
                            <InputError message={errors.signature} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Release notes</Label>
                            <textarea
                                id="notes"
                                value={data.notes}
                                onChange={(event) => setData('notes', event.target.value)}
                                rows={3}
                                placeholder="Optional updater notes"
                                className="w-full resize-y rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                            />
                            <InputError message={errors.notes} />
                        </div>

                        <label className="flex items-center gap-3 rounded-2xl border border-black/5 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                            <Checkbox
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked === true)}
                            />
                            <span>
                                <span className="block text-sm font-bold text-foreground">Make this the live updater JSON</span>
                                <span className="block text-xs text-muted-foreground">Only one release is active at a time.</span>
                            </span>
                        </label>

                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <Button type="button" variant="outline" onClick={prepareNewRelease} className="rounded-2xl">
                                Clear
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="rounded-2xl bg-[#f53003] px-5 text-white shadow-lg shadow-red-500/20 hover:bg-[#e22c02] dark:bg-[#ff4433] dark:hover:bg-[#f63d2d]"
                            >
                                {processing ? 'Saving...' : editingRelease ? 'Update release' : 'Upload release'}
                            </Button>
                        </div>
                    </form>

                    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/80 shadow-sm ring-1 ring-black/5 dark:border-white/10 dark:bg-black/30 dark:ring-white/10">
                        {releases.length === 0 ? (
                            <div className="px-6 py-14 text-center">
                                <p className="text-base font-semibold text-foreground">No 4C Manager releases yet.</p>
                                <p className="mt-2 text-sm text-muted-foreground">Upload an installer to publish the first JSON payload.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-black/5 dark:divide-white/10">
                                    <thead className="bg-black/[0.02] dark:bg-white/[0.03]">
                                        <tr className="text-left">
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Version</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">File</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Published</th>
                                            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5 dark:divide-white/10">
                                        {releases.map((release, index) => (
                                            <tr
                                                key={release.id}
                                                className={`transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03] ${index % 2 === 1 ? 'bg-black/[0.015] dark:bg-white/[0.02]' : ''}`}
                                            >
                                                <td className="px-4 py-4 text-sm">
                                                    <button
                                                        type="button"
                                                        onClick={() => selectRelease(release)}
                                                        className="font-bold text-foreground underline decoration-gray-300 decoration-2 underline-offset-4 transition-colors hover:text-[#f53003] dark:decoration-white/10 dark:hover:text-[#ff4433]"
                                                    >
                                                        {release.version}
                                                    </button>
                                                    <div className="text-xs text-muted-foreground">{release.platform}</div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-muted-foreground">
                                                    <a
                                                        href={release.download_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block max-w-[280px] truncate font-mono text-xs font-semibold text-foreground transition-colors hover:text-[#f53003] dark:hover:text-[#ff4433]"
                                                    >
                                                        {release.original_filename}
                                                    </a>
                                                    <div className="text-xs">{formatBytes(release.size_bytes)}</div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-muted-foreground">
                                                    {formatDateTime(release.pub_date)}
                                                </td>
                                                <td className="px-4 py-4 text-sm">
                                                    {release.is_active ? (
                                                        <span className="inline-flex rounded-full bg-[#f53003]/10 px-2.5 py-1 text-xs font-semibold text-[#f53003] dark:bg-[#ff4433]/15 dark:text-[#ff786c]">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold text-muted-foreground dark:bg-white/10">
                                                            Archived
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="inline-flex items-center gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => selectRelease(release)}
                                                            className="rounded-lg p-2"
                                                            aria-label={`Edit ${release.version}`}
                                                        >
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setReleaseToDelete(release.id)}
                                                            className="rounded-lg bg-red-50 p-2 text-red-500 transition-all hover:bg-red-500 hover:text-white dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white"
                                                            aria-label={`Delete ${release.version}`}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>

            <DeleteConfirmModal
                isOpen={releaseToDelete !== null}
                onClose={() => setReleaseToDelete(null)}
                onConfirm={confirmDelete}
                processing={deleting}
                description="This 4C Manager release file and version record will be permanently deleted."
            />
        </AppLayout>
    );
}
