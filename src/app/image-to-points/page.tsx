'use client';

import { useState, useCallback } from 'react';
import { FileUpload } from '@/components/file-upload';
import { ImageCanvas } from '@/components/image-canvas';
import { HistogramChart } from '@/components/histogram-chart';
import { GrayscaleDistributionChart } from '@/components/grayscale-distribution-chart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2, FileSpreadsheet, Image as ImageIcon, ImageUp } from 'lucide-react';
import { ThreeDViewer } from '@/components/three-d-viewer';
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

export default function ImageToPointsPage() {
    const { t } = useI18n();
    const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
    const [grayscaleImageUrl, setGrayscaleImageUrl] = useState<string>('');
    const [grayscaleImageData, setGrayscaleImageData] = useState<ImageData | null>(null);
    const [regions, setRegions] = useState<Region[]>([]);
    const [selectedRegionId, setSelectedRegionId] = useState<string | undefined>(undefined);
    const [analyzingRegions, setAnalyzingRegions] = useState<Set<string>>(new Set());
    const [regionAnalysis, setRegionAnalysis] = useState<Map<string, { stats: ImageStatistics; histogram: { value: number; count: number }[]; profile: { index: number; value: number }[]; imageData: ImageData }>>(new Map());
    // Add versioning to force re-render if needed
    const [lastAnalysis, setLastAnalysis] = useState(0);
    // Loading states
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

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
            }

            setOriginalImage(img);
            setGrayscaleImageUrl(grayUrl);
            setGrayscaleImageData(grayData);
            setRegions([]);
            setRegionAnalysis(new Map());
            setSelectedRegionId(undefined);
            setAnalyzingRegions(new Set());
        } catch (error) {
            console.error('Error loading file:', error);
            alert('Failed to load file. Please check format.');
        } finally {
            setIsLoadingImage(false);
        }
    }, []);

    const handleRegionsChange = useCallback((newRegions: Region[]) => {
        setRegions(newRegions);
    }, []);

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
        // Use the passed region object directly to avoid state staleness
        setSelectedRegionId(region.id);
        analyzeRegion(region);
        // Force refresh
        setLastAnalysis(Date.now());
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
        setRegionAnalysis((prev) => {
            const newMap = new Map(prev);
            newMap.delete(regionId);
            return newMap;
        });
        if (selectedRegionId === regionId) {
            setSelectedRegionId(undefined);
        }
    }, [selectedRegionId]);

    const handleExportAnalysis = useCallback(() => {
        if (regions.length === 0) {
            alert('No regions to export');
            return;
        }

        const analysisData = regions.map((region) => {
            const analysis = regionAnalysis.get(region.id);
            return {
                region,
                stats: analysis?.stats || calculateStatistics(extractRegionData(grayscaleImageData!, region)),
                histogramData: analysis?.histogram || [],
            };
        });

        exportAnalysisToExcel(analysisData, 'grayscale-analysis.xlsx');
    }, [regions, regionAnalysis, grayscaleImageData]);

    const handleExportPointCloud = useCallback((format: 'csv' | 'xlsx', mode: 'single' | 'region' | 'separate') => {
        if (!grayscaleImageData) return;

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
    }, [grayscaleImageData, regions]);

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
                                <FileUpload
                                    accept="image/*"
                                    onFileSelect={handleFileSelect}
                                    icon={<ImageIcon className="w-8 h-8 text-primary" />}
                                    isLoading={isLoadingImage}
                                    description={undefined} // Use default responsive text
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
                                                onClick={() => {
                                                    setOriginalImage(null);
                                                    setGrayscaleImageUrl('');
                                                    setRegions([]);
                                                    setRegionAnalysis(new Map());
                                                    setSelectedRegionId(undefined);
                                                }}
                                            >
                                                <ImageUp className="w-4 h-4 mr-2" />
                                                {t('i2p.common.newImage')}
                                            </Button>
                                        </div>
                                        {regions.length > 0 && (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleExportPointCloud('xlsx', 'single')}
                                                    disabled={isExporting}
                                                    className="flex-1"
                                                >
                                                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                                                    {t('i2p.export.excel')}
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
                                                        {t('i2p.export.separate')}
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
                        </>
                    )}
                </div>

                {/* Right Panel - Analysis (Hidden if no image) */}
                {(originalImage || grayscaleImageData) && (
                    <div className="lg:col-span-2 space-y-4">
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
                                        <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${Math.min(regions.length, 4)}, 1fr)` }}>
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
                                                        <div className="rounded-lg overflow-hidden border border-border h-[600px] relative bg-black">
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
