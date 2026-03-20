import { Link } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { index as adminUsersIndex } from '@/routes/admin/users';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Users',
        href: adminUsersIndex(),
        icon: null,
    },
];

export default function AdminLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    if (typeof window === 'undefined') {
        return null;
    }

    return (
        <div className="mx-auto w-full max-w-5xl py-6">
            <Heading
                title="Admin"
                description="Manage the administrative side of bfw.cz"
            />

            <div className="flex flex-col lg:flex-row lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav
                        className="flex flex-col space-y-1 space-x-0"
                        aria-label="Admin"
                    >
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn('w-full justify-start', {
                                    'bg-muted': isCurrentOrParentUrl(item.href),
                                })}
                            >
                                <Link href={item.href}>{item.title}</Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <Separator className="my-6 lg:hidden" />

                <div className="flex-1">
                    <section className="w-full space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
