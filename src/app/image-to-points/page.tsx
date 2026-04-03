'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useMemo } from 'react';
import { FileUpload } from '@/components/file-upload';
import { FeedbackBanner } from '@/components/feedback-banner';
import { ImageCanvas } from '@/components/image-canvas';
import { HistogramChart } from '@/components/histogram-chart';
import { GrayscaleDistributionChart } from '@/components/grayscale-distribution-chart';
import { RegionQuickAccess } from '@/components/region-quick-access';
import { SourceSummaryCard } from '@/components/source-summary-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, FileSpreadsheet, Image as ImageIcon, ImageUp } from 'lucide-react';
import {
    loadImageFromFile,
    getImageData,
    convertToGrayscale,
    extractRegionData,
    extractRegionImageData,
    calculateStatistics,
    generateHistogramData,
    generateProfileData,
    generatePointCloud,
    createGrayscaleImageDataUrl,
    type Region,
    type ImageStatistics,
} from '@/lib/image-processing';

import { exportToCSV, exportToExcel, exportAnalysisToExcel, exportSeparateFiles, saveImage } from '@/lib/excel-utils';
import { parsePointCloudFile, convertToImage } from '@/lib/point-cloud';
import { useI18n } from '@/lib/i18n-context';

type FeedbackTone = 'info' | 'error' | 'success';

interface FeedbackState {
    tone: FeedbackTone;
    message: string;
}

interface SourceSummary {
    name: string;
    kind: 'image' | 'point-cloud';
    width: number;
    height: number;
    totalPoints?: number;
}

const ThreeDViewer = dynamic(
    () => import('@/components/three-d-viewer').then((module) => module.ThreeDViewer),
    {
        ssr: false,
        loading: () => (
            <div className="flex h-full min-h-[280px] items-center justify-center text-sm text-muted-foreground">
                Loading 3D preview...
            </div>
        ),
    }
);

export default function ImageToPointsPage() {
    const { t } = useI18n();
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    const [grayscaleImageUrl, setGrayscaleImageUrl] = useState<string>('');
    const [grayscaleImageData, setGrayscaleImageData] = useState<ImageData | null>(null);
    const [regions, setRegions] = useState<Region[]>([]);
    const [selectedRegionId, setSelectedRegionId] = useState<string | undefined>(undefined);
    const [analyzingRegions, setAnalyzingRegions] = useState<Set<string>>(new Set());
    const [regionAnalysis, setRegionAnalysis] = useState<Map<string, { stats: ImageStatistics; histogram: { value: number; count: number }[]; profile: { index: number; value: number }[]; imageData: ImageData }>>(new Map());
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [feedback, setFeedback] = useState<FeedbackState | null>(null);
    const [sourceSummary, setSourceSummary] = useState<SourceSummary | null>(null);
    const selectedRegion = useMemo(
        () => regions.find((region) => region.id === selectedRegionId) ?? null,
        [regions, selectedRegionId]
    );
    const sourceSummaryLabels = useMemo(() => ({
        title: t('i2p.meta.title'),
        filename: t('i2p.meta.filename'),
        type: t('i2p.meta.type'),
        size: t('i2p.meta.size'),
        points: t('i2p.meta.points'),
        image: t('i2p.meta.image'),
        pointCloud: t('i2p.meta.pointCloud'),
    }), [t]);
    const quickAccessLabels = useMemo(() => ({
        title: t('i2p.quick.title'),
        description: t('i2p.quick.desc'),
        noData: t('i2p.regions.noData'),
        region: t('i2p.region.label'),
        position: t('i2p.region.position'),
        size: t('i2p.region.size'),
        analyzing: t('comp.chart.analyzing'),
        open: t('i2p.quick.select'),
        delete: t('i2p.quick.delete'),
    }), [t]);

    const resetWorkspace = useCallback(() => {
        setOriginalImage(null);
        setGrayscaleImageUrl('');
        setGrayscaleImageData(null);
        setRegions([]);
        setRegionAnalysis(new Map());
        setSelectedRegionId(undefined);
        setAnalyzingRegions(new Set());
        setFeedback(null);
        setSourceSummary(null);
    }, []);

    const handleFileSelect = useCallback(async (files: File[]) => {
        if (files.length === 0) return;

        setIsLoadingImage(true);
        try {
            const file = files[0];
            const isImage = file.type.startsWith('image/');

            let img: HTMLImageElement;
            let grayUrl: string;
            let grayData: ImageData;

            if (isImage) {
                img = await loadImageFromFile(file);
                grayData = convertToGrayscale(getImageData(img));
                grayUrl = createGrayscaleImageDataUrl(grayData);
                setSourceSummary({
                    name: file.name,
                    kind: 'image',
                    width: grayData.width,
                    height: grayData.height,
                });
            } else {
                // Assume Point Cloud Data (CSV/Excel)
                const parsed = await parsePointCloudFile(file);
                const result = convertToImage(parsed);

                // Create HTMLImageElement from dataUrl strictly for state compatibility
                img = new Image();
                img.src = result.dataUrl;
                await new Promise((resolve) => { img.onload = resolve; });

                grayData = result.imageData;
                grayUrl = result.dataUrl;
                setSourceSummary({
                    name: file.name,
                    kind: 'point-cloud',
                    width: result.width,
                    height: result.height,
                    totalPoints: parsed.totalPoints,
                });
            }

            setOriginalImage(img);
            setGrayscaleImageUrl(grayUrl);
            setGrayscaleImageData(grayData);
            setRegions([]);
            setRegionAnalysis(new Map());
            setSelectedRegionId(undefined);
            setAnalyzingRegions(new Set());
            setFeedback({ tone: 'success', message: t('i2p.feedback.uploadReady') });
        } catch (error) {
            console.error('Error loading file:', error);
            setFeedback({ tone: 'error', message: t('i2p.feedback.uploadError') });
        } finally {
            setIsLoadingImage(false);
        }
    }, [t]);

    const handleRegionsChange = useCallback((newRegions: Region[]) => {
        setRegions(newRegions);
    }, []);

    const clearRegionAnalysis = useCallback((regionId: string) => {
        setRegionAnalysis((prev) => {
            if (!prev.has(regionId)) {
                return prev;
            }

            const next = new Map(prev);
            next.delete(regionId);
            return next;
        });
        setAnalyzingRegions((prev) => {
            if (!prev.has(regionId)) {
                return prev;
            }

            const next = new Set(prev);
            next.delete(regionId);
            return next;
        });
    }, []);

    const normalizeRegion = useCallback((region: Region) => {
        if (!grayscaleImageData) {
            return region;
        }

        const maxX = Math.max(0, grayscaleImageData.width - 1);
        const maxY = Math.max(0, grayscaleImageData.height - 1);
        const x = Math.min(Math.max(0, region.x), maxX);
        const y = Math.min(Math.max(0, region.y), maxY);
        const width = Math.min(Math.max(1, region.width), grayscaleImageData.width - x);
        const height = Math.min(Math.max(1, region.height), grayscaleImageData.height - y);

        return { ...region, x, y, width, height };
    }, [grayscaleImageData]);

    const analyzeRegion = useCallback(async (region: Region) => {
        if (!grayscaleImageData) return;

        // Set loading state
        setAnalyzingRegions(prev => new Set(prev).add(region.id));

        // Yield to main thread to allow UI to update (show loading spinner)
        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            const data = extractRegionData(grayscaleImageData, region);
            const stats = calculateStatistics(data);
            const histogram = generateHistogramData(data); // Keep generating for potential other uses or export
            const profile = generateProfileData(data);
            const imageData = extractRegionImageData(grayscaleImageData, region);

            setRegionAnalysis((prev) => {
                const newMap = new Map(prev);
                newMap.set(region.id, { stats, histogram, profile, imageData });
                return newMap;
            });
        } finally {
            setAnalyzingRegions(prev => {
                const next = new Set(prev);
                next.delete(region.id);
                return next;
            });
        }
    }, [grayscaleImageData]);

    const handleInteractionEnd = useCallback((region: Region) => {
        setSelectedRegionId(region.id);
        analyzeRegion(region);
    }, [analyzeRegion]);

    const handleRegionSelect = useCallback((regionId: string | undefined) => {
        setSelectedRegionId(regionId);
        if (regionId) {
            const region = regions.find((r) => r.id === regionId);
            // If analyzing or already analyzed (and not stale - we assume staleness is handled by interaction end), check map
            if (region && !regionAnalysis.has(regionId)) {
                analyzeRegion(region);
            }
        }
    }, [regions, regionAnalysis, analyzeRegion]);

    const deleteRegion = useCallback((regionId: string) => {
        setRegions((prev) => prev.filter((r) => r.id !== regionId));
        clearRegionAnalysis(regionId);
        if (selectedRegionId === regionId) {
            setSelectedRegionId(undefined);
        }
        setFeedback(null);
    }, [clearRegionAnalysis, selectedRegionId]);

    const handleRegionFieldChange = useCallback((regionId: string, field: 'x' | 'y' | 'width' | 'height', rawValue: string) => {
        const nextValue = Number.parseInt(rawValue, 10);
        if (Number.isNaN(nextValue)) {
            return;
        }

        setRegions((prev) =>
            prev.map((region) => {
                if (region.id !== regionId) {
                    return region;
                }

                return normalizeRegion({
                    ...region,
                    [field]: nextValue,
                });
            })
        );
        clearRegionAnalysis(regionId);
        setFeedback({ tone: 'info', message: t('i2p.feedback.editPending') });
    }, [clearRegionAnalysis, normalizeRegion, t]);

    const handleRegionAnalysisRefresh = useCallback(() => {
        if (!selectedRegion) {
            return;
        }

        analyzeRegion(selectedRegion);
    }, [analyzeRegion, selectedRegion]);

    const handleExportAnalysis = useCallback(async () => {
        if (!grayscaleImageData) return;
        if (regions.length === 0) {
            setFeedback({ tone: 'error', message: t('i2p.feedback.noRegions') });
            return;
        }

        setFeedback({ tone: 'info', message: t('i2p.feedback.exporting') });
        setIsExporting(true);
        try {
            const analysisData = regions.map((region) => {
                const analysis = regionAnalysis.get(region.id);
                return {
                    region,
                    stats: analysis?.stats || calculateStatistics(extractRegionData(grayscaleImageData, region)),
                    histogramData: analysis?.histogram || generateHistogramData(extractRegionData(grayscaleImageData, region)),
                };
            });

            exportAnalysisToExcel(analysisData, 'grayscale-analysis.xlsx');
            setFeedback(null);
        } finally {
            setIsExporting(false);
        }
    }, [regions, regionAnalysis, grayscaleImageData, t]);

    const handleExportPointCloud = useCallback(async (format: 'csv' | 'xlsx', mode: 'single' | 'region' | 'separate') => {
        if (!grayscaleImageData) return;

        setFeedback({ tone: 'info', message: t('i2p.feedback.exporting') });
        setIsExporting(true);
        try {
            const points = generatePointCloud(
                grayscaleImageData,
                regions.length > 0 ? regions : undefined
            );

            const filename = `point-cloud.${format}`;

            if (mode === 'separate') {
                exportSeparateFiles(points, 'point-cloud', format);
            } else {
                const includeRegion = mode === 'region';
                if (format === 'csv') {
                    exportToCSV(points, filename, includeRegion);
                } else {
                    exportToExcel(points, filename, includeRegion);
                }
            }
            setFeedback(null);
        } finally {
            setIsExporting(false);
        }
    }, [grayscaleImageData, regions, t]);

    const handleSaveImage = useCallback(() => {
        if (!grayscaleImageUrl) return;
        saveImage(grayscaleImageUrl, 'grayscale-image.png');
    }, [grayscaleImageUrl]);



    return (
        <div className="container max-w-screen-2xl mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">{t('common.title')}</h1>
                <p className="text-muted-foreground">
                    {t('common.description')}
                </p>
            </div>

            {feedback && (
                <FeedbackBanner
                    tone={feedback.tone}
                    message={feedback.message}
                    dismissLabel={t('i2p.feedback.dismiss')}
                    onDismiss={() => setFeedback(null)}
                />
            )}

            <div className={`grid gap-6 ${grayscaleImageUrl ? 'lg:grid-cols-3' : 'lg:grid-cols-1 max-w-2xl mx-auto'}`}>
                {/* Left Panel - Image Canvas */}
                <div className={`${grayscaleImageUrl ? 'lg:col-span-1' : 'lg:col-span-1'} space-y-4`}>
                    {!grayscaleImageUrl ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('i2p.upload.title')}</CardTitle>
                                <CardDescription>{t('i2p.upload.cardDesc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-6 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4">
                                    <h3 className="text-sm font-semibold">{t('i2p.upload.emptyTitle')}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {t('i2p.upload.emptyDesc')}
                                    </p>
                                    <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                                        <p>1. {t('i2p.upload.emptyStep1')}</p>
                                        <p>2. {t('i2p.upload.emptyStep2')}</p>
                                        <p>3. {t('i2p.upload.emptyStep3')}</p>
                                    </div>
                                </div>
                                <FileUpload
                                    accept="image/*,.csv,.xls,.xlsx"
                                    onFileSelect={handleFileSelect}
                                    icon={<ImageIcon className="w-8 h-8 text-primary" />}
                                    isLoading={isLoadingImage}
                                    description={t('common.description')}
                                    supportedFormats="PNG, JPG, JPEG, CSV, XLSX"
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <Card className="flex flex-col h-full">
                                <CardHeader className="pb-3">
                                    <div className="flex flex-col justify-between gap-4">
                                        <div>
                                            <CardTitle>{t('i2p.grayscale.title')}</CardTitle>
                                            <CardDescription>{t('i2p.grayscale.desc')}</CardDescription>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Button variant="outline" size="sm" onClick={handleSaveImage} className="flex-1">
                                                <Download className="w-4 h-4 mr-2" />
                                                {t('i2p.common.save')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1"
                                                onClick={resetWorkspace}
                                            >
                                                <ImageUp className="w-4 h-4 mr-2" />
                                                {t('i2p.common.newImage')}
                                            </Button>
                                        </div>
                                        {regions.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleExportAnalysis}
                                                    disabled={isExporting}
                                                    className="flex-1"
                                                >
                                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                                    {isExporting ? t('i2p.common.exporting') : t('i2p.export.title')}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleExportPointCloud('xlsx', 'single')}
                                                    disabled={isExporting}
                                                    className="flex-1"
                                                >
                                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                                    {isExporting ? t('i2p.common.exporting') : t('i2p.export.excel')}
                                                </Button>
                                                {regions.length > 1 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleExportPointCloud('xlsx', 'separate')}
                                                        disabled={isExporting}
                                                        className="flex-1"
                                                    >
                                                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                                                        {isExporting ? t('i2p.common.exporting') : t('i2p.export.separate')}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ImageCanvas
                                        imageSrc={grayscaleImageUrl}
                                        regions={regions}
                                        onRegionsChange={handleRegionsChange}
                                        selectedRegionId={selectedRegionId}
                                        onRegionSelect={handleRegionSelect}
                                        onInteractionEnd={handleInteractionEnd}
                                        className="min-h-[300px]"
                                    />
                                </CardContent>
                            </Card>

                            {sourceSummary && <SourceSummaryCard summary={sourceSummary} labels={sourceSummaryLabels} />}
                        </>
                    )}
                </div>

                {/* Right Panel - Analysis (Hidden if no image) */}
                {(originalImage || grayscaleImageData) && (
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <CardTitle>{t('i2p.region.editor.title')}</CardTitle>
                                        <CardDescription>{t('i2p.region.editor.desc')}</CardDescription>
                                    </div>
                                    {selectedRegion && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRegionAnalysisRefresh}
                                            disabled={analyzingRegions.has(selectedRegion.id)}
                                        >
                                            {t('i2p.region.editor.update')}
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {selectedRegion ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            {([
                                                ['x', t('i2p.region.editor.x')],
                                                ['y', t('i2p.region.editor.y')],
                                                ['width', t('i2p.region.editor.width')],
                                                ['height', t('i2p.region.editor.height')],
                                            ] as const).map(([field, label]) => (
                                                <div key={field} className="space-y-2">
                                                    <Label htmlFor={`region-${field}`}>{label}</Label>
                                                    <Input
                                                        id={`region-${field}`}
                                                        type="number"
                                                        inputMode="numeric"
                                                        min={field === 'width' || field === 'height' ? 1 : 0}
                                                        value={selectedRegion[field]}
                                                        onChange={(event) => handleRegionFieldChange(selectedRegion.id, field, event.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {t('i2p.region.editor.helper')}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {t('i2p.region.editor.empty')}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <RegionQuickAccess
                                    regions={regions}
                                    selectedRegionId={selectedRegionId}
                                    analyzingRegionIds={analyzingRegions}
                                    labels={quickAccessLabels}
                                    onSelect={handleRegionSelect}
                                    onDelete={deleteRegion}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>{t('i2p.regions.title')} ({regions.length})</CardTitle>
                                <CardDescription>{t('i2p.regions.desc')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {regions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        {t('i2p.regions.noData')}
                                    </p>
                                ) : (
                                    <Tabs value={selectedRegionId || regions[0]?.id} onValueChange={handleRegionSelect}>
                                        <TabsList className="hidden w-full xl:grid" style={{ gridTemplateColumns: `repeat(${Math.min(regions.length, 4)}, 1fr)` }}>
                                            {regions.map((region, idx) => (
                                                <TabsTrigger key={region.id} value={region.id} className="text-xs">
                                                    R{idx + 1}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {regions.map((region, idx) => {
                                            const analysis = regionAnalysis.get(region.id);
                                            return (
                                                <TabsContent key={region.id} value={region.id} className="space-y-4 mt-4">
                                                    <div className="flex items-center justify-between">
                                                        <Badge style={{ backgroundColor: region.color }}>
                                                            {t('i2p.region.label')} {idx + 1}
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deleteRegion(region.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                    <div className="text-xs space-y-1 text-muted-foreground">
                                                        <p>{t('i2p.region.position')}: ({region.x}, {region.y})</p>
                                                        <p>{t('i2p.region.size')}: {region.width} × {region.height}</p>
                                                    </div>

                                                    {/* 3D Viewer Integration */}
                                                    {(analysis?.imageData) && (
                                                        <div className="relative h-[320px] overflow-hidden rounded-lg border border-border bg-black sm:h-[420px] lg:h-[520px] xl:h-[600px]">
                                                            <ThreeDViewer imageData={analysis.imageData} />
                                                        </div>
                                                    )}

                                                    {(analysis || analyzingRegions.has(region.id)) && (
                                                        <>
                                                            <HistogramChart
                                                                profileData={analysis?.profile || []}
                                                                stats={analysis?.stats}
                                                                title={`${t('i2p.region.label')} ${idx + 1}`}
                                                                isLoading={analyzingRegions.has(region.id)}
                                                                chartType="scatter"
                                                                t={t}
                                                            />
                                                            <GrayscaleDistributionChart
                                                                data={analysis?.histogram || []}
                                                                stats={analysis?.stats}
                                                                title={t('comp.chart.grayscaleDist')}
                                                                isLoading={analyzingRegions.has(region.id)}
                                                                t={t}
                                                            />
                                                        </>
                                                    )}
                                                </TabsContent>
                                            );
                                        })}
                                    </Tabs>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
