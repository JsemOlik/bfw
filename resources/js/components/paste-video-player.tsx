import { useEffect, useRef } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

interface PasteVideoPlayerProps {
    src: string;
    title: string;
    wrapperClassName?: string;
    videoClassName?: string;
}

export default function PasteVideoPlayer({
    src,
    title,
    wrapperClassName,
    videoClassName,
}: PasteVideoPlayerProps) {
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<Plyr | null>(null);

    const togglePlayback = (): void => {
        playerRef.current?.togglePlay();
    };

    const toggleMute = (): void => {
        if (!videoRef.current) {
            return;
        }

        videoRef.current.muted = !videoRef.current.muted;
    };

    const toggleFullscreen = async (): Promise<void> => {
        const fullscreenTarget = videoRef.current?.closest('.plyr');

        if (!(fullscreenTarget instanceof HTMLElement)) {
            return;
        }

        if (document.fullscreenElement) {
            await document.exitFullscreen();
            return;
        }

        await fullscreenTarget.requestFullscreen();
    };

    const shouldIgnoreInteraction = (target: EventTarget | null): boolean => {
        if (!(target instanceof HTMLElement)) {
            return false;
        }

        return target.closest(
            '.plyr__controls, .plyr__control, .plyr__menu, .plyr__progress, input, button, a',
        ) !== null;
    };

    const shouldIgnoreHotkey = (target: EventTarget | null): boolean => {
        if (!(target instanceof HTMLElement)) {
            return false;
        }

        if (target.isContentEditable) {
            return true;
        }

        return target.closest(
            'input, textarea, select, button, a, [contenteditable="true"], .plyr__controls, .plyr__menu',
        ) !== null;
    };

    useEffect(() => {
        const videoElement = videoRef.current;
        const wrapperElement = wrapperRef.current;

        if (!videoElement || !wrapperElement) {
            return;
        }

        playerRef.current?.destroy();

        playerRef.current = new Plyr(videoElement, {
            clickToPlay: true,
            controls: [
                'play-large',
                'play',
                'progress',
                'current-time',
                'mute',
                'volume',
                'settings',
                'pip',
                'airplay',
                'fullscreen',
            ],
            keyboard: {
                focused: true,
                global: true,
            },
            fullscreen: {
                enabled: true,
                iosNative: true,
            },
        });

        const handlePlayerClick = (event: MouseEvent): void => {
            if (shouldIgnoreInteraction(event.target)) {
                return;
            }

            wrapperElement.focus();
            togglePlayback();
        };

        const handleGlobalKeyDown = (event: KeyboardEvent): void => {
            const pressedKey = event.key.toLowerCase();
            const isToggleKey = event.key === ' ' || pressedKey === 'k';
            const isMuteKey = pressedKey === 'm';
            const isFullscreenKey = pressedKey === 'f';

            if (! isToggleKey && ! isMuteKey && ! isFullscreenKey) {
                return;
            }

            if (shouldIgnoreHotkey(event.target)) {
                return;
            }

            event.preventDefault();

            if (isToggleKey) {
                togglePlayback();
                return;
            }

            if (isMuteKey) {
                toggleMute();
                return;
            }

            void toggleFullscreen();
        };

        wrapperElement.addEventListener('click', handlePlayerClick, true);
        document.addEventListener('keydown', handleGlobalKeyDown);

        return () => {
            wrapperElement.removeEventListener('click', handlePlayerClick, true);
            document.removeEventListener('keydown', handleGlobalKeyDown);
            playerRef.current?.destroy();
            playerRef.current = null;
        };
    }, [src]);

    return (
        <div className={wrapperClassName}>
            <div
                ref={wrapperRef}
                className="paste-video-player overflow-hidden rounded-xl"
                tabIndex={0}
                role="button"
                aria-label={`Toggle playback for ${title}`}
            >
                <video
                    ref={videoRef}
                    key={src}
                    className={videoClassName}
                    controls
                    playsInline
                    preload="metadata"
                >
                    <source src={src} />
                    Your browser does not support the video tag.
                </video>
            </div>
            <p className="mt-3 truncate text-xs font-medium text-gray-500 dark:text-gray-400">
                {title}
            </p>
        </div>
    );
}
