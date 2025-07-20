'use client';
import { useRef, useEffect, useState } from 'react';

export default function ArVideo() {
    const cameraRef = useRef(null);
    const canvasRef = useRef(null);
    const videoRef = useRef(null);
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

    useEffect(() => {
        if (!started) return;

        const drawChromaKey = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            const video = videoRef.current;
            if (!canvas || !ctx || !video) return;

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = frame.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // ✅ Remove green background (tune these values if needed)
                if (g > 150 && r < 120 && b < 120) {
                    data[i + 3] = 0;
                }
            }

            ctx.putImageData(frame, 0, 0);
            requestAnimationFrame(drawChromaKey);
        };

        requestAnimationFrame(drawChromaKey);
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

            {/* Tap to Start */}
            {!started && (
                <div
                    onClick={() => setStarted(true)}
                    className="absolute z-20 w-full h-full bg-black bg-opacity-80 flex items-center justify-center text-white text-3xl"
                >
                    Tap to Start
                </div>
            )}

            {/* Canvas for green-screen-removed video */}
            {started && (
                <>
                    <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full z-30 pointer-events-none"
                    />
                    <video
                        ref={videoRef}
                        src="/video/213925.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ display: 'none' }}
                    />
                </>
            )}
        </div>
    );
}
