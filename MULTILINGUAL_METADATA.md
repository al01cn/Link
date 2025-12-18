# 多语言元数据适配实现

## 功能概述

为网站的 title 和简介适配了多语言切换功能，支持中文和英文两种语言的动态元数据更新。

## 实现方案

### 1. 元数据管理 (`lib/metadata.ts`)

- **`generateMetadata(language)`**: 根据语言生成完整的 Metadata 对象
- **`defaultMetadata`**: 默认的中文元数据
- **`updateClientMetadata(language)`**: 客户端动态更新元数据的工具函数

### 2. 动态元数据组件 (`components/DynamicMetadata.tsx`)

- 监听语言变化，自动更新页面元数据
- 使用 `useEffect` 钩子响应语言切换
- 调用 `updateClientMetadata` 函数更新所有相关的 meta 标签

### 3. 布局文件更新 (`app/layout.tsx`)

- 使用 `defaultMetadata` 作为服务端渲染的基础元数据
- 移除静态的 `lang` 属性，由客户端动态设置

### 4. 主页面集成 (`app/page.tsx`)

- 在主页面中引入 `DynamicMetadata` 组件
- 确保元数据更新在页面加载时生效

## 支持的元数据

### 基础 Meta 标签
- `title`: 页面标题
- `description`: 页面描述
- `keywords`: 关键词（中英文不同）

### Open Graph 标签
- `og:title`: 社交分享标题
- `og:description`: 社交分享描述
- `og:type`: 页面类型（website）
- `og:locale`: 语言区域设置

### Twitter Card 标签
- `twitter:card`: 卡片类型
- `twitter:title`: Twitter 分享标题
- `twitter:description`: Twitter 分享描述

### HTML 属性
- `lang`: 页面语言属性
- `dir`: 文本方向属性

## 语言对应关系

| 语言 | 标题 | 描述 | 关键词 | Locale |
|------|------|------|--------|--------|
| 中文 | 灵狼Link - 简单、安全、强大的短链生成工具 | 简单、安全、强大的短链生成工具 | 短链接,URL缩短,链接生成器,短网址,灵狼Link | zh_CN |
| 英文 | AL01 Link - Simple. Secure. Powerful Link Shortener. | Simple. Secure. Powerful Link Shortener. | short link,URL shortener,link generator,short URL,AL01 Link | en_US |

## 使用方式

1. **自动更新**: 当用户切换语言时，元数据会自动更新
2. **服务端渲染**: 默认使用中文元数据进行服务端渲染
3. **客户端增强**: 页面加载后根据用户语言偏好动态调整

## 技术特点

- **SEO 友好**: 完整的元数据支持，提升搜索引擎优化
- **社交分享**: 支持 Open Graph 和 Twitter Card，优化社交媒体分享体验
- **响应式**: 实时响应语言切换，无需刷新页面
- **类型安全**: 使用 TypeScript 确保类型安全
- **性能优化**: 客户端动态更新，避免不必要的页面重载

## 文件结构

```
lib/
├── metadata.ts          # 元数据生成和更新工具
├── translations.ts      # 翻译文件（已存在）
└── LanguageContext.tsx  # 语言上下文（已存在）

components/
└── DynamicMetadata.tsx  # 动态元数据组件

app/
├── layout.tsx          # 根布局文件
└── page.tsx           # 主页面文件
```

## 注意事项

1. 元数据更新仅在客户端生效，服务端渲染使用默认中文元数据
2. 语言切换时会同时更新页面标题和所有相关的 meta 标签
3. 关键词根据语言不同进行了本地化处理
4. 支持搜索引擎和社交媒体平台的最佳实践