'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SourceSummary {
    name: string;
    kind: 'image' | 'point-cloud';
    width: number;
    height: number;
    totalPoints?: number;
}

interface SourceSummaryCardProps {
    summary: SourceSummary;
    labels: {
        title: string;
        filename: string;
        type: string;
        size: string;
        points: string;
        image: string;
        pointCloud: string;
    };
}

export const SourceSummaryCard = memo(function SourceSummaryCard({
    summary,
    labels,
}: SourceSummaryCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{labels.title}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{labels.filename}</p>
                    <p className="mt-1 break-all text-sm font-medium">{summary.name}</p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{labels.type}</p>
                    <p className="mt-1 text-sm font-medium">
                        {summary.kind === 'image' ? labels.image : labels.pointCloud}
                    </p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{labels.size}</p>
                    <p className="mt-1 text-sm font-medium">
                        {summary.width} x {summary.height}
                    </p>
                </div>
                {typeof summary.totalPoints === 'number' && (
                    <div className="rounded-lg bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">{labels.points}</p>
                        <p className="mt-1 text-sm font-medium">
                            {summary.totalPoints.toLocaleString()}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
