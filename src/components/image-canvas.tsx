'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { Region } from '@/lib/image-processing';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';

interface ImageCanvasProps {
    imageSrc?: string;
    regions: Region[];
    onRegionsChange: (regions: Region[]) => void;
    selectedRegionId?: string;
    onRegionSelect?: (regionId: string | undefined) => void;
    /** Called when a user interaction (drag/resize) completes */
    onInteractionEnd?: (region: Region) => void;
    className?: string;
    readonly?: boolean;
}

interface Point {
    x: number;
    y: number;
}

type InteractionMode = 'none' | 'drawing' | 'moving' | 'resizing';
type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br';

const REGION_COLORS = [
    '#22c55e', // green
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
];

const MIN_RECT_SIZE = 20;
const HANDLE_SIZE = 8;
const HANDLE_TOUCH_PADDING = 10; // Extra hit area for touch

export function ImageCanvas({
    imageSrc,
    regions,
    onRegionsChange,
    selectedRegionId,
    onRegionSelect,
    onInteractionEnd,
    className,
    readonly = false,
}: ImageCanvasProps) {
    const { t } = useI18n();
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    // Interaction state
    const [interactionMode, setInteractionMode] = useState<InteractionMode>('none');
    const [startPoint, setStartPoint] = useState<Point | null>(null); // Image coords
    const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
    const [originalRegionValues, setOriginalRegionValues] = useState<Region | null>(null);

    // View state
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [cursor, setCursor] = useState<string>('default');

    // Load image
    useEffect(() => {
        if (!imageSrc) return;
        const img = new Image();
        img.onload = () => {
            setImage(img);
            setScale(1);
            setOffset({ x: 0, y: 0 });
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // Helpers
    const getDisplayMetrics = useCallback(() => {
        if (!canvasRef.current || !image) return null;
        const canvas = canvasRef.current;

        const fitScale = Math.min(
            canvas.width / image.width,
            canvas.height / image.height
        ) * 0.95;
        const displayScale = fitScale * scale;

        const imgWidth = image.width * displayScale;
        const imgHeight = image.height * displayScale;
        const imgX = (canvas.width - imgWidth) / 2 + offset.x;
        const imgY = (canvas.height - imgHeight) / 2 + offset.y;

        return { displayScale, imgX, imgY };
    }, [image, scale, offset]);

    const canvasToImage = useCallback(
        (cx: number, cy: number): Point | null => {
            const metrics = getDisplayMetrics();
            if (!metrics || !image) return null;
            const { displayScale, imgX, imgY } = metrics;

            const x = (cx - imgX) / displayScale;
            const y = (cy - imgY) / displayScale;

            return { x: Math.floor(x), y: Math.floor(y) }; // Keep minimal precision or float? Float better for calc.
        },
        [getDisplayMetrics, image]
    );

    const getResizeHandleRects = useCallback((region: Region, displayScale: number, imgX: number, imgY: number) => {
        const x = imgX + region.x * displayScale;
        const y = imgY + region.y * displayScale;
        const w = region.width * displayScale;
        const h = region.height * displayScale;
        const hw = HANDLE_SIZE / 2;

        return {
            tl: { x: x - hw, y: y - hw, w: HANDLE_SIZE, h: HANDLE_SIZE },
            tr: { x: x + w - hw, y: y - hw, w: HANDLE_SIZE, h: HANDLE_SIZE },
            bl: { x: x - hw, y: y + h - hw, w: HANDLE_SIZE, h: HANDLE_SIZE },
            br: { x: x + w - hw, y: y + h - hw, w: HANDLE_SIZE, h: HANDLE_SIZE },
        };
    }, []);

    // Drawing
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas to pixel ratio for sharpness?? 
        // For simplicity keeping 1:1 with CSS size but setting width/height
        const rect = container.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
            canvas.width = rect.width;
            canvas.height = rect.height;
        }

        // Clear
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (!imageSrc || !image || image.src !== imageSrc) {
            ctx.fillStyle = '#444';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No image loaded', canvas.width / 2, canvas.height / 2);
            return;
        }

        const metrics = getDisplayMetrics();
        if (!metrics) return;
        const { displayScale, imgX, imgY } = metrics;

        // Draw Image
        ctx.drawImage(image, imgX, imgY, image.width * displayScale, image.height * displayScale);

        // Draw Regions
        regions.forEach((region, idx) => {
            const isSelected = region.id === selectedRegionId;
            const color = region.color || REGION_COLORS[idx % REGION_COLORS.length];

            const rx = imgX + region.x * displayScale;
            const ry = imgY + region.y * displayScale;
            const rw = region.width * displayScale;
            const rh = region.height * displayScale;

            // Fill
            ctx.fillStyle = isSelected ? color + '40' : color + '10'; // Hex Alpha
            ctx.fillRect(rx, ry, rw, rh);

            // Stroke
            ctx.strokeStyle = color;
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.setLineDash(isSelected ? [] : [4, 4]);
            ctx.strokeRect(rx, ry, rw, rh);

            // Label
            ctx.fillStyle = color;
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(`R${idx + 1}`, rx, ry - 4);

            // Handles (only if selected and not drawing new)
            if (isSelected && !readonly) {
                const handles = getResizeHandleRects(region, displayScale, imgX, imgY);
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.setLineDash([]);

                Object.values(handles).forEach(h => {
                    ctx.fillStyle = '#ef4444'; // Red handles
                    ctx.fillRect(h.x, h.y, h.w, h.h);
                    ctx.strokeRect(h.x, h.y, h.w, h.h);
                });
            }
        });

        // Draw 'New Region' being drawn
        if (interactionMode === 'drawing' && startPoint && originalRegionValues) {
            // originalRegionValues here acts as 'current draft'
            const r = originalRegionValues;
            const rx = imgX + r.x * displayScale;
            const ry = imgY + r.y * displayScale;
            const rw = r.width * displayScale;
            const rh = r.height * displayScale;

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 2]);
            ctx.strokeRect(rx, ry, rw, rh);
        }

    }, [image, imageSrc, regions, selectedRegionId, interactionMode, startPoint, originalRegionValues, readonly, getDisplayMetrics, getResizeHandleRects]);

    useEffect(() => {
        requestAnimationFrame(draw);
    }, [draw]);

    // Input Handlers
    const getPointInCanvas = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const isNearHandle = (cx: number, cy: number, handleRect: { x: number, y: number, w: number, h: number }) => {
        const padding = 'ontouchstart' in window ? HANDLE_TOUCH_PADDING : 2;
        return (
            cx >= handleRect.x - padding &&
            cx <= handleRect.x + handleRect.w + padding &&
            cy >= handleRect.y - padding &&
            cy <= handleRect.y + handleRect.h + padding
        );
    };

    const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (readonly || !image) return;
        // e.preventDefault(); // Prevents touch scroll but also click?

        const { x: cx, y: cy } = getPointInCanvas(e);
        const imgPoint = canvasToImage(cx, cy);
        if (!imgPoint) return;

        const metrics = getDisplayMetrics();
        if (!metrics) return;
        const { displayScale, imgX, imgY } = metrics;

        // 1. Check Resize Handles of Selected Region first
        if (selectedRegionId) {
            const selectedRegion = regions.find(r => r.id === selectedRegionId);
            if (selectedRegion) {
                const handles = getResizeHandleRects(selectedRegion, displayScale, imgX, imgY);
                if (isNearHandle(cx, cy, handles.tl)) { setInteractionMode('resizing'); setActiveHandle('tl'); setStartPoint(imgPoint); setOriginalRegionValues(selectedRegion); return; }
                if (isNearHandle(cx, cy, handles.tr)) { setInteractionMode('resizing'); setActiveHandle('tr'); setStartPoint(imgPoint); setOriginalRegionValues(selectedRegion); return; }
                if (isNearHandle(cx, cy, handles.bl)) { setInteractionMode('resizing'); setActiveHandle('bl'); setStartPoint(imgPoint); setOriginalRegionValues(selectedRegion); return; }
                if (isNearHandle(cx, cy, handles.br)) { setInteractionMode('resizing'); setActiveHandle('br'); setStartPoint(imgPoint); setOriginalRegionValues(selectedRegion); return; }
            }
        }

        // 2. Check Hit Region (for move or select)
        // Check in reverse order (topmost first)
        for (let i = regions.length - 1; i >= 0; i--) {
            const r = regions[i];
            const rx = imgX + r.x * displayScale;
            const ry = imgY + r.y * displayScale;
            const rw = r.width * displayScale;
            const rh = r.height * displayScale;

            if (cx >= rx && cx <= rx + rw && cy >= ry && cy <= ry + rh) {
                onRegionSelect?.(r.id);
                setInteractionMode('moving');
                setStartPoint(imgPoint);
                setOriginalRegionValues(r);
                return;
            }
        }

        // 3. Start Drawing
        setInteractionMode('drawing');
        setStartPoint(imgPoint);
        setOriginalRegionValues({ id: 'temp', x: imgPoint.x, y: imgPoint.y, width: 0, height: 0, color: '#fff' });
        onRegionSelect?.(undefined);

    }, [readonly, image, regions, selectedRegionId, getDisplayMetrics, canvasToImage, onRegionSelect, getResizeHandleRects]);

    const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        const { x: cx, y: cy } = getPointInCanvas(e);
        const imgPoint = canvasToImage(cx, cy);

        // Update Cursor
        if (image && getDisplayMetrics()) {
            let newCursor = 'default';
            const metrics = getDisplayMetrics()!;

            // Check handles
            if (selectedRegionId) {
                const r = regions.find(reg => reg.id === selectedRegionId);
                if (r) {
                    const h = getResizeHandleRects(r, metrics.displayScale, metrics.imgX, metrics.imgY);
                    if (isNearHandle(cx, cy, h.tl) || isNearHandle(cx, cy, h.br)) newCursor = 'nwse-resize';
                    else if (isNearHandle(cx, cy, h.tr) || isNearHandle(cx, cy, h.bl)) newCursor = 'nesw-resize';
                    else {
                        // Check inside
                        const rx = metrics.imgX + r.x * metrics.displayScale;
                        const ry = metrics.imgY + r.y * metrics.displayScale;
                        if (cx >= rx && cx <= rx + r.width * metrics.displayScale && cy >= ry && cy <= ry + r.height * metrics.displayScale) {
                            newCursor = 'move';
                        }
                    }
                }
            }
            if (newCursor === 'default') {
                // Check other regions
                for (let i = regions.length - 1; i >= 0; i--) {
                    const r = regions[i];
                    const rx = metrics.imgX + r.x * metrics.displayScale;
                    const ry = metrics.imgY + r.y * metrics.displayScale;
                    if (cx >= rx && cx <= rx + r.width * metrics.displayScale && cy >= ry && cy <= ry + r.height * metrics.displayScale) {
                        newCursor = 'pointer';
                        break;
                    }
                }
            }
            setCursor(newCursor);
        }
        if (interactionMode === 'none') return;
        if (readonly) return;

        if (interactionMode === 'drawing') {
            if (!imgPoint || !startPoint || !originalRegionValues) return;
            const x = Math.min(startPoint.x, imgPoint.x);
            const y = Math.min(startPoint.y, imgPoint.y);
            const w = Math.abs(imgPoint.x - startPoint.x);
            const h = Math.abs(imgPoint.y - startPoint.y);
            setOriginalRegionValues({ ...originalRegionValues, x, y, width: w, height: h });
        }
        else if (interactionMode === 'moving') {
            if (!imgPoint || !startPoint || !originalRegionValues) return;
            const dx = imgPoint.x - startPoint.x;
            const dy = imgPoint.y - startPoint.y;

            // Constrain to image bounds?
            let newX = originalRegionValues.x + dx;
            let newY = originalRegionValues.y + dy;

            // Validate bounds
            if (newX < 0) newX = 0;
            if (newY < 0) newY = 0;
            if (image && newX + originalRegionValues.width > image.width) newX = image.width - originalRegionValues.width;
            if (image && newY + originalRegionValues.height > image.height) newY = image.height - originalRegionValues.height;

            const updatedRegions = regions.map(r =>
                r.id === originalRegionValues!.id ? { ...r, x: newX, y: newY } : r
            );
            onRegionsChange(updatedRegions);
        }
        else if (interactionMode === 'resizing' && activeHandle) {
            if (!imgPoint || !startPoint || !originalRegionValues) return;
            let { x, y, width: w, height: h } = originalRegionValues;
            const dx = imgPoint.x - startPoint.x;
            const dy = imgPoint.y - startPoint.y;

            // Logic based on handle
            // NOTE: This logic assumes startPoint is static interaction start,
            // but 'originalRegionValues' is the FIXED start state.
            // We calculate delta from START to CURRENT.

            if (activeHandle === 'br') {
                w = Math.max(MIN_RECT_SIZE, originalRegionValues.width + dx);
                h = Math.max(MIN_RECT_SIZE, originalRegionValues.height + dy);
            } else if (activeHandle === 'bl') {
                w = Math.max(MIN_RECT_SIZE, originalRegionValues.width - dx);
                x = originalRegionValues.x + (originalRegionValues.width - w); // keep right side fixed
                h = Math.max(MIN_RECT_SIZE, originalRegionValues.height + dy);
            } else if (activeHandle === 'tr') {
                w = Math.max(MIN_RECT_SIZE, originalRegionValues.width + dx);
                h = Math.max(MIN_RECT_SIZE, originalRegionValues.height - dy);
                y = originalRegionValues.y + (originalRegionValues.height - h);
            } else if (activeHandle === 'tl') {
                w = Math.max(MIN_RECT_SIZE, originalRegionValues.width - dx);
                h = Math.max(MIN_RECT_SIZE, originalRegionValues.height - dy);
                x = originalRegionValues.x + (originalRegionValues.width - w);
                y = originalRegionValues.y + (originalRegionValues.height - h);
            }

            const updatedRegions = regions.map(r =>
                r.id === originalRegionValues!.id ? { ...r, x, y, width: w, height: h } : r
            );
            onRegionsChange(updatedRegions);
        }

    }, [interactionMode, startPoint, originalRegionValues, image, regions, selectedRegionId, activeHandle, getDisplayMetrics, canvasToImage, getResizeHandleRects, onRegionsChange, readonly]);

    const handleMouseUp = useCallback(() => {
        if (interactionMode === 'drawing' && originalRegionValues) {
            if (originalRegionValues.width >= MIN_RECT_SIZE && originalRegionValues.height >= MIN_RECT_SIZE) {
                const newRegion: Region = {
                    ...originalRegionValues,
                    id: `region-${Date.now()}`,
                    color: REGION_COLORS[regions.length % REGION_COLORS.length]
                };
                const newRegions = [...regions, newRegion];
                onRegionsChange(newRegions);

                // CRITICAL: Auto-select needs both the ID and the interaction end trigger
                onRegionSelect?.(newRegion.id);
                // Pass the FULL region object so parent doesn't need to look it up in stale state
                onInteractionEnd?.(newRegion);
            }
        }
        else if ((interactionMode === 'moving' || interactionMode === 'resizing') && selectedRegionId) {
            const region = regions.find(r => r.id === selectedRegionId);
            // Ensure we pass the UPDATED region which might be in 'regions' state if onRegionsChange 
            // was called during move/resize. 'regions' here is from props, should be fresh if parent updates.
            // Actually, we should probably pass the found region.
            if (region) {
                onInteractionEnd?.(region);
            }
        }

        setInteractionMode('none');
        setStartPoint(null);
        setActiveHandle(null);
        setOriginalRegionValues(null);
    }, [interactionMode, originalRegionValues, regions, onRegionsChange, onRegionSelect, onInteractionEnd, selectedRegionId]);

    // Keyboard Delete
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedRegionId || readonly) return;
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const newRegions = regions.filter(r => r.id !== selectedRegionId);
                onRegionsChange(newRegions);
                onRegionSelect?.(undefined);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedRegionId, regions, onRegionsChange, onRegionSelect, readonly]);


    return (
        <div
            ref={containerRef}
            className={cn(
                'relative w-full h-full min-h-[300px] rounded-lg overflow-hidden',
                'bg-neutral-900 border border-border select-none touch-none',
                className
            )}
            style={{ cursor }}
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown} // naive mapping
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
            />
            {/* Zoom Controls Overlay */}
            <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                    onClick={() => setScale((s) => Math.min(5, s * 1.2))}
                    className="w-8 h-8 rounded-lg bg-black/50 text-white backdrop-blur border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                    +
                </button>
                <button
                    onClick={() => setScale((s) => Math.max(0.1, s * 0.8))}
                    className="w-8 h-8 rounded-lg bg-black/50 text-white backdrop-blur border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                    −
                </button>
                <button
                    onClick={() => {
                        setScale(1);
                        setOffset({ x: 0, y: 0 });
                    }}
                    className="px-2 h-8 rounded-lg bg-black/50 text-white backdrop-blur border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors text-xs"
                >
                    {t('3d.canvas.reset')}
                </button>
            </div>
        </div>
    );
}
