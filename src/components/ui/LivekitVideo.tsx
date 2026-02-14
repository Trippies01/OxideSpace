import { useRef, useEffect } from 'react';
import { Track } from 'livekit-client';

interface LivekitVideoProps {
    track?: Track;
    muted?: boolean;
    className?: string;
}

export const LivekitVideo = ({ track, muted = false, className = 'w-full h-full object-cover' }: LivekitVideoProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const el = videoRef.current;
        if (!el || !track) return;
        track.attach(el);
        return () => {
            track.detach(el);
        };
    }, [track]);

    return <video ref={videoRef} className={className} muted={muted} playsInline />;
};
