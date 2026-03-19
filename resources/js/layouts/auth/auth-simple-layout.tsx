import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import MarketingFooter from '@/components/marketing-footer';
import MarketingNavbar from '@/components/marketing-navbar';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-svh flex-col bg-background">
            <MarketingNavbar />
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 pt-28 pb-12 md:p-10 md:pt-32">
                <div className="w-full max-w-sm">
                    <div className="flex flex-col gap-8">
                        <div className="flex flex-col items-center gap-4">
                            <Link
                                href={home()}
                                className="flex flex-col items-center gap-2 font-medium"
                            >
                                <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
                                    {/* <AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" /> */}
                                    {/* <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-toolbox-icon lucide-toolbox"><path d="M16 12v4"/><path d="M16 6a2 2 0 0 1 1.414.586l4 4A2 2 0 0 1 22 12v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 .586-1.414l4-4A2 2 0 0 1 8 6z"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 14h20"/><path d="M8 12v4"/></svg> */}
                                </div>
                                <span className="sr-only">{title}</span>
                            </Link>

                            <div className="space-y-2 text-center">
                                <h1 className="text-xl font-medium">{title}</h1>
                                <p className="text-center text-sm text-muted-foreground">
                                    {description}
                                </p>
                            </div>
                        </div>
                        {children}
                    </div>
                </div>
            </div>
            <MarketingFooter />
        </div>
    );
}
