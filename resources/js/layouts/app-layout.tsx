import MarketingFooter from '@/components/marketing-footer';
import MarketingNavbar from '@/components/marketing-navbar';
import type { AppLayoutProps } from '@/types';

export default function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-[#fcfcfb] dark:bg-[#0a0a0a]">
            <MarketingNavbar />
            <main className="flex-1 pt-24 pb-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
            <MarketingFooter />
        </div>
    );
}
