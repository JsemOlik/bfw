import { Link, usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import ConverterController from '@/actions/App/Http/Controllers/ConverterController';
import LinkController from '@/actions/App/Http/Controllers/LinkController';
import PasteController from '@/actions/App/Http/Controllers/PasteController';
import { UserProfileDropdown } from '@/components/user-profile-dropdown';
import { login, register } from '@/routes/index';

export default function MarketingNavbar() {
    const { auth, canRegister } = usePage<{
        auth: { user: any };
        canRegister: boolean;
    }>().props;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="fixed top-0 right-0 left-0 z-50 flex justify-center p-4">
            <div className="w-full max-w-5xl">
                <nav className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/70 px-3 py-3 shadow-lg ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/60 dark:ring-white/10">
                    <div className="ml-3 flex items-center">
                        <Link
                            href="/"
                            className="text-xl font-black tracking-tighter text-[#1b1b18] transition-opacity hover:opacity-80 dark:text-white"
                        >
                            bfw
                            <span className="text-[#f53003] dark:text-[#ff4433]">
                                .cz
                            </span>
                        </Link>
                    </div>

                    <div className="hidden items-center gap-8 md:flex">
                        <Link
                            href={ConverterController.create().url}
                            className="text-sm font-semibold text-gray-600 transition-colors hover:text-[#f53003] dark:text-gray-400 dark:hover:text-[#ff4433]"
                        >
                            Converter
                        </Link>
                        <Link
                            href={LinkController.create().url}
                            className="text-sm font-semibold text-gray-600 transition-colors hover:text-[#f53003] dark:text-gray-400 dark:hover:text-[#ff4433]"
                        >
                            Link Shortener
                        </Link>
                        <Link
                            href={PasteController.create().url}
                            className="text-sm font-semibold text-gray-600 transition-colors hover:text-[#f53003] dark:text-gray-400 dark:hover:text-[#ff4433]"
                        >
                            Pastes
                        </Link>
                    </div>

                    <div className="hidden items-center gap-3 md:flex">
                        {auth.user ? (
                            <UserProfileDropdown variant="avatar" />
                        ) : (
                            <>
                                <Link
                                    href={login().url}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:text-black dark:text-gray-300 dark:hover:text-white"
                                >
                                    Log in
                                </Link>
                                {canRegister && (
                                    <Link
                                        href={register().url}
                                        className="rounded-xl bg-[#f53003] px-5 py-2 text-sm font-bold text-white shadow-md shadow-red-500/20 transition-all hover:bg-[#e22c02] active:scale-95 dark:bg-[#ff4433] dark:hover:bg-[#f63d2d]"
                                    >
                                        Register
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsMobileMenuOpen((current) => !current)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition-colors hover:bg-black/5 hover:text-black md:hidden dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                        aria-expanded={isMobileMenuOpen}
                        aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                    >
                        {isMobileMenuOpen ? (
                            <X className="size-5" />
                        ) : (
                            <Menu className="size-5" />
                        )}
                    </button>
                </nav>

                <div
                    className={`grid transition-[grid-template-rows,opacity,transform,margin] duration-300 ease-out md:hidden ${
                        isMobileMenuOpen
                            ? 'mt-3 grid-rows-[1fr] opacity-100'
                            : 'grid-rows-[0fr] -translate-y-1 opacity-0'
                    }`}
                >
                    <div className="overflow-hidden">
                        <div className="space-y-3 rounded-2xl border border-white/20 bg-white/80 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/60 dark:ring-white/10">
                            <Link
                                href={ConverterController.create().url}
                                className="block rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-black/5 hover:text-[#f53003] dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-[#ff4433]"
                            >
                                Converter
                            </Link>
                            <Link
                                href={LinkController.create().url}
                                className="block rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-black/5 hover:text-[#f53003] dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-[#ff4433]"
                            >
                                Link Shortener
                            </Link>
                            <Link
                                href={PasteController.create().url}
                                className="block rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-black/5 hover:text-[#f53003] dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-[#ff4433]"
                            >
                                Pastes
                            </Link>

                            <div className="border-t border-black/5 pt-3 dark:border-white/10">
                                {auth.user ? (
                                    <UserProfileDropdown variant="default" />
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <Link
                                            href={login().url}
                                            className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-black/5 hover:text-black dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                                        >
                                            Log in
                                        </Link>
                                        {canRegister && (
                                            <Link
                                                href={register().url}
                                                className="rounded-xl bg-[#f53003] px-4 py-2.5 text-center text-sm font-bold text-white shadow-md shadow-red-500/20 transition-all hover:bg-[#e22c02] dark:bg-[#ff4433] dark:hover:bg-[#f63d2d]"
                                            >
                                                Register
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
