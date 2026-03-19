import { Link } from '@inertiajs/react';
import LinkController from '@/actions/App/Http/Controllers/LinkController';
import PasteController from '@/actions/App/Http/Controllers/PasteController';

export default function MarketingFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="pointer-events-none fixed right-0 bottom-0 left-0 z-40 flex justify-center px-4 pb-4">
            <div className="pointer-events-auto flex w-full max-w-5xl flex-col gap-3 rounded-[1.75rem] border border-white/20 bg-white/80 px-4 py-3 shadow-xl shadow-black/5 ring-1 ring-black/5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-black/65 dark:ring-white/10">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <div className="text-sm font-black tracking-tighter text-[#1b1b18] dark:text-white">
                        bfw
                        <span className="text-[#f53003] dark:text-[#ff4433]">
                            .cz
                        </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Simple tools for links and pastes.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
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
                    <span className="text-gray-400 dark:text-gray-500">
                        © {currentYear}
                    </span>
                </div>
            </div>
        </footer>
    );
}
