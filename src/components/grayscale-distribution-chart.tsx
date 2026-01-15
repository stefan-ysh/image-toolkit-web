'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from 'recharts';
import type { ImageStatistics } from '@/lib/image-processing';

interface GrayscaleDistributionChartProps {
    /** Histogram data: array of { value: grayLevel (0-255), count: frequency } */
    data: { value: number; count: number }[];
    stats?: ImageStatistics;
    title?: string;
    className?: string;
    isLoading?: boolean;
    t?: (key: string) => string;
}

export function GrayscaleDistributionChart({
    data,
    title = 'Grayscale Distribution',
    className,
    isLoading = false,
    t,
}: GrayscaleDistributionChartProps) {
    // Early return for empty data
    if (!data || data.length === 0) {
        if (isLoading) {
            return (
                <div className={`relative bg-muted/30 rounded-lg p-4 ${className || ''}`}>
                    <p className="text-sm font-medium mb-2">{title}</p>
                    <div className="h-[160px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-muted-foreground">{t ? t('comp.chart.analyzing') : 'Analyzing...'}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    }

    // Downsample to ~64 bars for readability
    const sampledData = data.filter((_, i) => i % 4 === 0);

    // Find max count for domain
    const maxCount = Math.max(...sampledData.map(d => d.count), 1);

    return (
        <div className={`bg-muted/30 rounded-lg p-3 ${className || ''}`}>
            <p className="text-sm font-medium mb-2">{title}</p>
            <div className="relative" style={{ width: '100%', height: 160 }}>
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-lg">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-muted-foreground">{t ? t('comp.chart.analyzing') : 'Analyzing...'}</span>
                        </div>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sampledData} margin={{ top: 5, right: 5, left: -10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                        <XAxis
                            dataKey="value"
                            tick={{ fontSize: 9, fill: 'currentColor' }}
                            tickLine={false}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                            interval={15}
                            label={{ value: t ? t('home.stats.grayLevels') : 'Gray Levels', position: 'bottom', fontSize: 10, offset: 5, fill: 'currentColor' }}
                        />
                        <YAxis
                            tick={{ fontSize: 9, fill: 'currentColor' }}
                            tickLine={false}
                            axisLine={false}
                            width={35}
                            domain={[0, maxCount]}
                            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                            label={{ value: t ? t('comp.chart.count') : 'Count', angle: -90, position: 'insideLeft', fontSize: 10, offset: 15, fill: 'currentColor' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                                fontSize: '10px',
                                color: 'hsl(var(--foreground))',
                            }}
                            labelFormatter={(value) => `${t ? t('comp.chart.gray') : 'Gray'}: ${value}`}
                            formatter={(value: number | undefined) => [value ?? 0, t ? t('comp.chart.count') : 'Count']}
                            isAnimationActive={false}
                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                        />
                        <Bar
                            dataKey="count"
                            fill="#60a5fa"
                            radius={[1, 1, 0, 0]}
                            isAnimationActive={false}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

