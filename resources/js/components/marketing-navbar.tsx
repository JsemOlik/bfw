import { Link, usePage } from '@inertiajs/react';
import LinkController from '@/actions/App/Http/Controllers/LinkController';
import { dashboard, login, register } from '@/routes/index';

export default function MarketingNavbar() {
    const { auth, canRegister } = usePage<{
        auth: { user: any };
        canRegister: boolean;
    }>().props;

    return (
        <header className="fixed top-0 right-0 left-0 z-50 flex justify-center p-4">
            <nav className="flex w-full max-w-5xl items-center justify-between rounded-2xl border border-white/20 bg-white/70 px-6 py-3 shadow-lg ring-1 ring-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-black/60 dark:ring-white/10">
                {/* Left: Brand */}
                <div className="flex items-center">
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

                {/* Middle: Main Nav */}
                <div className="hidden items-center gap-8 md:flex">
                    <Link
                        href={LinkController.create().url}
                        className="text-sm font-semibold text-gray-600 transition-colors hover:text-[#f53003] dark:text-gray-400 dark:hover:text-[#ff4433]"
                    >
                        Link Shortener
                    </Link>
                </div>

                {/* Right: Auth/Dashboard */}
                <div className="flex items-center gap-3">
                    {auth.user ? (
                        <Link
                            href={dashboard().url}
                            className="rounded-xl bg-[#1b1b18] px-5 py-2 text-sm font-bold text-white transition-all hover:bg-black active:scale-95 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                        >
                            Dashboard
                        </Link>
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
            </nav>
        </header>
    );
}
