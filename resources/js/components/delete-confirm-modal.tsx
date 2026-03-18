import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    processing?: boolean;
    title?: string;
    description?: string;
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    processing = false,
    title = 'Are you sure?',
    description = 'This action cannot be undone. This link will be permanently deleted and will no longer redirect users.',
}: Props) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400 mt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-8 gap-3 sm:gap-2">
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="rounded-xl border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5 transition-all h-12"
                        >
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={processing}
                        className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all h-12 active:scale-[0.98] shadow-lg shadow-red-500/20"
                    >
                        {processing ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                            </span>
                        ) : (
                            'Confirm Deletion'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
