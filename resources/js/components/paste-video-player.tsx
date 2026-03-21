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

    const shouldIgnoreInteraction = (target: EventTarget | null): boolean => {
        if (!(target instanceof HTMLElement)) {
            return false;
        }

        return target.closest(
            '.plyr__controls, .plyr__control, .plyr__menu, .plyr__progress, input, button, a',
        ) !== null;
    };

    useEffect(() => {
        const videoElement = videoRef.current;

        if (!videoElement) {
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

        return () => {
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
                onPointerDown={() => wrapperRef.current?.focus()}
                onClickCapture={(event) => {
                    if (shouldIgnoreInteraction(event.target)) {
                        return;
                    }

                    togglePlayback();
                }}
                onKeyDown={(event) => {
                    if (event.key !== ' ' && event.key.toLowerCase() !== 'k') {
                        return;
                    }

                    if (shouldIgnoreInteraction(event.target)) {
                        return;
                    }

                    event.preventDefault();
                    togglePlayback();
                }}
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
