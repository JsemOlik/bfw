import { Link, usePage } from '@inertiajs/react';
import LinkController from '@/actions/App/Http/Controllers/LinkController';
import { dashboard, login, register } from '@/routes/index';

export default function MarketingNavbar() {
    const { auth, canRegister } = usePage<{
        auth: { user: any };
        canRegister: boolean;
    }>().props;

    return (
        <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
            <nav className="flex items-center justify-end gap-4 px-6 py-4 lg:px-0">
                <Link
                    href="/"
                    className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                >
                    Home
                </Link>
                <Link
                    href={LinkController.create().url}
                    className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                >
                    Link Shortener
                </Link>
                {auth.user ? (
                    <Link
                        href={dashboard().url}
                        className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                    >
                        Dashboard
                    </Link>
                ) : (
                    <>
                        <Link
                            href={login().url}
                            className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                        >
                            Log in
                        </Link>
                        {canRegister && (
                            <Link
                                href={register().url}
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                            >
                                Register
                            </Link>
                        )}
                    </>
                )}
            </nav>
        </header>
    );
}
