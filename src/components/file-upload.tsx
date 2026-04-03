'use client';

import { useCallback, useState } from 'react';
import { Upload, File, X, Loader2, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n-context';

interface FileUploadProps {
    accept?: string;
    multiple?: boolean;
    onFileSelect: (files: File[]) => void;
    className?: string;
    description?: string;
    icon?: React.ReactNode;
    isLoading?: boolean;
    supportedFormats?: string;
}

export function FileUpload({
    accept = 'image/*',
    multiple = false,
    onFileSelect,
    className,
    description,
    icon,
    isLoading = false,
    supportedFormats = 'PNG, JPG, JPEG',
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const { t } = useI18n();

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragOut = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                setSelectedFiles(multiple ? files : [files[0]]);
                onFileSelect(multiple ? files : [files[0]]);
            }
        },
        [multiple, onFileSelect]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || []);
            if (files.length > 0) {
                setSelectedFiles(multiple ? files : [files[0]]);
                onFileSelect(multiple ? files : [files[0]]);
            }
        },
        [multiple, onFileSelect]
    );

    const removeFile = useCallback(
        (index: number) => {
            const newFiles = selectedFiles.filter((_, i) => i !== index);
            setSelectedFiles(newFiles);
            onFileSelect(newFiles);
        },
        [selectedFiles, onFileSelect]
    );

    return (
        <div className={cn('w-full', className)}>
            <label
                className={cn(
                    'relative flex flex-col items-center justify-center',
                    'w-full min-h-[200px] p-6',
                    'border-2 border-dashed rounded-xl',
                    'cursor-pointer transition-all duration-200',
                    'hover:border-primary/60 hover:bg-primary/5',
                    isDragging
                        ? 'border-primary bg-primary/10 scale-[1.02]'
                        : 'border-muted-foreground/25 bg-muted/30'
                )}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isLoading}
                />

                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <span className="text-sm font-medium text-muted-foreground">{t('comp.upload.loading')}</span>
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center gap-4 text-center pointer-events-none">
                    <div className={cn(
                        'p-4 rounded-full',
                        'bg-gradient-to-br from-primary/20 to-primary/5',
                        'ring-2 ring-primary/20'
                    )}>
                        {icon || <Upload className="w-8 h-8 text-primary" />}
                    </div>

                    <div className="space-y-1">
                        {/* Desktop Text */}
                        <p className="hidden md:block text-sm font-medium text-foreground">
                            {description || t('comp.upload.dragDrop')}
                        </p>
                        {/* Mobile Text */}
                        <p className="md:hidden text-sm font-medium text-foreground">
                            {t('comp.upload.mobile')}
                        </p>

                        <p className="text-xs text-muted-foreground">
                            {t('comp.upload.supports')}: {supportedFormats}
                        </p>
                    </div>

                    {/* Camera Button for Mobile/Tablet */}
                    <div className="pt-2">
                        <label className={(
                            'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ' +
                            'bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer transition-colors shadow-sm'
                        )}>
                            <Camera className="w-4 h-4" />
                            <span>{t ? t('comp.upload.camera') : "Take Photo"}</span>
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handleFileInput}
                                disabled={isLoading}
                            />
                        </label>
                    </div>
                </div>
            </label>

            {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                    {selectedFiles.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className={cn(
                                'flex items-center justify-between',
                                'p-3 rounded-lg',
                                'bg-muted/50 border border-border'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <File className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="p-1 rounded-full hover:bg-destructive/10 transition-colors"
                            >
                                <X className="w-4 h-4 text-destructive" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
