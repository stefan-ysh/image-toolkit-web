'use client';

import { memo } from 'react';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Region } from '@/lib/image-processing';

interface RegionQuickAccessProps {
    regions: Region[];
    selectedRegionId?: string;
    analyzingRegionIds: Set<string>;
    labels: {
        title: string;
        description: string;
        noData: string;
        region: string;
        position: string;
        size: string;
        analyzing: string;
        open: string;
        delete: string;
    };
    onSelect: (regionId: string) => void;
    onDelete: (regionId: string) => void;
}

export const RegionQuickAccess = memo(function RegionQuickAccess({
    regions,
    selectedRegionId,
    analyzingRegionIds,
    labels,
    onSelect,
    onDelete,
}: RegionQuickAccessProps) {
    return (
        <>
            <div className="mb-2">
                <h3 className="text-base font-semibold">{labels.title}</h3>
                <p className="text-sm text-muted-foreground">{labels.description}</p>
            </div>
            {regions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{labels.noData}</p>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:hidden">
                    {regions.map((region, idx) => {
                        const isSelected = region.id === selectedRegionId;
                        const isAnalyzing = analyzingRegionIds.has(region.id);
                        return (
                            <div
                                key={region.id}
                                className={`rounded-xl border p-4 transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
                            >
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <Badge style={{ backgroundColor: region.color }}>
                                        {labels.region} {idx + 1}
                                    </Badge>
                                    {isAnalyzing && <Badge variant="secondary">{labels.analyzing}</Badge>}
                                </div>
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <p>{labels.position}: ({region.x}, {region.y})</p>
                                    <p>{labels.size}: {region.width} x {region.height}</p>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button
                                        variant={isSelected ? 'default' : 'outline'}
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => onSelect(region.id)}
                                    >
                                        {labels.open}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => onDelete(region.id)}
                                    >
                                        <Trash2 className="mr-1 h-4 w-4" />
                                        {labels.delete}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
});
