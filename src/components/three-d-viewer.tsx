import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n-context';
import { Slider } from '@/components/ui/slider';
import {
    RotateCcw,
    Grid3X3,
    Play,
    Pause,
    Palette,
    Camera,
    Activity,
    Box,
    CircleDot,
    FileDown
} from 'lucide-react';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

type ColorMapType = 'grayscale' | 'hot' | 'cool' | 'jet' | 'rainbow' | 'viridis' | 'plasma';
type RenderMode = 'surface' | 'wireframe' | 'points';

interface ThreeDViewerProps {
    imageData: ImageData | null;
    className?: string;
}

interface SurfaceProps {
    imageData: ImageData;
    renderMode: RenderMode;
    heightScale: number;
    colorMap: ColorMapType;
    isPulsing: boolean;
}

function getColor(value: number, map: ColorMapType): [number, number, number] {
    // value is 0-1
    if (map === 'grayscale') {
        return [value, value, value];
    }

    if (map === 'hot') {
        // Black (0,0,0) -> Red (1,0,0) -> Yellow (1,1,0) -> White (1,1,1)
        if (value < 0.33) return [value * 3, 0, 0];
        if (value < 0.66) return [1, (value - 0.33) * 3, 0];
        return [1, 1, (value - 0.66) * 3];
    }

    if (map === 'cool') {
        // Cyan (0,1,1) -> Blue (0,0,1) -> Magenta (1,0,1)
        return [value, 1 - value, 1];
    }

    if (map === 'jet') {
        // Blue -> Cyan -> Green -> Yellow -> Red
        const fourValue = value * 4;
        const r = Math.min(fourValue - 1.5, -fourValue + 4.5);
        const g = Math.min(fourValue - 0.5, -fourValue + 3.5);
        const b = Math.min(fourValue + 0.5, -fourValue + 2.5);
        return [
            Math.max(0, Math.min(1, r)),
            Math.max(0, Math.min(1, g)),
            Math.max(0, Math.min(1, b))
        ];
    }

    if (map === 'rainbow') {
        // HSL to RGB conversion roughly
        const h = (1.0 - value) * 240 / 360;
        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const q = 1 - f;
        switch (i % 6) {
            case 0: return [1, f, 0];
            case 1: return [q, 1, 0];
            case 2: return [0, 1, f];
            case 3: return [0, q, 1];
            case 4: return [f, 0, 1];
            default: return [1, 0, q];
        }
    }

    if (map === 'viridis') {
        // Approximate Viridis: Purple -> Blue -> Green -> Yellow
        const c1 = [0.267, 0.004, 0.329]; // dark purple
        const c2 = [0.190, 0.407, 0.556]; // blue
        const c3 = [0.208, 0.718, 0.472]; // green
        const c4 = [0.993, 0.906, 0.143]; // yellow

        if (value < 0.33) {
            const t = value * 3;
            return [c1[0] + t * (c2[0] - c1[0]), c1[1] + t * (c2[1] - c1[1]), c1[2] + t * (c2[2] - c1[2])];
        } else if (value < 0.66) {
            const t = (value - 0.33) * 3;
            return [c2[0] + t * (c3[0] - c2[0]), c2[1] + t * (c3[1] - c2[1]), c2[2] + t * (c3[2] - c2[2])];
        } else {
            const t = (value - 0.66) * 3;
            return [c3[0] + t * (c4[0] - c3[0]), c3[1] + t * (c4[1] - c3[1]), c3[2] + t * (c4[2] - c3[2])];
        }
    }

    if (map === 'plasma') {
        // Approximate Plasma: Blue -> Magenta -> Orange -> Yellow
        const c1 = [0.050, 0.029, 0.529]; // blue
        const c2 = [0.612, 0.025, 0.620]; // magenta
        const c3 = [0.949, 0.518, 0.298]; // orange
        const c4 = [0.940, 0.975, 0.131]; // yellow

        if (value < 0.33) {
            const t = value * 3;
            return [c1[0] + t * (c2[0] - c1[0]), c1[1] + t * (c2[1] - c1[1]), c1[2] + t * (c2[2] - c1[2])];
        } else if (value < 0.66) {
            const t = (value - 0.33) * 3;
            return [c2[0] + t * (c3[0] - c2[0]), c2[1] + t * (c3[1] - c2[1]), c2[2] + t * (c3[2] - c2[2])];
        } else {
            const t = (value - 0.66) * 3;
            return [c3[0] + t * (c4[0] - c3[0]), c3[1] + t * (c4[1] - c3[1]), c3[2] + t * (c4[2] - c3[2])];
        }
    }

    return [value, value, value];
}

function Surface({ imageData, renderMode, heightScale, colorMap, isPulsing }: SurfaceProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const pointsRef = useRef<THREE.Points>(null);

    // Animation state for pulse effect
    useFrame((state) => {
        if (!isPulsing) return;

        const time = state.clock.getElapsedTime();
        const pulseFactor = 1 + Math.sin(time * 3) * 0.2; // Pulse between 0.8 and 1.2 scale

        if (meshRef.current) {
            meshRef.current.scale.z = pulseFactor;
        }
        if (pointsRef.current) {
            pointsRef.current.scale.z = pulseFactor;
        }
    });

    const { geometry } = useMemo(() => {
        const { width, height, data } = imageData;

        // Downsample for performance
        const maxSize = 200;
        const step = Math.max(1, Math.ceil(Math.max(width, height) / maxSize));

        const sampledWidth = Math.floor(width / step);
        const sampledHeight = Math.floor(height / step);

        const geo = new THREE.PlaneGeometry(
            2, // width
            2 * (sampledHeight / sampledWidth), // height maintains aspect ratio
            sampledWidth - 1,
            sampledHeight - 1
        );

        const positions = geo.attributes.position.array as Float32Array;
        const colors = new Float32Array(positions.length);

        for (let j = 0; j < sampledHeight; j++) {
            for (let i = 0; i < sampledWidth; i++) {
                const vertexIndex = j * sampledWidth + i;
                const posIndex = vertexIndex * 3;

                // Get grayscale value from original image
                const imgX = i * step;
                const imgY = j * step;
                const pixelIndex = (imgY * width + imgX) * 4;
                const gray = data[pixelIndex] / 255;

                // Set Z position based on grayscale
                positions[posIndex + 2] = gray * heightScale;

                // Set color based on map
                const [r, g, b] = getColor(gray, colorMap);
                colors[posIndex] = r;
                colors[posIndex + 1] = g;
                colors[posIndex + 2] = b;
            }
        }

        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.computeVertexNormals();

        return { geometry: geo };
    }, [imageData, heightScale, colorMap]);

    if (renderMode === 'points') {
        return (
            <points ref={pointsRef} geometry={geometry}>
                <pointsMaterial
                    vertexColors
                    size={0.03}
                    sizeAttenuation={true}
                />
            </points>
        );
    }

    return (
        <mesh ref={meshRef} geometry={geometry}>
            <meshStandardMaterial
                vertexColors
                side={THREE.DoubleSide}
                flatShading={false}
                wireframe={renderMode === 'wireframe'}
                roughness={0.4}
                metalness={0.1}
            />
        </mesh>
    );
}

function SceneContent({ imageData, renderMode, heightScale, colorMap, isPulsing }: SurfaceProps) {
    const { gl, scene, camera } = useThree();

    // Custom screenshot function attached to window/event for access from UI
    useEffect(() => {
        const handleScreenshot = () => {
            gl.render(scene, camera);
            const dataUrl = gl.domElement.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = '3d-view-capture.png';
            link.href = dataUrl;
            link.click();
        };

        // Listen for custom event
        window.addEventListener('trigger-3d-screenshot', handleScreenshot);
        return () => window.removeEventListener('trigger-3d-screenshot', handleScreenshot);
    }, [gl, scene, camera]);

    // Handle OBJ Export
    useEffect(() => {
        const handleExport = () => {
            const exporter = new OBJExporter();
            // We only want to export the mesh (Surface), not the lights or background
            // Find the mesh in the scene or just export the whole scene filtered?
            // Actually, we can reference the mesh if we had the ref here, but we don't.
            // Let's traverse the scene and find the mesh.

            // Simpler: Just export the whole scene, OBJExporter usually ignores lights/cameras.
            const result = exporter.parse(scene);
            const blob = new Blob([result], { type: 'text/plain' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'model.obj';
            link.click();
        };

        window.addEventListener('trigger-obj-export', handleExport);
        return () => window.removeEventListener('trigger-obj-export', handleExport);
    }, [scene]);

    return (
        <>
            <OrbitControls
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                autoRotate={false}
                autoRotateSpeed={2.0}
                minDistance={1}
                maxDistance={10}
            />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <directionalLight position={[0, 0, 5]} intensity={0.5} />

            {/* Background stars for effect */}
            {renderMode === 'points' && (
                <points>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            args={[new Float32Array(Array.from({ length: 1500 }, () => (Math.random() - 0.5) * 10)), 3]}
                        />
                    </bufferGeometry>
                    <pointsMaterial size={0.02} color="#ffffff" transparent opacity={0.4} />
                </points>
            )}


            <Surface
                imageData={imageData}
                renderMode={renderMode}
                heightScale={heightScale}
                colorMap={colorMap}
                isPulsing={isPulsing}
            />
            <AutoFitCamera imageData={imageData} />
            {/* Fog for depth perception */}
            <fog attach="fog" args={['#171717', 2, 12]} />
        </>
    );
}

function AutoFitCamera({ imageData }: { imageData: ImageData }) {
    const { camera, size } = useThree();
    const controls = useRef<any>(null); // We don't have access to the main controls ref here easily without context, but we can manipulate camera directly.

    useEffect(() => {
        if (!imageData) return;

        const { width, height } = imageData;
        const aspect = width / height; // Image aspect

        // Geometry is always Width = 2.
        // Geometry Height = 2 / aspect.

        const geoWidth = 2;
        const geoHeight = 2 / aspect;

        // Calculate distance to fit height
        const vFOV = (camera as THREE.PerspectiveCamera).fov * Math.PI / 180;
        const distVertical = (geoHeight / 2) / Math.tan(vFOV / 2);

        // Calculate distance to fit width (taking canvas aspect into account)
        const canvasAspect = size.width / size.height;
        // visibleWidth = 2 * dist * tan(vfov/2) * canvasAspect
        // distHorizontal = (geoWidth / 2) / (tan(vfov/2) * canvasAspect)
        const distHorizontal = (geoWidth / 2) / (Math.tan(vFOV / 2) * canvasAspect);

        // Choose the larger distance to fit both constraints (contain), or smaller to fill (cover).
        // Let's go with "fit mostly" - maybe 90% fill.
        const fitDist = Math.max(distVertical, distHorizontal);

        // Add a small margin (e.g. 1.1x)
        const targetZ = fitDist * 1.05;

        // Smoothly move camera? Or just set it. Just set it for now.
        camera.position.set(0, 0, targetZ);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        // Dispatch reset event for controls to re-read camera
        // window.dispatchEvent(new Event('trigger-camera-reset')); // OrbitControls might overwrite this if not careful.

    }, [imageData, camera, size]);

    return null;
}

export function ThreeDViewer({ imageData, className }: ThreeDViewerProps) {
    const { t } = useI18n();
    const [renderMode, setRenderMode] = useState<RenderMode>('surface');
    const [autoRotate, setAutoRotate] = useState(false);
    const [heightScale, setHeightScale] = useState(0.5);
    const [colorMap, setColorMap] = useState<ColorMapType>('grayscale');
    const [isPulsing, setIsPulsing] = useState(false);

    // Refs for OrbitControls are handled inside SceneContent implicitly via drei

    if (!imageData) {
        return (
            <div className={`flex items-center justify-center bg-neutral-900 rounded-lg ${className}`}>
                <p className="text-muted-foreground">No image data to display</p>
            </div>
        );
    }

    const toggleRenderMode = () => {
        if (renderMode === 'surface') setRenderMode('wireframe');
        else if (renderMode === 'wireframe') setRenderMode('points');
        else setRenderMode('surface');
    };

    const togglePulse = () => {
        setIsPulsing(!isPulsing);
    };

    const takeScreenshot = () => {
        window.dispatchEvent(new Event('trigger-3d-screenshot'));
    };

    const handleExportOBJ = () => {
        window.dispatchEvent(new Event('trigger-obj-export'));
    };

    return (
        <div className={`relative bg-neutral-900 rounded-lg overflow-hidden group h-full ${className}`}>
            <Canvas
                gl={{ preserveDrawingBuffer: true }} // Required for screenshot
                camera={{ position: [0, 0, 2.2], fov: 50 }}
            >
                <SceneContent
                    imageData={imageData}
                    renderMode={renderMode}
                    heightScale={heightScale}
                    colorMap={colorMap}
                    isPulsing={isPulsing}
                />

                {/* Auto-rotate effect needs to be applied to OrbitControls which is now inside SceneContent 
                    For simplicity, we can just use the prop on OrbitControls directly if we lift it, 
                    OR we can make a wrapper. Let's handle auto-rotate simply via a ref if needed, 
                    but standard OrbitControls autoRotate prop works fine if state is passed down.
                    Wait, SceneContent uses locally instantiated OrbitControls. 
                    Let's pass autoRotate down to SceneContent.
                */}
                <ControlsWrapper autoRotate={autoRotate} />
            </Canvas>

            {/* Controls Overlay */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 p-2 bg-black/50 backdrop-blur-sm rounded-lg border border-white/10 transition-opacity">
                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 text-white hover:bg-white/20 active:bg-white/30 ${autoRotate ? 'bg-white/20' : ''}`}
                    onClick={() => setAutoRotate(!autoRotate)}
                    title={t ? t('3d.rotate') : "Auto Rotate"}
                >
                    {autoRotate ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20 active:bg-white/30"
                    onClick={toggleRenderMode}
                    title={t ? `${t('3d.mode')}: ${renderMode}` : `Mode: ${renderMode}`}
                >
                    {renderMode === 'points' ? <CircleDot className="h-4 w-4" /> :
                        renderMode === 'wireframe' ? <Grid3X3 className="h-4 w-4" /> :
                            <Box className="h-4 w-4" />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20 active:bg-white/30"
                    onClick={() => {
                        const maps: ColorMapType[] = ['grayscale', 'hot', 'cool', 'jet'];
                        const currentIndex = maps.indexOf(colorMap);
                        const nextIndex = (currentIndex + 1) % maps.length;
                        setColorMap(maps[nextIndex]);
                    }}
                    title={t ? `${t('3d.colormap')}: ${colorMap}` : `Color Map: ${colorMap}`}
                >
                    <Palette className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 text-white hover:bg-white/20 active:bg-white/30 ${isPulsing ? 'bg-white/20' : ''}`}
                    onClick={togglePulse}
                    title={t ? t('3d.pulse') : "Animate Pulse"}
                >
                    <Activity className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20 active:bg-white/30"
                    onClick={takeScreenshot}
                    title={t ? t('3d.screenshot') : "Take Screenshot"}
                >
                    <Camera className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20 active:bg-white/30"
                    onClick={handleExportOBJ}
                    title={t ? "Export OBJ" : "Export 3D Model"}
                >
                    <FileDown className="h-4 w-4" />
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20 active:bg-white/30"
                    onClick={() => {
                        // Reset handled via key prop on Canvas usually, or we can just reset state
                        setHeightScale(0.5);
                        setAutoRotate(false);
                        setRenderMode('surface');
                        setIsPulsing(false);
                        // A true camera reset requires access to OrbitControls ref
                        window.dispatchEvent(new Event('trigger-camera-reset'));
                    }}
                    title={t ? t('3d.reset') : "Reset View"}
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </div>

            <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-black/50 px-2 py-1 rounded pointer-events-none">
                LMB: Rotate • Wheel: Zoom • RMB: Pan
            </div>

            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 w-32 pointer-events-auto bg-black/50 p-2 rounded-lg backdrop-blur-sm">
                <div className="text-[10px] text-muted-foreground flex justify-between w-full">
                    <span>{t ? t('3d.height') : "Height Scale"}</span>
                    <span>{heightScale.toFixed(1)}</span>
                </div>
                <Slider
                    defaultValue={[0.5]}
                    value={[heightScale]}
                    min={0.1}
                    max={3.0}
                    step={0.1}
                    onValueChange={(val) => setHeightScale(val[0])}
                    className="w-full"
                />
            </div>
        </div>
    );
}

// Helper component to handle controls logic
function ControlsWrapper({ autoRotate }: { autoRotate: boolean }) {
    const controlsRef = useRef<any>(null);

    useEffect(() => {
        const handleReset = () => {
            controlsRef.current?.reset();
        };
        const handleResetTarget = () => {
            if (controlsRef.current) {
                controlsRef.current.target.set(0, 0, 0);
                controlsRef.current.update();
            }
        };
        window.addEventListener('trigger-camera-reset', handleReset);
        window.addEventListener('reset-controls-target', handleResetTarget);
        return () => {
            window.removeEventListener('trigger-camera-reset', handleReset);
            window.removeEventListener('reset-controls-target', handleResetTarget);
        };
    }, []);

    return (
        <OrbitControls
            ref={controlsRef}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={2.0}
            minDistance={0.5}
            maxDistance={8}
        />
    );
}
