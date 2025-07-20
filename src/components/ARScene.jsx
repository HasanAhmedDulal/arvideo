import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

function ARMarkerObject() {
    const { scene } = useGLTF('/model.glb'); // make sure the model is in /public

    return <primitive object={scene} scale={0.5} />;
}

export default function ARScene() {
    return (
        <Canvas
            className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
            camera={{ position: [0, 0, 3], fov: 70 }}
        >
            <ambientLight intensity={0.8} />
            <directionalLight position={[1, 1, 1]} />
            <ARMarkerObject />
            <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
    );
}
