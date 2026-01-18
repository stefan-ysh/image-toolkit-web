# Image Toolkit Web

一个现代化的 Web 应用，整合了图像灰度转换、区域分析和点云可视化功能。

## 🎯 功能特性

### 📸 Image → Point Cloud
- 图片上传（支持拖拽）
- 自动灰度转换
- 交互式区域选择
- 实时直方图分析
- 统计数据展示
- 多格式导出（CSV/Excel）

### 🔄 Point Cloud → Image
- CSV/Excel 文件导入
- 点云数据验证
- 灰度图像生成
- 2D/3D 可视化
- 图像下载

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 生产构建

```bash
npm run build
npm start
```

## 🛠️ 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **样式**: TailwindCSS v4
- **UI 组件**: shadcn/ui
- **图表**: Recharts
- **3D 可视化**: Three.js + React Three Fiber
- **数据处理**: SheetJS (xlsx)

## 📁 项目结构

```
src/
├── app/                    # 页面路由
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── image-to-points/   # 图片转点云模块
│   └── points-to-image/   # 点云转图片模块
├── components/            # UI 组件
│   ├── ui/               # shadcn/ui 组件
│   ├── file-upload.tsx   # 文件上传
│   ├── histogram-chart.tsx # 直方图
│   ├── image-canvas.tsx  # 交互画布
│   ├── three-d-viewer.tsx # 3D 可视化
│   ├── navigation.tsx    # 导航栏
│   └── theme-provider.tsx # 主题切换
└── lib/                  # 工具函数
    ├── image-processing.ts # 图像处理
    ├── point-cloud.ts    # 点云处理
    ├── excel-utils.ts    # 导出功能
    └── utils.ts          # 辅助函数
```

## 📊 数据格式

### 点云导出格式

```csv
X,Y,Grayscale
0,0,128
1,0,255
0,1,64
```

**说明**:
- X: 水平坐标
- Y: 垂直坐标（数学坐标系，从下到上）
- Grayscale: 灰度值 (0-255)

## 🎨 特性

- ✅ 响应式设计（支持桌面和移动端）
- ✅ 暗色/亮色主题切换
- ✅ 触摸手势支持
- ✅ 拖拽上传文件
- ✅ 实时数据可视化
- ✅ 多种导出格式
- ✅ 3D 表面可视化

## 📝 使用说明

### Image → Points 工作流

1. 上传图片（PNG、JPG、JPEG）
2. 在灰度图上绘制矩形选择分析区域
3. 查看每个区域的直方图和统计数据
4. 导出点云数据或分析结果

### Points → Image 工作流

1. 上传包含 X、Y、Grayscale 列的 CSV/Excel 文件
2. 查看生成的 2D 灰度图像
3. 切换到 3D 视图查看表面可视化
4. 下载生成的图像

## 🔧 开发

### 代码规范

```bash
npm run lint
```

### 类型检查

```bash
npm run type-check
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Pull Request 或 Issue！

## 📞 联系方式

如有问题或建议，请创建 Issue。
