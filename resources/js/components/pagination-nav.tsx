import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

type PaginationNavProps = {
    currentPage: number;
    lastPage: number;
    from: number | null;
    to: number | null;
    total: number;
    getPageHref: (page: number) => string;
};

function buildPages(currentPage: number, lastPage: number): Array<number | string> {
    if (lastPage <= 5) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, lastPage, currentPage - 1, currentPage, currentPage + 1]);

    const visiblePages = Array.from(pages)
        .filter((page) => page >= 1 && page <= lastPage)
        .sort((left, right) => left - right);

    const items: Array<number | string> = [];

    for (const [index, page] of visiblePages.entries()) {
        const previousPage = visiblePages[index - 1];

        if (previousPage !== undefined && page - previousPage > 1) {
            items.push(`ellipsis-${previousPage}-${page}`);
        }

        items.push(page);
    }

    return items;
}

export default function PaginationNav({
    currentPage,
    lastPage,
    from,
    to,
    total,
    getPageHref,
}: PaginationNavProps) {
    if (lastPage <= 1) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 border-t border-black/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <p className="text-sm text-muted-foreground">
                Showing {from ?? 0}–{to ?? 0} of {total}
            </p>

            <div className="flex flex-wrap items-center gap-2">
                <Link
                    href={getPageHref(Math.max(currentPage - 1, 1))}
                    preserveScroll
                    preserveState
                    className={cn(
                        'rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                        currentPage === 1
                            ? 'pointer-events-none border-black/5 bg-black/[0.03] text-muted-foreground dark:border-white/10 dark:bg-white/[0.03]'
                            : 'border-black/10 bg-white text-foreground hover:border-[#f53003]/30 hover:text-[#f53003] dark:border-white/10 dark:bg-black/20 dark:hover:border-[#ff4433]/30 dark:hover:text-[#ff786c]',
                    )}
                >
                    Previous
                </Link>

                {buildPages(currentPage, lastPage).map((item) =>
                    typeof item === 'number' ? (
                        <Link
                            key={item}
                            href={getPageHref(item)}
                            preserveScroll
                            preserveState
                            className={cn(
                                'rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                                item === currentPage
                                    ? 'border-[#f53003] bg-[#f53003] text-white dark:border-[#ff4433] dark:bg-[#ff4433]'
                                    : 'border-black/10 bg-white text-foreground hover:border-[#f53003]/30 hover:text-[#f53003] dark:border-white/10 dark:bg-black/20 dark:hover:border-[#ff4433]/30 dark:hover:text-[#ff786c]',
                            )}
                        >
                            {item}
                        </Link>
                    ) : (
                        <span
                            key={item}
                            className="px-1 text-sm font-semibold text-muted-foreground"
                        >
                            …
                        </span>
                    ),
                )}

                <Link
                    href={getPageHref(Math.min(currentPage + 1, lastPage))}
                    preserveScroll
                    preserveState
                    className={cn(
                        'rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                        currentPage === lastPage
                            ? 'pointer-events-none border-black/5 bg-black/[0.03] text-muted-foreground dark:border-white/10 dark:bg-white/[0.03]'
                            : 'border-black/10 bg-white text-foreground hover:border-[#f53003]/30 hover:text-[#f53003] dark:border-white/10 dark:bg-black/20 dark:hover:border-[#ff4433]/30 dark:hover:text-[#ff786c]',
                    )}
                >
                    Next
                </Link>
            </div>
        </div>
    );
}
