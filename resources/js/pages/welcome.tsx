import { Head, Link } from '@inertiajs/react';
import ConverterController from '@/actions/App/Http/Controllers/ConverterController';
import AppLogoIcon from '@/components/app-logo-icon';
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
                                            100% Free to use
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

                                <div className="relative flex min-h-[28rem] items-center justify-center">
                                    <div className="absolute inset-x-10 top-8 h-48 rounded-full bg-[#f53003]/8 blur-3xl dark:bg-[#ff4433]/10"></div>

                                    <div className="relative w-full max-w-md">
                                        <div className="absolute -top-6 left-2 z-10 w-44 rounded-3xl border border-gray-200/80 bg-white/95 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.10)] backdrop-blur transition-transform duration-500 ease-out hover:-translate-y-1 hover:rotate-[-1deg] dark:border-white/10 dark:bg-[#121212]/95 dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
                                            <div className="mb-3 flex items-center gap-2">
                                                <div className="flex size-9 items-center justify-center rounded-2xl bg-[#f53003]/10 text-[#f53003] dark:bg-[#ff4433]/12 dark:text-[#ff7b6d]">
                                                    🔗
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-950 dark:text-white">
                                                        Short links
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Clean + shareable
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                                                bfw.cz/link/demo
                                            </div>
                                        </div>

                                        <div className="relative z-20 rounded-[2rem] border border-gray-200/80 bg-white/98 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-[#121212]/98 dark:shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
                                            <div className="mb-5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[#f53003] text-white shadow-lg shadow-red-500/20 dark:bg-[#FF4433]">
                                                        <AppLogoIcon className="size-6 fill-current" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-950 dark:text-white">
                                                            bfw<span className="text-[#f53003] dark:text-[#ff4433]">.cz</span>
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Links, pastes, converter
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <span className="size-2.5 rounded-full bg-[#f53003]/80"></span>
                                                    <span className="size-2.5 rounded-full bg-gray-300 dark:bg-white/15"></span>
                                                    <span className="size-2.5 rounded-full bg-gray-300 dark:bg-white/15"></span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            Image converter
                                                        </p>
                                                        <span className="rounded-full bg-[#f53003]/10 px-2.5 py-1 text-[11px] font-semibold text-[#f53003] dark:bg-[#ff4433]/12 dark:text-[#ff7b6d]">
                                                            Instant
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="aspect-[4/3] rounded-xl bg-linear-to-br from-gray-200 to-gray-100 dark:from-white/10 dark:to-white/5"></div>
                                                        <div className="aspect-[4/3] rounded-xl bg-linear-to-br from-[#f53003]/15 to-orange-100 dark:from-[#ff4433]/16 dark:to-orange-950/20"></div>
                                                        <div className="aspect-[4/3] rounded-xl bg-linear-to-br from-gray-200 to-gray-100 dark:from-white/10 dark:to-white/5"></div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                                                        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                                            Paste
                                                        </p>
                                                        <div className="mt-3 space-y-2">
                                                            <div className="h-2 rounded-full bg-gray-300 dark:bg-white/15"></div>
                                                            <div className="h-2 w-4/5 rounded-full bg-gray-300 dark:bg-white/15"></div>
                                                            <div className="h-2 w-2/3 rounded-full bg-[#f53003]/35 dark:bg-[#ff4433]/35"></div>
                                                        </div>
                                                    </div>

                                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                                                        <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                                                            Share
                                                        </p>
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <div className="size-8 rounded-full bg-gray-300 dark:bg-white/15"></div>
                                                            <div className="size-8 rounded-full bg-[#f53003]/35 dark:bg-[#ff4433]/35"></div>
                                                            <div className="size-8 rounded-full bg-gray-300 dark:bg-white/15"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="absolute right-0 bottom-4 z-10 w-48 rounded-3xl border border-gray-200/80 bg-white/95 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.10)] backdrop-blur transition-transform duration-500 ease-out hover:-translate-y-1 hover:rotate-[1deg] dark:border-white/10 dark:bg-[#121212]/95 dark:shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
                                            <div className="mb-3 flex items-center gap-2">
                                                <div className="flex size-9 items-center justify-center rounded-2xl bg-[#f53003]/10 text-[#f53003] dark:bg-[#ff4433]/12 dark:text-[#ff7b6d]">
                                                    📝
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-950 dark:text-white">
                                                        Smart pastes
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Text, image, video
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5">
                                                <div className="space-y-1.5">
                                                    <div className="h-2 rounded-full bg-gray-300 dark:bg-white/15"></div>
                                                    <div className="h-2 w-5/6 rounded-full bg-gray-300 dark:bg-white/15"></div>
                                                    <div className="h-2 w-2/3 rounded-full bg-[#f53003]/35 dark:bg-[#ff4433]/35"></div>
                                                </div>
                                            </div>
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
