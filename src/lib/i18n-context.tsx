'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface Translations {
    [key: string]: {
        en: string;
        zh: string;
    };
}

const translations: Translations = {
    // Navigation
    'nav.home': { en: 'Home', zh: '首页' },
    'nav.imageToPoints': { en: 'Image to Points', zh: '图像转点云' },

    // Home
    'home.hero.title': { en: 'Image ToolKit', zh: '图像处理工具箱' },
    'home.hero.subtitle': { en: 'Professional Image Processing & Analysis', zh: '专业图像处理与分析' },
    'home.hero.description': { en: 'Convert images to grayscale, analyze pixel distributions, and visualize 3D point clouds. All in your browser.', zh: '将图像转换为灰度，分析像素分布，并在浏览器中可视化3D点云。' },

    // Common Page Headers
    'common.title': { en: 'Image Toolkit', zh: '图像工具箱' },
    'common.description': { en: 'Upload an image for analysis or import point cloud data to visualize and reconstruct.', zh: '上传图像进行分析，或导入点云数据进行可视化和重建。' },

    'home.features.grayscale': { en: 'Grayscale Conversion', zh: '灰度转换' },
    'home.features.grayscale.desc': { en: 'Convert images to high-quality grayscale with precise algorithms.', zh: '使用精确算法将图像转换为高质量灰度图。' },
    'home.features.analysis': { en: 'Region Analysis', zh: '区域分析' },
    'home.features.analysis.desc': { en: 'Select and analyze specific image regions for detailed statistics.', zh: '选择并分析特定图像区域以获取详细统计数据。' },
    'home.features.3d': { en: '3D Visualization', zh: '3D 可视化' },
    'home.features.3d.desc': { en: 'View your image data as interactive 3D point clouds surfaces.', zh: '将图像数据作为交互式3D点云表面查看。' },
    // Home Cards & Workflow
    'home.card.unified.title': { en: 'Enter Workbench', zh: '进入工作台' },
    'home.card.unified.desc': { en: 'Access the unified environment for data acquisition, processing, and visualization.', zh: '访问集数据采集、处理和可视化于一体的统一环境。' },
    'home.steps.upload': { en: 'Data Acquisition', zh: '数据采集' },
    'home.steps.analyze': { en: 'Quantitative Processing', zh: '定量处理' },
    'home.steps.3d': { en: 'Topographic Rendering', zh: '形貌渲染' },

    // Image to Points
    'i2p.title': { en: 'Image → Point Cloud', zh: '图像 → 点云' },
    'i2p.description': { en: 'Convert images to grayscale, analyze regions, and export point cloud data', zh: '将图像转换为灰度，分析区域并导出点云数据' },
    'i2p.upload.title': { en: 'Upload Image', zh: '上传图像' },
    'i2p.upload.desc': { en: 'Drag and drop or click to upload', zh: '拖放或点击上传' },
    'i2p.upload.cardDesc': { en: 'Select an image to convert to grayscale', zh: '选择需转换的图像' },
    'i2p.grayscale.title': { en: 'Grayscale Image', zh: '灰度图像' },
    'i2p.grayscale.desc': { en: 'Region selection and analysis', zh: '区域选择与分析' },
    'i2p.common.save': { en: 'Save', zh: '保存' },
    'i2p.common.newImage': { en: 'New Image', zh: '新图像' },
    'i2p.export.title': { en: 'Export Data', zh: '导出数据' },
    'i2p.regions.title': { en: 'Regions', zh: '区域' },
    'i2p.regions.desc': { en: 'Click regions on canvas to analyze', zh: '点击画布上的区域进行分析' },
    'i2p.regions.noData': { en: 'No regions selected. Draw rectangles on the image to create analysis regions.', zh: '未选择区域。在图像上绘制矩形以创建分析区域。' },
    'i2p.region.label': { en: 'Region', zh: '区域' },
    'i2p.region.position': { en: 'Position', zh: '位置' },
    'i2p.region.size': { en: 'Size', zh: '尺寸' },
    'i2p.analysis.title': { en: 'Analysis Results', zh: '分析结果' },
    'i2p.analysis.noData': { en: 'No region selected. Draw a rectangle on the image to analyze.', zh: '未选择区域。在图像上绘制矩形进行分析。' },
    'i2p.export.excel': { en: 'Export Excel', zh: '导出 Excel' },
    'i2p.export.separate': { en: 'Export Separate Files', zh: '导出独立文件' },
    'i2p.stats.region': { en: 'Region', zh: '区域' },
    'i2p.stats.mean': { en: 'Mean', zh: '平均值' },
    'i2p.stats.median': { en: 'Median', zh: '中位数' },
    'i2p.stats.stdDev': { en: 'Std Dev', zh: '标准差' },
    'i2p.stats.min': { en: 'Min', zh: '最小值' },
    'i2p.stats.max': { en: 'Max', zh: '最大值' },
    'i2p.stats.range': { en: 'Range', zh: '范围' },
    'i2p.chart.profile': { en: 'Pixel Profile View', zh: '像素剖面视图' },
    'i2p.chart.distribution': { en: 'Grayscale Distribution', zh: '灰度分布' },

    // Common Components
    'comp.upload.dragDrop': { en: 'Drag and drop image here, or click to upload', zh: '将图片拖拽至此，或点击上传' },
    'comp.upload.mobile': { en: 'Tap to upload or take a photo', zh: '点击上传或拍照' },
    'comp.upload.supports': { en: 'Supports', zh: '支持' },
    'comp.upload.loading': { en: 'Loading...', zh: '加载中...' },
    'comp.upload.camera': { en: 'Take Photo', zh: '拍照' },
    'comp.chart.analyzing': { en: 'Analyzing...', zh: '正在分析...' },
    'comp.chart.gray': { en: 'Grayscale', zh: '灰度' },
    'comp.chart.grayscaleDist': { en: 'Grayscale Distribution', zh: '灰度分布' },
    'comp.chart.pixelIndex': { en: 'Pixel Index', zh: '像素索引' },
    'comp.chart.count': { en: 'Count', zh: '数量' },
    'comp.chart.points': { en: 'Points', zh: '点数' },

    // Home Stats & Features
    'home.stats.grayLevels': { en: 'Bit Depth (8-bit)', zh: '位深度 (8-bit)' },
    'home.stats.exportFormats': { en: 'Export Formats', zh: '导出格式' },
    'home.stats.3dView': { en: 'Render Engine', zh: '渲染引擎' },
    'home.tag.grayscale': { en: 'Grayscale', zh: '灰度' },
    'home.tag.region': { en: 'Region', zh: '区域' },
    'home.tag.histogram': { en: 'Histogram', zh: '直方图' },
    'home.tag.export': { en: 'Export', zh: '导出' },
    'home.tag.import': { en: 'Import', zh: '导入' },
    'home.tag.generate': { en: 'Generate', zh: '生成' },
    'home.tag.3dView': { en: '3D View', zh: '3D 视图' },

    'home.start': { en: 'Get Started', zh: '开始使用' },

    // 3D Viewer Controls
    '3d.mode': { en: 'Render Mode', zh: '渲染模式' },
    '3d.grid': { en: 'Toggle Grid', zh: '网格开关' },
    '3d.colormap': { en: 'Color Map', zh: '色彩映射' },
    '3d.pulse': { en: 'Pulse Animation', zh: '脉冲动画' },
    '3d.screenshot': { en: 'Screenshot', zh: '截图' },
    '3d.reset': { en: 'Reset View', zh: '重置视图' },
    '3d.rotate': { en: 'Auto Rotate', zh: '自动旋转' },
    '3d.height': { en: 'Height Scale', zh: '高度缩放' },
    '3d.canvas.reset': { en: 'Reset Canvas', zh: '重置画布' },
    '3d.export': { en: 'Export 3D Model', zh: '导出 3D 模型' },

    // Settings
    'settings.language': { en: 'Language', zh: '语言' },
    'settings.theme': { en: 'Theme', zh: '主题' },

    // Dither Shader Showcase
    'home.dither.title': { en: 'Pixel Art Effects', zh: '像素艺术效果' },
    'home.dither.desc': { en: 'Transform images with real-time ordered dithering. Perfect for creating retro aesthetics, pixel art effects, and unique visual styles.', zh: '使用实时有序抖动转换图像。非常适合创建复古美学、像素艺术效果和独特的视觉风格。' },
    'home.dither.modes': { en: 'Bayer / Halftone / Noise / Crosshatch', zh: 'Bayer / 半色调 / 噪点 / 交叉线' },
    'home.dither.colors': { en: 'Grayscale / Duotone / Custom Palette', zh: '灰度 / 双色调 / 自定义调色板' },
    'home.dither.animation': { en: 'Real-time Animation Support', zh: '实时动画支持' },
};

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('zh'); // Default to Chinese as per request context implies Chinese user

    const t = (key: string) => {
        return translations[key]?.[language] || key;
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useI18n must be used within a I18nProvider');
    }
    return context;
}
