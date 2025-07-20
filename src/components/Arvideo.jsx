'use client'
import { useRef, useEffect, useState } from 'react';

export default function ArVideo() {
    const cameraRef = useRef(null);
    const [started, setStarted] = useState(false);

    useEffect(() => {
        if (!started) return;

        navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false,
        })
            .then((stream) => {
                if (cameraRef.current) {
                    cameraRef.current.srcObject = stream;
                }
            })
            .catch((err) => {
                console.error("Camera access error:", err);
            });
    }, [started]);

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-black">
            {/* Live Camera Feed */}
            <video
                ref={cameraRef}
                autoPlay
                muted
                playsInline
                className="absolute top-0 left-0 w-full h-full object-cover z-0"
            />

            {/* Tap to Start Overlay */}
            {!started && (
                <div
                    onClick={() => setStarted(true)}
                    className="absolute z-20 w-full h-full bg-black bg-opacity-80 flex items-center justify-center text-white text-3xl"
                >
                    Tap to Start
                </div>
            )}

            {/* Transparent WebM Overlay Video */}
            {started && (
                <video
                    autoPlay
                    muted
                    playsInline
                    controls
                    className="absolute z-30 top-1/4 left-1/4 w-1/2 pointer-events-auto"
                >
                    <source src="/video/213925.mp4" type="video/webm" />
                    Your browser does not support video.
                </video>
            )}
        </div>
    );
}
