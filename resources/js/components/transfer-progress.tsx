import type { TransferProgress } from '@/lib/download-with-progress';

type Props = {
    progress: TransferProgress;
    uploadLabel: string;
    processingLabel: string;
    downloadLabel: string;
};

export default function TransferProgressBar({
    progress,
    uploadLabel,
    processingLabel,
    downloadLabel,
}: Props) {
    const label = progress.phase === 'uploading'
        ? uploadLabel
        : progress.phase === 'processing'
            ? processingLabel
            : downloadLabel;

    const detail = progress.percent !== null ? `${progress.percent}%` : 'Working...';

    return (
        <div className="rounded-xl border border-orange-100 bg-orange-50/80 p-4 dark:border-[#5a2a20] dark:bg-[#22100c]">
            <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#9a2d0d] dark:text-[#ff9b8f]">
                    {label}
                </p>
                <span className="text-xs font-semibold text-[#c4471b] dark:text-[#ffb0a6]">
                    {detail}
                </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-orange-100 dark:bg-[#3b1e18]">
                <div
                    className={`h-full rounded-full bg-[#f53003] transition-[width] duration-300 ease-out dark:bg-[#FF4433] ${
                        progress.percent === null ? 'w-full animate-pulse opacity-80' : ''
                    }`}
                    style={progress.percent !== null ? { width: `${progress.percent}%` } : undefined}
                />
            </div>
        </div>
    );
}
