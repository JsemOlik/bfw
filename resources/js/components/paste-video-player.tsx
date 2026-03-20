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
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<Plyr | null>(null);

    useEffect(() => {
        const videoElement = videoRef.current;

        if (!videoElement) {
            return;
        }

        playerRef.current?.destroy();

        playerRef.current = new Plyr(videoElement, {
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
            <div className="paste-video-player overflow-hidden rounded-xl">
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
