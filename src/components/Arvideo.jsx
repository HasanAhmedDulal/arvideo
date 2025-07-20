'use client';
import { useEffect, useRef, useState } from 'react';

export default function Hologram() {
    const camRef = useRef(null);
    const canvasRef = useRef(null);
    const greenVideoRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { exact: 'environment' } },
                    audio: false,
                });
                if (camRef.current) camRef.current.srcObject = stream;
                setIsReady(true);
            } catch (err) {
                console.error('Camera error:', err);
            }
        };

        startCamera();
    }, []);

    useEffect(() => {
        if (!isReady) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const greenVideo = greenVideoRef.current;

        const draw = () => {
            if (!canvas || !ctx || !greenVideo) return;

            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(greenVideo, 0, 0, canvas.width, canvas.height);

            const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = frame.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                // Chroma key: remove green
                if (g > 150 && r < 120 && b < 120) {
                    data[i + 3] = 0;
                }
            }

            ctx.putImageData(frame, 0, 0);
            requestAnimationFrame(draw);
        };

        draw();
    }, [isReady]);

    return (
        <div style={styles.container}>
            {/* Camera background */}
            <video
                ref={camRef}
                autoPlay
                muted
                playsInline
                style={styles.camera}
            />

            {/* Canvas that draws the green screen video with transparency */}
            <canvas ref={canvasRef} style={styles.canvas} />

            {/* Green screen video (hidden, drawn on canvas) */}
            <video
                ref={greenVideoRef}
                src="/213925.mp4" // make sure this is placed in /public
                autoPlay
                loop
                muted
                playsInline
                style={{ display: 'none' }}
            />
        </div>
    );
}

const styles = {
    container: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    camera: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 1,
    },
    canvas: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 2,
        pointerEvents: 'none',
    },
};
