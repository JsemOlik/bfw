import { Head, Link } from '@inertiajs/react';
import ConverterController from '@/actions/App/Http/Controllers/ConverterController';
import MarketingFooter from '@/components/marketing-footer';
import LinkController from '@/actions/App/Http/Controllers/LinkController';
import PasteController from '@/actions/App/Http/Controllers/PasteController';
import MarketingNavbar from '@/components/marketing-navbar';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome to bfw">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#FDFDFC] px-6 pt-32 pb-6 text-[#1b1b18] lg:px-8 dark:bg-[#0a0a0a]">
                <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center">
                    <div className="h-64 w-64 rounded-full bg-[#f53003]/10 blur-3xl dark:bg-[#ff4433]/10"></div>
                </div>
                <MarketingNavbar />
                <div className="flex w-full flex-1 translate-y-0 items-center justify-center opacity-100 transition-all duration-500 ease-out starting:translate-y-4 starting:opacity-0">
                    <main className="w-full max-w-6xl">
                        <section className="relative overflow-hidden rounded-[2rem] border border-black/8 bg-white/92 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:p-10 dark:border-white/10 dark:bg-[#161615]/96 dark:shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
                                <div className="space-y-8">
                                    <div className="space-y-5">
                                        <div className="inline-flex items-center rounded-full border border-[#f53003]/15 bg-white px-4 py-1.5 text-xs font-semibold tracking-[0.22em] text-[#f53003] uppercase shadow-sm dark:border-[#ff4433]/20 dark:bg-[#111111] dark:text-[#ff7b6d]">
                                            Fast web utilities
                                        </div>
                                        <div className="space-y-4">
                                            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance text-gray-950 sm:text-5xl lg:text-6xl dark:text-white">
                                                Share links, code, images, and videos without the fuss.
                                            </h1>
                                            <p className="max-w-2xl text-base leading-7 text-gray-600 sm:text-lg dark:text-[#A1A09A]">
                                                bfw.cz keeps the useful stuff simple: short links when you need them,
                                                clean pastes when you want them, and a fast flow that feels good on both
                                                desktop and mobile.
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-3 sm:flex-row">
                                            <Link
                                                href={ConverterController.create().url}
                                                className="inline-flex items-center justify-center rounded-xl bg-[#f53003] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-[#e22c02] dark:bg-[#FF4433] dark:shadow-red-900/20 dark:hover:bg-[#f63d2d]"
                                            >
                                                Start Converting
                                            </Link>
                                            <Link
                                                href={LinkController.create().url}
                                                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-900 transition-all hover:border-[#f53003] hover:text-[#f53003] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-[#FF4433] dark:hover:text-[#FF4433]"
                                            >
                                                Start Shortening
                                            </Link>
                                            <Link
                                                href={PasteController.create().url}
                                                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-gray-900 transition-all hover:border-[#f53003] hover:text-[#f53003] dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-[#FF4433] dark:hover:text-[#FF4433]"
                                            >
                                                Create a Paste
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111111]">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Free to use
                                            </p>
                                            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                                No fluff, just the tools you need.
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#111111]">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                Built for sharing
                                            </p>
                                            <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                                Great for messages, docs, issues, and demos.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
                <MarketingFooter />
            </div>
        </>
    );
}
