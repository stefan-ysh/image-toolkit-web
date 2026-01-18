/**
 * Image processing utilities for grayscale conversion and analysis
 */

export interface ImageStatistics {
  mean: number;
  std: number;
  min: number;
  max: number;
  median: number;
  totalPixels: number;
}

export interface Region {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface PointCloudData {
  x: number;
  y: number;
  grayscale: number;
  region?: string;
}

/**
 * Convert an image to grayscale using canvas
 */
export function convertToGrayscale(imageData: ImageData): ImageData {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    // Luminosity method: 0.299R + 0.587G + 0.114B
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = gray;     // R
    data[i + 1] = gray; // G
    data[i + 2] = gray; // B
    // Alpha unchanged
  }
  return imageData;
}

/**
 * Load an image from a file and return as ImageData
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get ImageData from an image element
 */
export function getImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Extract grayscale values from a region
 */
export function extractRegionData(
  imageData: ImageData,
  region: Region
): Uint8Array {
  const { x, y, width, height } = region;
  const values: number[] = [];

  for (let row = y; row < y + height && row < imageData.height; row++) {
    for (let col = x; col < x + width && col < imageData.width; col++) {
      const idx = (row * imageData.width + col) * 4;
      // Grayscale value (R=G=B in grayscale image)
      values.push(imageData.data[idx]);
    }
  }

  return new Uint8Array(values);
}

/**
 * Extract ImageData for a specific region
 */
export function extractRegionImageData(
  imageData: ImageData,
  region: Region
): ImageData {
  const { x, y, width, height } = region;
  // Create new ImageData with region dimensions
  // Note: We need a canvas to create standard ImageData easily or use constructor if supported env
  // Using canvas is safer for browser compatibility if ImageData constructor has issues,
  // but ImageData constructor is standard now. Let's use array copy.

  // Check bounds
  const safeWidth = Math.min(width, imageData.width - x);
  const safeHeight = Math.min(height, imageData.height - y);

  const newData = new Uint8ClampedArray(safeWidth * safeHeight * 4);

  for (let row = 0; row < safeHeight; row++) {
    const sourceRowStart = ((y + row) * imageData.width + x) * 4;
    const targetRowStart = (row * safeWidth) * 4;

    // Copy row
    const rowData = imageData.data.slice(sourceRowStart, sourceRowStart + safeWidth * 4);
    newData.set(rowData, targetRowStart);
  }

  return new ImageData(newData, safeWidth, safeHeight);
}

/**
 * Calculate statistics for grayscale values
 */
export function calculateStatistics(values: Uint8Array): ImageStatistics {
  if (values.length === 0) {
    return { mean: 0, std: 0, min: 0, max: 0, median: 0, totalPixels: 0 };
  }

  // Use histogram for O(N) median calculation and single pass for others
  let sum = 0;
  let min = 255;
  let max = 0;
  const histogram = new Uint32Array(256);

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
    histogram[v]++;
  }

  const mean = sum / values.length;

  // Calculate Std Dev (2nd pass)
  let sumSqDiff = 0;
  for (let i = 0; i < values.length; i++) {
    const diff = values[i] - mean;
    sumSqDiff += diff * diff;
  }
  const std = Math.sqrt(sumSqDiff / values.length);

  // Calculate Median from Histogram
  let median = 0;
  let count = 0;
  const mid = Math.floor(values.length / 2);

  // To match exact sorting logic for even/odd, we need to find the element(s) at mid
  // But for 0-255 integer visualization stats, finding the bucket is sufficient and faster
  for (let i = 0; i < 256; i++) {
    count += histogram[i];
    if (count > mid) {
      median = i;
      break;
    }
  }

  return {
    mean: Math.round(mean * 100) / 100,
    std: Math.round(std * 100) / 100,
    min,
    max,
    median,
    totalPixels: values.length,
  };
}

/**
 * Generate histogram data for visualization
 */
export function generateHistogramData(values: Uint8Array): { value: number; count: number }[] {
  const histogram = new Array(256).fill(0);

  for (const v of values) {
    histogram[v]++;
  }

  return histogram.map((count, value) => ({ value, count }));
}

/**
 * Generate profile data (index vs value) for visualization
 * Downsamples if too many points (>2000)
 */
export function generateProfileData(values: Uint8Array): { index: number; value: number }[] {
  const data: { index: number; value: number }[] = [];
  const step = Math.ceil(values.length / 2000); // Limit to ~2000 points

  for (let i = 0; i < values.length; i += step) {
    data.push({ index: i, value: values[i] });
  }

  return data;
}

/**
 * Generate point cloud data from image
 */
export function generatePointCloud(
  imageData: ImageData,
  regions?: Region[]
): PointCloudData[] {
  const points: PointCloudData[] = [];
  const { width, height, data } = imageData;

  if (regions && regions.length > 0) {
    // Export only from regions
    for (const region of regions) {
      for (let row = region.y; row < region.y + region.height && row < height; row++) {
        for (let col = region.x; col < region.x + region.width && col < width; col++) {
          const idx = (row * width + col) * 4;
          // Flip Y coordinate for math coordinates (bottom to top)
          const yFlipped = height - 1 - row;
          points.push({
            x: col,
            y: yFlipped,
            grayscale: data[idx],
            region: region.id,
          });
        }
      }
    }
  } else {
    // Export entire image
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const idx = (row * width + col) * 4;
        const yFlipped = height - 1 - row;
        points.push({
          x: col,
          y: yFlipped,
          grayscale: data[idx],
        });
      }
    }
  }

  return points;
}

/**
 * Create a grayscale image data URL from ImageData
 */
export function createGrayscaleImageDataUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}
