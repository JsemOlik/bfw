import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function Forbidden() {
    return (
        <AppLayout>
            <Head title="Forbidden" />

            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="mx-auto max-w-2xl rounded-3xl border border-black/5 bg-white/80 px-8 py-12 text-center shadow-lg shadow-black/5 ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/30 dark:ring-white/10">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#f53003] dark:text-[#ff4433]">
                        403
                    </p>
                    <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                        You don&apos;t have access to this page.
                    </h1>
                    <p className="mt-4 text-base leading-7 text-muted-foreground">
                        This area is off-limits for your account. If this feels
                        unexpected, head back to the main tools and we&apos;ll keep
                        moving.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
