/**
 * Point cloud processing utilities for converting CSV/Excel data to images
 */

import * as XLSX from 'xlsx';

export interface PointData {
    x: number;
    y: number;
    grayscale: number;
}

export interface ParseResult {
    data: PointData[];
    filename: string;
    totalPoints: number;
    bounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    };
}

export interface ImageResult {
    imageData: ImageData;
    width: number;
    height: number;
    dataUrl: string;
}

/**
 * Parse CSV or Excel file to point cloud data
 */
export async function parsePointCloudFile(file: File): Promise<ParseResult> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    let rows: Record<string, unknown>[];

    if (extension === 'csv') {
        const text = await file.text();
        rows = parseCSV(text);
    } else if (extension === 'xlsx' || extension === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(firstSheet);
    } else {
        throw new Error(`Unsupported file format: ${extension}`);
    }

    return processRows(rows, file.name);
}

/**
 * Parse CSV text to rows
 */
function parseCSV(text: string): Record<string, unknown>[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const rows: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row: Record<string, unknown> = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx]?.trim();
        });
        rows.push(row);
    }

    return rows;
}

/**
 * Process parsed rows to point cloud data
 */
function processRows(rows: Record<string, unknown>[], filename: string): ParseResult {
    // Validate required columns
    const requiredColumns = ['X', 'Y', 'Grayscale'];
    const firstRow = rows[0] || {};
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    const data: PointData[] = [];
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const row of rows) {
        const x = Number(row['X']);
        const y = Number(row['Y']);
        const grayscale = Number(row['Grayscale']);

        if (isNaN(x) || isNaN(y) || isNaN(grayscale)) {
            continue; // Skip invalid rows
        }

        data.push({ x, y, grayscale: Math.max(0, Math.min(255, grayscale)) });

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
    }

    if (data.length === 0) {
        throw new Error('No valid data points found in file');
    }

    return {
        data,
        filename: filename.replace(/\.[^.]+$/, ''),
        totalPoints: data.length,
        bounds: { minX, maxX, minY, maxY },
    };
}

/**
 * Convert point cloud data to grayscale image
 */
export function convertToImage(parseResult: ParseResult): ImageResult {
    const { data, bounds } = parseResult;
    const { minX, maxX, minY, maxY } = bounds;

    const width = Math.floor(maxX - minX) + 1;
    const height = Math.floor(maxY - minY) + 1;

    if (width <= 0 || height <= 0) {
        throw new Error('Invalid image dimensions');
    }

    // Create image array (initialized to 0/black)
    const pixels = new Uint8ClampedArray(width * height * 4);

    // Fill with default (black, fully opaque)
    for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = 0;     // R
        pixels[i + 1] = 0; // G
        pixels[i + 2] = 0; // B
        pixels[i + 3] = 255; // A
    }

    // Populate from point cloud data
    for (const point of data) {
        const x = Math.floor(point.x - minX);
        // Flip Y coordinate (point cloud uses math coords, image uses screen coords)
        const y = height - 1 - Math.floor(point.y - minY);

        if (x >= 0 && x < width && y >= 0 && y < height) {
            const idx = (y * width + x) * 4;
            const gray = point.grayscale;
            pixels[idx] = gray;     // R
            pixels[idx + 1] = gray; // G
            pixels[idx + 2] = gray; // B
            // Alpha already set to 255
        }
    }

    const imageData = new ImageData(pixels, width, height);

    // Create data URL
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');

    return { imageData, width, height, dataUrl };
}

/**
 * Generate 3D surface data from image
 */
export function generate3DSurfaceData(imageData: ImageData): {
    positions: Float32Array;
    colors: Float32Array;
    width: number;
    height: number;
} {
    const { width, height, data } = imageData;
    const positions = new Float32Array(width * height * 3);
    const colors = new Float32Array(width * height * 3);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            const pixelIdx = idx * 4;
            const posIdx = idx * 3;

            // Normalize coordinates to [-1, 1] range
            const nx = (x / width - 0.5) * 2;
            const ny = (y / height - 0.5) * 2;

            // Z is grayscale value normalized to [0, 1]
            const gray = data[pixelIdx] / 255;

            positions[posIdx] = nx;
            positions[posIdx + 1] = -ny; // Flip Y for 3D
            positions[posIdx + 2] = gray * 0.5; // Scale Z

            // Grayscale color
            colors[posIdx] = gray;
            colors[posIdx + 1] = gray;
            colors[posIdx + 2] = gray;
        }
    }

    return { positions, colors, width, height };
}
