'use client';

import { useState, useCallback } from 'react';
import { FileUpload } from '@/components/file-upload';
import { GrayscaleDistributionChart } from '@/components/grayscale-distribution-chart';
import { ThreeDViewer } from '@/components/three-d-viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileSpreadsheet, Loader2, Box } from 'lucide-react';
import { parsePointCloudFile, convertToImage, type ParseResult, type ImageResult } from '@/lib/point-cloud';
import { calculateStatistics, generateHistogramData } from '@/lib/image-processing';
import { saveImage } from '@/lib/excel-utils';
import { useI18n } from '@/lib/i18n-context';

export default function PointsToImagePage() {
    const { t } = useI18n();
    const [isProcessing, setIsProcessing] = useState(false);
    const [parseResult, setParseResult] = useState<ParseResult | null>(null);
    const [imageResult, setImageResult] = useState<ImageResult | null>(null);
    const [show3D, setShow3D] = useState(false);

    const handleFileSelect = useCallback(async (files: File[]) => {
        if (files.length === 0) return;

        setIsProcessing(true);
        try {
            const parsed = await parsePointCloudFile(files[0]);
            setParseResult(parsed);

            const image = convertToImage(parsed);
            setImageResult(image);
            setShow3D(false);
        } catch (error) {
            console.error('Error processing file:', error);
            alert(error instanceof Error ? error.message : 'Failed to process file');
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const handleSaveImage = useCallback(() => {
        if (!imageResult) return;
        saveImage(imageResult.dataUrl, `${parseResult?.filename || 'image'}.png`);
    }, [imageResult, parseResult]);

    const stats = imageResult
        ? calculateStatistics(new Uint8Array(imageResult.imageData.data.filter((_, i) => i % 4 === 0)))
        : null;

    const histogram = stats
        ? generateHistogramData(new Uint8Array(imageResult!.imageData.data.filter((_, i) => i % 4 === 0)))
        : [];

    return (
        <div className="container max-w-screen-2xl mx-auto px-4 py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">{t('p2i.title')}</h1>
                <p className="text-muted-foreground">
                    {t('p2i.description')}
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Panel - Upload & Preview */}
                <div className="lg:col-span-2 space-y-4">
                    {!imageResult ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('p2i.import.title')}</CardTitle>
                                <CardDescription>
                                    {t('p2i.import.desc')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <FileUpload
                                    accept=".csv,.xlsx,.xls"
                                    onFileSelect={handleFileSelect}
                                    icon={<FileSpreadsheet className="w-8 h-8 text-primary" />}
                                    description={t('comp.upload.dragDrop')}
                                />
                                {isProcessing && (
                                    <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('p2i.processing')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <Card>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>{t('p2i.generated.title')}</CardTitle>
                                            <CardDescription>
                                                {imageResult.width} × {imageResult.height} pixels
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={handleSaveImage}>
                                                <Download className="w-4 h-4 mr-2" />
                                                {t('i2p.common.save')}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setParseResult(null);
                                                    setImageResult(null);
                                                    setShow3D(false);
                                                }}
                                            >
                                                {t('p2i.common.newFile')}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Tabs value={show3D ? '3d' : '2d'} onValueChange={(v) => setShow3D(v === '3d')}>
                                        <TabsList className="grid w-full grid-cols-2 mb-4">
                                            <TabsTrigger value="2d">{t('p2i.view.2d')}</TabsTrigger>
                                            <TabsTrigger value="3d">
                                                <Box className="w-4 h-4 mr-2" />
                                                {t('p2i.view.3d')}
                                            </TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="2d" className="mt-0">
                                            <div className="relative w-full bg-neutral-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[500px]">
                                                <img
                                                    src={imageResult.dataUrl}
                                                    alt="Generated grayscale"
                                                    className="max-w-full max-h-[500px] object-contain"
                                                />
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="3d" className="mt-0">
                                            <div className="relative h-[500px]">
                                                <ThreeDViewer imageData={imageResult.imageData} className="h-full" />
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                {/* Right Panel - Info & Analysis */}
                <div className="space-y-4">
                    {parseResult && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('p2i.info.title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('p2i.info.filename')}</p>
                                    <p className="font-medium truncate">{parseResult.filename}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('p2i.info.totalPoints')}</p>
                                    <Badge variant="secondary">{parseResult.totalPoints.toLocaleString()}</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">{t('p2i.info.xRange')}</p>
                                        <p className="font-mono">{parseResult.bounds.minX} - {parseResult.bounds.maxX}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">{t('p2i.info.yRange')}</p>
                                        <p className="font-mono">{parseResult.bounds.minY} - {parseResult.bounds.maxY}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {stats && histogram.length > 0 && (
                        <GrayscaleDistributionChart
                            data={histogram}
                            stats={stats}
                            title={`${t('comp.chart.grayscaleDist')} - ${t('comp.chart.points')}: ${stats.totalPixels.toLocaleString()}`}
                            t={t}
                        />
                    )}

                    {!imageResult && (
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('p2i.req.title')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="font-medium mb-1">{t('p2i.req.columns')}</p>
                                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                        <li><code className="bg-muted px-1 rounded">X</code> - {t('p2i.req.col.x')}</li>
                                        <li><code className="bg-muted px-1 rounded">Y</code> - {t('p2i.req.col.y')}</li>
                                        <li><code className="bg-muted px-1 rounded">Grayscale</code> - {t('p2i.req.col.gray')}</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-medium mb-1">{t('p2i.req.example')}</p>
                                    <div className="bg-muted p-2 rounded font-mono text-xs">
                                        X,Y,Grayscale<br />
                                        0,0,128<br />
                                        1,0,255<br />
                                        0,1,64
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
