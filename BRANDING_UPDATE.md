# 品牌更新说明

## 更新内容

### 1. 应用名称更新
- **中文名称**：ShortLink → 灵狼Link
- **英文名称**：ShortLink → AL01 Link

### 2. 页面标题更新
- 浏览器标题：`AL01 Link - Simple & Secure URL Shortener`
- 导航栏标题：根据语言显示"灵狼Link"或"AL01 Link"

### 3. 页脚更新
- **中文**：`© 2024 灵狼Link. 简单、安全、快速。 | Powered by AL01 Link`
- **英文**：`© 2024 AL01 Link. Simple. Secure. Fast. | Powered by AL01 Link`

### 4. 导航栏新增开源链接
在导航栏中添加了GitHub和Gitee的链接：
- **GitHub**：https://github.com/AL01Link/AL01Link
- **Gitee**：https://gitee.com/AL01Link/AL01Link

### 5. 其他细节更新
- API文档中的作者信息：`AL01 Link Team`
- API文档描述：`AL01 Link API 文档`
- User-Agent：`Mozilla/5.0 (compatible; AL01Link/1.0)`
- OpenAPI规范下载文件名：`al01link-openapi.json`

## 新增翻译键

### 中文
```typescript
github: 'GitHub',
gitee: 'Gitee',
sourceCode: '源码',
```

### 英文
```typescript
github: 'GitHub',
gitee: 'Gitee',
sourceCode: 'Source Code',
```

## 导航栏布局

新的导航栏按钮顺序（从左到右）：
1. Logo + 应用名称
2. 语言切换按钮
3. GitHub链接
4. Gitee链接  
5. API文档按钮
6. 系统日志按钮
7. 设置按钮
8. 管理员下拉菜单

## 响应式设计

- 在小屏幕设备上，GitHub和Gitee链接只显示图标，隐藏文字
- 使用`hidden sm:inline`类来实现响应式文字显示

## 图标使用

- GitHub：使用`Github`图标（来自lucide-react）
- Gitee：使用`GitBranch`图标（来自lucide-react）

## 链接属性

开源仓库链接使用了安全的外部链接属性：
- `target="_blank"`：在新标签页打开
- `rel="noopener noreferrer"`：安全属性，防止潜在的安全风险