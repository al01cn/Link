import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 生产构建配置
  distDir: '.next',
  
  // 性能优化配置
  // cacheComponents: true, // 与动态路由冲突，暂时禁用

  // 优化配置
  reactStrictMode: true, // 开启严格模式
  
  experimental: {
    // React 编译器优化（需要 Next.js 15+）
    // reactCompiler: true,
    // 优化字体加载
    optimizePackageImports: ['lucide-react', '@iconify/react'],
  },
  
  // 压缩配置
  compress: true,
  
  // 图片优化
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1年缓存
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 编译优化（Next.js 13+ 默认启用 SWC）
  // swcMinify: true,
  
  // 静态资源优化
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.CDN_URL : undefined,
  
  // 头部优化
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ],
      },
      // 静态资源缓存
      {
        source: '/(.*)\\.(js|css|woff|woff2|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      // API 路由缓存控制
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          }
        ],
      }
    ]
  },
  
  // 重定向优化
  async redirects() {
    return []
  },
  
  // Turbopack 配置（Next.js 16+）
  turbopack: {
    // 空配置以消除警告
  },
};

export default nextConfig;
