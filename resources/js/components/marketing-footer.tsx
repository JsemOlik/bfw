import { Link } from '@inertiajs/react';
import CompressorController from '@/actions/App/Http/Controllers/CompressorController';
import ConverterController from '@/actions/App/Http/Controllers/ConverterController';
import LinkController from '@/actions/App/Http/Controllers/LinkController';
import PasteController from '@/actions/App/Http/Controllers/PasteController';

export default function MarketingFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full px-4 pt-6 pb-4 sm:pt-8">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 rounded-2xl border border-white/20 bg-white/80 px-5 py-4 shadow-xl shadow-black/5 ring-1 ring-black/5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-black/65 dark:ring-white/10">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                    <div className="text-base font-black tracking-tighter text-[#1b1b18] dark:text-white">
                        bfw
                        <span className="text-[#f53003] dark:text-[#ff4433]">
                            .cz
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Made with ❤️ by{' '}
                        <a
                            href="https://github.com/jsemolik"
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium underline decoration-gray-300 underline-offset-4 transition-colors hover:text-[#f53003] hover:decoration-[#f53003] dark:decoration-white/20 dark:hover:text-[#ff4433] dark:hover:decoration-[#ff4433]"
                        >
                            Oliver
                        </a>
                        .
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    <Link
                        href={CompressorController.create().url}
                        className="transition-colors hover:text-[#f53003] dark:hover:text-[#ff4433]"
                    >
                        Compressor
                    </Link>
                    <Link
                        href={ConverterController.create().url}
                        className="transition-colors hover:text-[#f53003] dark:hover:text-[#ff4433]"
                    >
                        Converter
                    </Link>
                    <Link
                        href={LinkController.create().url}
                        className="transition-colors hover:text-[#f53003] dark:hover:text-[#ff4433]"
                    >
                        Link Shortener
                    </Link>
                    <Link
                        href={PasteController.create().url}
                        className="transition-colors hover:text-[#f53003] dark:hover:text-[#ff4433]"
                    >
                        Pastes
                    </Link>
                    <span className="text-sm text-gray-400 dark:text-gray-500">
                        © {currentYear}
                    </span>
                </div>
            </div>
        </footer>
    );
}
