export type TransferPhase = 'uploading' | 'processing' | 'downloading';

export type TransferProgress = {
    phase: TransferPhase;
    percent: number | null;
};

type DownloadWithProgressOptions<TError> = {
    url: string;
    formData: FormData;
    csrfToken?: string | null;
    parseError: (payload: unknown) => TError;
    onProgress?: (progress: TransferProgress) => void;
};

type DownloadSuccessResult = {
    ok: true;
    blob: Blob;
    contentDisposition: string | null;
};

type DownloadErrorResult<TError> = {
    ok: false;
    errors: TError;
};

export async function downloadWithProgress<TError>({
    url,
    formData,
    csrfToken,
    parseError,
    onProgress,
}: DownloadWithProgressOptions<TError>): Promise<DownloadSuccessResult | DownloadErrorResult<TError>> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open('POST', url, true);
        xhr.responseType = 'blob';
        xhr.withCredentials = true;
        xhr.setRequestHeader('Accept', 'application/json');

        if (csrfToken) {
            xhr.setRequestHeader('X-CSRF-TOKEN', csrfToken);
        }

        onProgress?.({
            phase: 'uploading',
            percent: 0,
        });

        xhr.upload.addEventListener('progress', (event) => {
            onProgress?.({
                phase: 'uploading',
                percent: event.lengthComputable
                    ? Math.min(100, Math.round((event.loaded / event.total) * 100))
                    : null,
            });
        });

        xhr.upload.addEventListener('load', () => {
            onProgress?.({
                phase: 'processing',
                percent: null,
            });
        });

        xhr.addEventListener('progress', (event) => {
            onProgress?.({
                phase: 'downloading',
                percent: event.lengthComputable
                    ? Math.min(100, Math.round((event.loaded / event.total) * 100))
                    : null,
            });
        });

        xhr.addEventListener('load', async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                onProgress?.({
                    phase: 'downloading',
                    percent: 100,
                });

                resolve({
                    ok: true,
                    blob: xhr.response,
                    contentDisposition: xhr.getResponseHeader('Content-Disposition'),
                });

                return;
            }

            const payloadText = await xhr.response.text().catch(() => null);
            let payload: unknown = null;

            if (payloadText) {
                try {
                    payload = JSON.parse(payloadText);
                } catch {
                    payload = null;
                }
            }

            resolve({
                ok: false,
                errors: parseError(payload),
            });
        });

        xhr.addEventListener('error', () => {
            reject(new Error('Network error while processing the request.'));
        });

        xhr.addEventListener('abort', () => {
            reject(new Error('The request was aborted.'));
        });

        xhr.send(formData);
    });
}
