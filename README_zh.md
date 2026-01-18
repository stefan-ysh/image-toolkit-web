# Image Toolkit Web

一个基于 Next.js 和 WebGL 构建的现代化 Web 应用，用于高级图像处理、定量分析和 3D 可视化。

![App Logo](public/logo.png)

[English](./README.md) | [日本語](./README_ja.md)

## 🎯 功能特性

### 📸 图像处理与分析

- **格式支持**：支持 PNG, JPG, JPEG 和 RAW 格式的拖拽上传。
- **灰度转换**：提供线性归一化和自动校准的高精度算法。
- **区域分析**：交互式矩形选择工具，用于目标区域的详细分析。
- **定量数据**：实时生成直方图、像素分布统计和剖面分析。
- **数据导出**：支持将分析结果导出为 CSV 或 Excel 格式以便外部处理。

### 🎨 像素艺术与抖动特效

- **实时抖动**：应用有序抖动效果（Bayer, Halftone, Noise, Crosshatch）。
- **色彩模式**：支持灰度、双色调和自定义调色板。
- **动态动画**：具备 Grid Size 呼吸效果和动态噪点图案。

### 🔄 点云与 3D 可视化

- **数据导入**：通过 CSV/Excel 点云数据（X, Y, Grayscale）重构图像。
- **3D 渲染**：使用 Three.js 和 React Three Fiber 进行交互式 3D 表面可视化。
- **视图控制**：支持高度缩放、色彩映射、脉冲动画和自动旋转。
- **导出**：下载重构的 2D 图像或 3D 视图截图。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/image-toolkit-web.git

# 进入项目目录
cd image-toolkit-web

# 安装依赖
npm install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 生产构建

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 🛠️ 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: TailwindCSS v4
- **UI 组件**: shadcn/ui
- **图标**: Lucide React
- **可视化**:
  - Recharts (2D 图表)
  - Three.js + React Three Fiber (3D 渲染)
  - Aceternity UI (抖动着色器)
- **动画**: Framer Motion
- **数据处理**: SheetJS (xlsx)

## 📁 项目结构

```
src/
├── app/                    # App Router 页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页 (Landing)
│   ├── image-to-points/   # 图像分析模块
│   └── points-to-image/   # 点云重构模块
├── components/            # React 组件
│   ├── ui/               # 可复用的 shadcn/ui 组件
│   ├── three/            # 3D 可视化组件
│   ├── dither-shader.tsx # 抖动特效组件
│   └── navigation.tsx    # 全局导航栏
├── lib/                  # 工具函数和 Hooks
│   ├── i18n-context.tsx  # 国际化上下文
│   └── processing.ts     # 图像处理算法
└── public/               # 静态资源
```

## 📊 数据格式

### 点云导入/导出 (CSV)

应用程序支持以下结构的 CSV 文件：

```csv
X,Y,Grayscale
0,0,128
1,0,255
0,1,64
```

- **X**: 水平坐标（像素列）
- **Y**: 垂直坐标（像素行，从下往上的数学坐标系）
- **Grayscale**: 灰度强度值 (0-255)

## 🎨 主要亮点

- ✅ **响应式设计**：针对桌面和移动端交互进行了优化。
- ✅ **主题支持**：无缝切换深色/浅色模式（跟随系统）。
- ✅ **隐私优先**：所有处理均在浏览器客户端并在本地完成。
- ✅ **国际化**：支持双语（英语/中文）。

## 📝 使用流程

### 图像 → 点云

1. **上传**：选择图片文件。
2. **分析**：使用鼠标在画布上绘制区域。
3. **查看统计**：检查选中区域的直方图和统计指标。
4. **导出**：将像素数据保存为标准化的 CSV 点云文件。

### 3D 可视化

1. **导入**：上传有效的 CSV 点云文件。
2. **渲染**：系统自动重构 2D 图像并生成 3D 地形图。
3. **交互**：旋转、缩放和平移 3D 视图。切换网格或更改渲染模式。

## 🤝 贡献

欢迎贡献代码！请随时提交 Pull Request。

## 📄 许可证

本项目采用 MIT 许可证 - 详情请参阅 LICENSE 文件。
