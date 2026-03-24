import { cn } from '@/lib/utils';
import { getFileTypePresentation } from '@/lib/file-type';

interface FileTypeIconProps {
    filename?: string | null;
    mimeType?: string | null;
    className?: string;
    badgeClassName?: string;
}

export default function FileTypeIcon({
    filename,
    mimeType,
    className,
    badgeClassName,
}: FileTypeIconProps) {
    const presentation = getFileTypePresentation(filename, mimeType);

    const toneClasses = {
        pdf: 'bg-red-500 text-white dark:bg-red-500 dark:text-white',
        archive: 'bg-amber-500 text-white dark:bg-amber-500 dark:text-white',
        text: 'bg-slate-600 text-white dark:bg-slate-500 dark:text-white',
        image: 'bg-emerald-500 text-white dark:bg-emerald-500 dark:text-white',
        video: 'bg-violet-500 text-white dark:bg-violet-500 dark:text-white',
        spreadsheet: 'bg-green-600 text-white dark:bg-green-500 dark:text-white',
        document: 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white',
        audio: 'bg-fuchsia-500 text-white dark:bg-fuchsia-500 dark:text-white',
        code: 'bg-sky-600 text-white dark:bg-sky-500 dark:text-white',
        generic: 'bg-gray-700 text-white dark:bg-gray-500 dark:text-white',
    }[presentation.kind];

    return (
        <div
            className={cn(
                'relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 dark:bg-[#161615] dark:ring-white/10',
                className,
            )}
        >
            <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400 dark:text-gray-500"
            >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span
                className={cn(
                    'absolute -bottom-1 rounded-lg px-1.5 py-0.5 text-[10px] font-black tracking-wide shadow-sm',
                    toneClasses,
                    badgeClassName,
                )}
            >
                {presentation.label}
            </span>
        </div>
    );
}
