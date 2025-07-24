'use client'
import { ARCanvas, DefaultXRControllers, Interactive } from '@react-three/xr'
import { useRef, useEffect } from 'react'
import { Plane, useVideoTexture } from '@react-three/drei'

export default function ARScene() {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(console.error);
        }
    }, []);

    return (
        <>
            {/*Hidden video source*/}
            <video
                ref={videoRef}
                src="video/arvideo.mp4"
                muted
                playsInline
                loop
                style={{ display: 'none' }}
                crossOrigin="anonymous"
            />

            {/* AR Canvas */}
            <ARCanvas >
                <ambientLight />

                <DefaultXRControllers />

                <Interactive>
                    <VideoPlane videoRef={videoRef} />
                </Interactive>
            </ARCanvas>
        </>
    )
}

function VideoPlane({ videoRef }) {
    const texture = useVideoTexture(videoRef.current)

    return (
        <Plane args={[1, 0.5625]} position={[0, 0, -2]}>
            <meshBasicMaterial map={texture} transparent />
        </Plane>
    )
}
