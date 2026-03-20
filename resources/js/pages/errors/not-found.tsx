import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function NotFound() {
    return (
        <AppLayout>
            <Head title="Not found" />

            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="mx-auto max-w-2xl rounded-3xl border border-black/5 bg-white/80 px-8 py-12 text-center shadow-lg shadow-black/5 ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/30 dark:ring-white/10">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#f53003] dark:text-[#ff4433]">
                        404
                    </p>
                    <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                        We couldn&apos;t find that page.
                    </h1>
                    <p className="mt-4 text-base leading-7 text-muted-foreground">
                        The page might have moved, expired, or never existed in
                        the first place. The navbar and footer are still here to
                        help you get back on track.
                    </p>
                </div>
            </div>
        </AppLayout>
    );
}
