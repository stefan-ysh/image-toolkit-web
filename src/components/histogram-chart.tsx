'use client';

import {
    ScatterChart,
    Scatter,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { ImageStatistics } from '@/lib/image-processing';

interface HistogramChartProps {
    // Legacy histogram data (unused but kept for compatibility)
    data?: { value: number; count: number }[];
    // Profile data: pixel index vs grayscale value
    profileData?: { index: number; value: number }[];
    stats?: ImageStatistics;
    title?: string;
    className?: string;
    isLoading?: boolean;
    chartType?: 'scatter' | 'line';
    t?: (key: string) => string;
}

export function HistogramChart({
    data,
    profileData,
    stats,
    title = 'Pixel Values',
    className,
    isLoading = false,
    chartType = 'scatter',
    t,
}: HistogramChartProps) {
    void data;

    // Profile data: array of { index, value }
    // Aggressive downsampling for performance (max 500 points for scatter)
    const rawData = profileData || [];
    const maxPts = chartType === 'scatter' ? 500 : 800;
    const step = Math.max(1, Math.ceil(rawData.length / maxPts));
    const displayData = rawData
        .filter((_, i) => i % step === 0)
        .map(p => ({ index: p.index + 1, value: p.value })); // 1-indexed

    // Build title matching original format
    const chartTitle = stats
        ? `${title} - ${t ? t('comp.chart.points') : 'Points'}: ${stats.totalPixels.toLocaleString()}`
        : title;

    const chartSubtitle = stats
        ? `${t ? t('i2p.stats.mean') : 'Mean'}: ${stats.mean.toFixed(1)}, ${t ? t('i2p.stats.stdDev') : 'Std'}: ${stats.std.toFixed(1)}, ${t ? t('i2p.stats.range') : 'Range'}: ${stats.min}-${stats.max}`
        : '';

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">{chartTitle}</CardTitle>
                {chartSubtitle && (
                    <CardDescription className="text-xs text-muted-foreground">{chartSubtitle}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="relative">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm font-medium text-muted-foreground">{t ? t('comp.chart.analyzing') : 'Analyzing...'}</span>
                        </div>
                    </div>
                )}
                {/* Min-height constraint to prevent resize loop error */}
                <div className="h-[220px] w-full min-h-[180px] min-w-0 sm:h-[280px] sm:min-h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'scatter' ? (
                            <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey="index"
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    tick={{ fontSize: 10, fill: 'currentColor' }}
                                    tickLine={false}
                                    axisLine={{ stroke: 'hsl(var(--border))' }}
                                    label={{ value: t ? t('comp.chart.pixelIndex') : 'Pixel Index', position: 'bottom', fontSize: 10, offset: -5, fill: 'currentColor' }}
                                />
                                <YAxis
                                    dataKey="value"
                                    type="number"
                                    domain={[0, 255]}
                                    tick={{ fontSize: 10, fill: 'currentColor' }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={35}
                                    label={{ value: t ? t('comp.chart.gray') : 'Gray', angle: -90, position: 'insideLeft', fontSize: 10, offset: 10, fill: 'currentColor' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: 'hsl(var(--foreground))',
                                    }}
                                    formatter={(value: number | undefined) => [value ?? 0, t ? t('comp.chart.gray') : 'Grayscale']}
                                    labelFormatter={(label) => `${t ? t('comp.chart.pixelIndex') : 'Pixel'} ${label}`}
                                    isAnimationActive={false}
                                />
                                <Scatter
                                    data={displayData}
                                    fill="#60a5fa"
                                    isAnimationActive={false}
                                />
                                {stats && (
                                    <>
                                        <ReferenceLine y={stats.mean} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} />
                                        <ReferenceLine y={stats.median} stroke="#22c55e" strokeDasharray="5 5" strokeWidth={2} />
                                    </>
                                )}
                            </ScatterChart>
                        ) : (
                            <LineChart data={displayData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey="index"
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={{ stroke: 'hsl(var(--border))' }}
                                    label={{ value: t ? t('comp.chart.pixelIndex') : 'Pixel Index', position: 'bottom', fontSize: 10, offset: -5 }}
                                />
                                <YAxis
                                    domain={[0, 255]}
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    width={35}
                                    label={{ value: 'Gray (0-255)', angle: -90, position: 'insideLeft', fontSize: 10, offset: 10 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: 'hsl(var(--foreground))',
                                    }}
                                    formatter={(value: number | undefined) => [value ?? 0, 'Grayscale']}
                                    labelFormatter={(label) => `Pixel ${label}`}
                                    isAnimationActive={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={1}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                {stats && (
                                    <>
                                        <ReferenceLine y={stats.mean} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'Mean', position: 'right', fontSize: 9, fill: '#ef4444' }} />
                                        <ReferenceLine y={stats.median} stroke="#22c55e" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'Median', position: 'right', fontSize: 9, fill: '#22c55e' }} />
                                    </>
                                )}
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>

                {/* Statistics Grid */}
                {stats && (
                    <div className="mt-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
                        <StatBox label={t ? t('i2p.stats.mean') : "Mean"} value={stats.mean.toFixed(1)} />
                        <StatBox label={t ? t('i2p.stats.stdDev') : "Std Dev"} value={stats.std.toFixed(1)} />
                        <StatBox label={t ? t('i2p.stats.median') : "Median"} value={stats.median.toFixed(1)} />
                        <StatBox label={t ? t('i2p.stats.min') : "Min"} value={stats.min.toString()} />
                        <StatBox label={t ? t('i2p.stats.max') : "Max"} value={stats.max.toString()} />
                        <StatBox label={t ? t('p2i.info.totalPoints') : "Pixels"} value={formatNumber(stats.totalPixels)} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function StatBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground">{value}</p>
        </div>
    );
}

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}
