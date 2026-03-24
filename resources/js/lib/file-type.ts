export type PasteTabRecommendation = {
    targetType: 'text' | 'image' | 'video';
    title: string;
    description: string;
    benefits: string[];
};

type FileLike = {
    name: string;
    type?: string | null;
    size?: number;
};

const TEXT_PASTE_MAX_BYTES = 16_777_215;

const supportedImageTypes = new Set([
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon',
]);

const supportedImageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico']);

const supportedVideoTypes = new Set([
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-matroska',
]);

const supportedVideoExtensions = new Set(['mp4', 'webm', 'ogg', 'ogv', 'mov', 'mkv']);

export type FileTypePresentation = {
    kind:
        | 'pdf'
        | 'archive'
        | 'text'
        | 'image'
        | 'video'
        | 'spreadsheet'
        | 'document'
        | 'audio'
        | 'code'
        | 'generic';
    label: string;
};

export function getFileExtension(filename?: string | null): string {
    return filename?.split('.').pop()?.toLowerCase() ?? '';
}

export function isSupportedImageFileLike(file: FileLike): boolean {
    if (supportedImageTypes.has(file.type ?? '')) {
        return true;
    }

    const extension = getFileExtension(file.name);

    return extension !== '' && supportedImageExtensions.has(extension);
}

export function isSupportedVideoFileLike(file: FileLike): boolean {
    if (supportedVideoTypes.has(file.type ?? '')) {
        return true;
    }

    const extension = getFileExtension(file.name);

    return extension !== '' && supportedVideoExtensions.has(extension);
}

export function getPasteTabRecommendation(file: FileLike): PasteTabRecommendation | null {
    if (isSupportedImageFileLike(file)) {
        return {
            targetType: 'image',
            title: 'This file fits better in the Image tab',
            description: 'Image pastes are more optimized for previews, sharing, and viewing directly in the browser.',
            benefits: [
                'Instant image preview on the paste page',
                'Cleaner image-focused viewing experience',
                'Better optimized for supported image formats',
            ],
        };
    }

    if (isSupportedVideoFileLike(file)) {
        return {
            targetType: 'video',
            title: 'This file fits better in the Video tab',
            description: 'Video pastes are more optimized for playback, previews, and a smoother watch experience.',
            benefits: [
                'Built-in video preview before upload',
                'Optimized playback on the paste page',
                'Better handling for supported video formats',
            ],
        };
    }

    const extension = getFileExtension(file.name);
    const isPlainText = extension === 'txt' || file.type === 'text/plain';

    if (isPlainText && (file.size ?? 0) <= TEXT_PASTE_MAX_BYTES) {
        return {
            targetType: 'text',
            title: 'This file fits better in the Text tab',
            description: 'Text pastes are more optimized for readable content, copying, and syntax-aware display.',
            benefits: [
                'Readable text layout instead of a raw file download',
                'Copy-friendly raw view and text sharing',
                'Optional syntax highlighting and better text rendering',
            ],
        };
    }

    return null;
}

export function getFileTypePresentation(filename?: string | null, mimeType?: string | null): FileTypePresentation {
    const extension = getFileExtension(filename);
    const normalizedMime = (mimeType ?? '').toLowerCase();

    if (extension === 'pdf' || normalizedMime === 'application/pdf') {
        return { kind: 'pdf', label: 'PDF' };
    }

    if (['zip', 'rar', '7z', 'gz', 'tgz', 'tar', 'bz2', 'xz'].includes(extension)
        || normalizedMime.includes('zip')
        || normalizedMime.includes('compressed')
        || normalizedMime.includes('archive')) {
        return { kind: 'archive', label: 'ZIP' };
    }

    if (isSupportedImageFileLike({ name: filename ?? '', type: mimeType })) {
        return { kind: 'image', label: 'IMG' };
    }

    if (isSupportedVideoFileLike({ name: filename ?? '', type: mimeType })) {
        return { kind: 'video', label: 'VID' };
    }

    if (
        extension === 'txt'
        || normalizedMime === 'text/plain'
        || ['md', 'rtf'].includes(extension)
    ) {
        return { kind: 'text', label: extension === 'md' ? 'MD' : 'TXT' };
    }

    if (['json', 'xml', 'yaml', 'yml', 'toml', 'ini', 'log', 'csv'].includes(extension)) {
        return {
            kind: extension === 'csv' ? 'spreadsheet' : 'code',
            label: extension.toUpperCase().slice(0, 4),
        };
    }

    if (['js', 'ts', 'tsx', 'jsx', 'php', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'cs', 'sh'].includes(extension)) {
        return { kind: 'code', label: extension.toUpperCase().slice(0, 4) };
    }

    if (['xls', 'xlsx', 'ods'].includes(extension)
        || normalizedMime.includes('spreadsheet')
        || normalizedMime.includes('excel')
        || normalizedMime.includes('csv')) {
        return { kind: 'spreadsheet', label: 'XLS' };
    }

    if (['doc', 'docx', 'pages', 'odt', 'ppt', 'pptx', 'key'].includes(extension)
        || normalizedMime.includes('word')
        || normalizedMime.includes('presentation')) {
        return {
            kind: 'document',
            label: ['ppt', 'pptx', 'key'].includes(extension) ? 'PPT' : 'DOC',
        };
    }

    if (['mp3', 'wav', 'flac', 'm4a', 'ogg'].includes(extension) || normalizedMime.startsWith('audio/')) {
        return { kind: 'audio', label: 'AUD' };
    }

    if (extension !== '') {
        return { kind: 'generic', label: extension.toUpperCase().slice(0, 4) };
    }

    return { kind: 'generic', label: 'FILE' };
}
