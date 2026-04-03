'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';

type FeedbackTone = 'info' | 'error' | 'success';

interface FeedbackBannerProps {
    tone: FeedbackTone;
    message: string;
    dismissLabel: string;
    onDismiss: () => void;
}

export const FeedbackBanner = memo(function FeedbackBanner({
    tone,
    message,
    dismissLabel,
    onDismiss,
}: FeedbackBannerProps) {
    const toneClassName =
        tone === 'error'
            ? 'border border-destructive/25 bg-destructive/10 text-destructive'
            : tone === 'success'
                ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border border-primary/20 bg-primary/5 text-foreground';

    return (
        <div className={`mb-6 flex items-start justify-between gap-4 rounded-xl px-4 py-3 text-sm ${toneClassName}`}>
            <p>{message}</p>
            <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs"
                onClick={onDismiss}
            >
                {dismissLabel}
            </Button>
        </div>
    );
});
