declare module 'plyr' {
    interface PlyrOptions {
        clickToPlay?: boolean;
        controls?: string[];
        iconUrl?: string;
        keyboard?: {
            focused?: boolean;
            global?: boolean;
        };
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
        public togglePlay(toggle?: boolean): void;
    }
}
