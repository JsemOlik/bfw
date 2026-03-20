declare module 'plyr' {
    interface PlyrOptions {
        controls?: string[];
        iconUrl?: string;
        fullscreen?: {
            enabled?: boolean;
            iosNative?: boolean;
        };
    }

    export default class Plyr {
        public constructor(
            target: HTMLVideoElement | string,
            options?: PlyrOptions,
        );

        public destroy(): void;
    }
}
