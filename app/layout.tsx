import type { Metadata } from "next";
import "./globals.css";
import { defaultMetadata } from "@/lib/metadata";
import { ThemeProvider } from "@/lib/ThemeContext";
import { GlobalMessageProvider } from "@/lib/useGlobalMessage";

// 使用默认的中文元数据，客户端会根据语言偏好动态更新
export const metadata: Metadata = defaultMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" 
          rel="stylesheet" 
        />
        {/* Animate.css 用于动画效果 */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning={true}>
        <ThemeProvider>
          <GlobalMessageProvider>
            {children}
          </GlobalMessageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
