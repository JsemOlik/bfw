import { Head, Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import ConverterController from '@/actions/App/Http/Controllers/ConverterController';
import LinkController from '@/actions/App/Http/Controllers/LinkController';
import PasteController from '@/actions/App/Http/Controllers/PasteController';
import AppLogoIcon from '@/components/app-logo-icon';
import MarketingFooter from '@/components/marketing-footer';
import MarketingNavbar from '@/components/marketing-navbar';

export default function Welcome() {
    const featureSlides = useMemo(
        () => [
            {
                key: 'converter',
                badge: 'Converter',
                title: 'Convert image batches in one clean flow.',
                description:
                    'Drop up to 20 images, pick one format, and download the converted files right away.',
            },
            {
                key: 'links',
                badge: 'Link Shortener',
                title: 'Shorten links without extra ceremony.',
                description:
                    'Create tidy share links in seconds and keep your most recent ones close at hand.',
            },
            {
                key: 'pastes',
                badge: 'Pastes',
                title: 'Share text, images, and videos your way.',
                description:
                    'Post snippets, screenshots, and clips with a clean status page and raw access when it matters.',
            },
        ],
        [],
    );
    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setActiveSlide((currentSlide) => (currentSlide + 1) % featureSlides.length);
        }, 5000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [featureSlides.length]);

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
                                        <div className="relative z-20 overflow-hidden rounded-[2rem] border border-gray-200/80 bg-white/98 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-[#121212]/98 dark:shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
                                            <div className="mb-6 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-12 items-center justify-center rounded-2xl bg-[#f53003] text-white shadow-lg shadow-red-500/20 dark:bg-[#FF4433]">
                                                        <AppLogoIcon className="size-6 fill-current" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-gray-950 dark:text-white">
                                                                bfw<span className="text-[#f53003] dark:text-[#ff4433]">.cz</span>
                                                            </p>
                                                            <span className="rounded-full border border-[#f53003]/15 bg-[#f53003]/8 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-[#f53003] uppercase dark:border-[#ff4433]/20 dark:bg-[#ff4433]/10 dark:text-[#ff7b6d]">
                                                                {featureSlides[activeSlide]?.badge}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            Links, pastes, converter
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative min-h-[24rem]">
                                                {featureSlides.map((slide, index) => {
                                                    const isActive = index === activeSlide;

                                                    return (
                                                        <div
                                                            key={slide.key}
                                                            className={`absolute inset-0 flex flex-col justify-between transition-all duration-700 ease-out ${
                                                                isActive
                                                                    ? 'translate-y-0 opacity-100'
                                                                    : 'pointer-events-none translate-y-4 opacity-0'
                                                            }`}
                                                            aria-hidden={!isActive}
                                                        >
                                                            <div className="space-y-5">
                                                                <div className="space-y-3">
                                                                    <div className="space-y-2">
                                                                        <h2 className="text-2xl font-semibold tracking-tight text-gray-950 dark:text-white">
                                                                            {slide.title}
                                                                        </h2>
                                                                        <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                                                                            {slide.description}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="rounded-[1.75rem] border border-gray-200/80 bg-gray-50/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                                                                    {slide.key === 'converter' ? (
                                                                        <div className="space-y-4">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                                    Batch Converter
                                                                                </span>
                                                                                <span className="rounded-full bg-[#f53003]/10 px-2.5 py-1 text-[11px] font-semibold text-[#f53003] dark:bg-[#ff4433]/12 dark:text-[#ff7b6d]">
                                                                                    Up to 20 images
                                                                                </span>
                                                                            </div>
                                                                            <div className="relative flex h-36 items-center justify-center">
                                                                                <div className="absolute left-8 top-5 h-24 w-28 -rotate-6 rounded-2xl border border-gray-200 bg-white shadow-md dark:border-white/10 dark:bg-[#181818]"></div>
                                                                                <div className="absolute h-28 w-32 rounded-2xl border border-[#f53003]/15 bg-white shadow-lg dark:border-[#ff4433]/20 dark:bg-[#171717]">
                                                                                    <div className="grid h-full grid-cols-2 gap-2 p-3">
                                                                                        <div className="rounded-xl bg-gray-200 dark:bg-white/10"></div>
                                                                                        <div className="rounded-xl bg-[#f53003]/18 dark:bg-[#ff4433]/20"></div>
                                                                                        <div className="rounded-xl bg-gray-200 dark:bg-white/10"></div>
                                                                                        <div className="rounded-xl bg-gray-200 dark:bg-white/10"></div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="absolute right-8 top-6 h-24 w-28 rotate-6 rounded-2xl border border-gray-200 bg-white shadow-md dark:border-white/10 dark:bg-[#181818]"></div>
                                                                            </div>
                                                                        </div>
                                                                    ) : null}

                                                                    {slide.key === 'links' ? (
                                                                        <div className="space-y-4">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                                    Share-ready links
                                                                                </span>
                                                                                <span className="rounded-full bg-[#f53003]/10 px-2.5 py-1 text-[11px] font-semibold text-[#f53003] dark:bg-[#ff4433]/12 dark:text-[#ff7b6d]">
                                                                                    Instant
                                                                                </span>
                                                                            </div>
                                                                            <div className="space-y-3">
                                                                                <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-[#181818]">
                                                                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                                        Long URL
                                                                                    </div>
                                                                                    <div className="mt-2 truncate rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-white/5 dark:text-gray-300">
                                                                                        https://example.com/docs/team/update
                                                                                    </div>
                                                                                </div>
                                                                                <div className="rounded-2xl border border-[#f53003]/12 bg-white p-3 shadow-sm dark:border-[#ff4433]/18 dark:bg-[#181818]">
                                                                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                                                        Short link
                                                                                    </div>
                                                                                    <div className="mt-2 flex items-center justify-between rounded-xl bg-[#f53003]/8 px-3 py-2 text-sm font-semibold text-[#f53003] dark:bg-[#ff4433]/10 dark:text-[#ff7b6d]">
                                                                                        <span>bfw.cz/link/demo</span>
                                                                                        <span className="text-[11px] tracking-[0.16em] uppercase">
                                                                                            Ready
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : null}

                                                                    {slide.key === 'pastes' ? (
                                                                        <div className="space-y-4">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                                    Flexible pastes
                                                                                </span>
                                                                                <span className="rounded-full bg-[#f53003]/10 px-2.5 py-1 text-[11px] font-semibold text-[#f53003] dark:bg-[#ff4433]/12 dark:text-[#ff7b6d]">
                                                                                    Text, image, video
                                                                                </span>
                                                                            </div>
                                                                            <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                                                                                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#181818]">
                                                                                    <div className="space-y-2">
                                                                                        <div className="h-2 rounded-full bg-gray-300 dark:bg-white/15"></div>
                                                                                        <div className="h-2 w-4/5 rounded-full bg-gray-300 dark:bg-white/15"></div>
                                                                                        <div className="h-2 w-2/3 rounded-full bg-[#f53003]/35 dark:bg-[#ff4433]/35"></div>
                                                                                        <div className="h-2 w-5/6 rounded-full bg-gray-300 dark:bg-white/15"></div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#181818]">
                                                                                    <div className="grid h-full grid-cols-2 gap-2">
                                                                                        <div className="rounded-xl bg-gray-200 dark:bg-white/10"></div>
                                                                                        <div className="rounded-xl bg-[#f53003]/18 dark:bg-[#ff4433]/20"></div>
                                                                                        <div className="col-span-2 rounded-xl bg-gray-200 dark:bg-white/10"></div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : null}
                                                                </div>

                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="mt-6 flex items-center justify-between gap-4 pt-4">
                                                <div className="flex items-center gap-2">
                                                    {featureSlides.map((slide, index) => (
                                                        <button
                                                            key={slide.key}
                                                            type="button"
                                                            onClick={() => setActiveSlide(index)}
                                                            className={`h-2.5 rounded-full transition-all ${
                                                                index === activeSlide
                                                                    ? 'w-8 bg-[#f53003] dark:bg-[#ff4433]'
                                                                    : 'w-2.5 bg-gray-300 hover:bg-gray-400 dark:bg-white/15 dark:hover:bg-white/25'
                                                            }`}
                                                            aria-label={`Show ${slide.badge} slide`}
                                                            aria-pressed={index === activeSlide}
                                                        />
                                                    ))}
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
