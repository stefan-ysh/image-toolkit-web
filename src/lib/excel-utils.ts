/**
 * Excel/CSV export utilities
 */

import * as XLSX from 'xlsx';
import type { PointCloudData, ImageStatistics, Region } from './image-processing';

export interface ExportOptions {
    includeRegion?: boolean;
    separateFiles?: boolean;
}

/**
 * Export point cloud data to CSV
 */
export function exportToCSV(
    data: PointCloudData[],
    filename: string,
    includeRegion: boolean = false
): void {
    let csv = includeRegion ? 'X,Y,Grayscale,Region\n' : 'X,Y,Grayscale\n';

    for (const point of data) {
        if (includeRegion) {
            csv += `${point.x},${point.y},${point.grayscale},${point.region || ''}\n`;
        } else {
            csv += `${point.x},${point.y},${point.grayscale}\n`;
        }
    }

    downloadFile(csv, filename, 'text/csv');
}

/**
 * Export point cloud data to Excel with separate sheets per region
 */
export function exportToExcel(
    data: PointCloudData[],
    filename: string,
    includeRegion: boolean = false
): void {
    const wb = XLSX.utils.book_new();

    // Group data by region
    const regionMap = new Map<string, PointCloudData[]>();
    let hasRegions = false;

    for (const point of data) {
        const regionId = point.region || 'All Data';
        if (point.region) hasRegions = true;
        if (!regionMap.has(regionId)) {
            regionMap.set(regionId, []);
        }
        regionMap.get(regionId)!.push(point);
    }

    // If no regions or only one "All Data", create single sheet
    if (!hasRegions || regionMap.size === 1) {
        const wsData = data.map((point, idx) => ({
            Index: idx + 1,
            X: point.x,
            Y: point.y,
            Grayscale: point.grayscale,
        }));
        const ws = XLSX.utils.json_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Point Cloud');
    } else {
        // Create separate sheet for each region
        let sheetIndex = 1;
        regionMap.forEach((points, regionId) => {
            const wsData = points.map((point, idx) => ({
                Index: idx + 1,
                X: point.x,
                Y: point.y,
                Grayscale: point.grayscale,
            }));
            const ws = XLSX.utils.json_to_sheet(wsData);
            // Clean sheet name for Excel compatibility
            const sheetName = regionId.replace(/[/\\:?*[\]]/g, '_').slice(0, 31) || `Region ${sheetIndex}`;
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            sheetIndex++;
        });
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    downloadBlob(blob, filename);
}

/**
 * Export analysis data with statistics
 */
export function exportAnalysisToExcel(
    regions: {
        region: Region;
        stats: ImageStatistics;
        histogramData: { value: number; count: number }[];
    }[],
    filename: string
): void {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = regions.map((r, idx) => ({
        Region: `Region ${idx + 1}`,
        X: r.region.x,
        Y: r.region.y,
        Width: r.region.width,
        Height: r.region.height,
        Mean: r.stats.mean,
        'Std Dev': r.stats.std,
        Min: r.stats.min,
        Max: r.stats.max,
        Median: r.stats.median,
        'Total Pixels': r.stats.totalPixels,
    }));

    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Histogram sheets for each region
    regions.forEach((r, idx) => {
        const histData = r.histogramData.map(d => ({
            'Gray Level': d.value,
            Count: d.count,
        }));
        const histSheet = XLSX.utils.json_to_sheet(histData);
        XLSX.utils.book_append_sheet(wb, histSheet, `Histogram ${idx + 1}`);
    });

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    downloadBlob(blob, filename);
}

/**
 * Export separate files per region
 */
export function exportSeparateFiles(
    data: PointCloudData[],
    baseFilename: string,
    format: 'csv' | 'xlsx' = 'csv'
): void {
    const regionMap = new Map<string, PointCloudData[]>();

    for (const point of data) {
        const regionId = point.region || 'default';
        if (!regionMap.has(regionId)) {
            regionMap.set(regionId, []);
        }
        regionMap.get(regionId)!.push(point);
    }

    regionMap.forEach((points, regionId) => {
        const filename = `${baseFilename}_${regionId}.${format}`;
        if (format === 'csv') {
            exportToCSV(points, filename, false);
        } else {
            exportToExcel(points, filename, false);
        }
    });
}

/**
 * Download text content as file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    downloadBlob(blob, filename);
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Save image from data URL
 */
export function saveImage(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
