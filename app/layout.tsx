import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://aime-video-studio.spicy-cedar-9771.chatgpt.site'),
  title: '扣子全自动视频素材生产工作台',
  description: '从爆款数据、脚本生成到真实 UI 录屏与自动剪辑的一体化视频生产工作台。',
  openGraph: {
    title: '扣子全自动视频素材生产工作台',
    description: '从爆款数据到可投放成片',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '扣子全自动视频素材生产工作台' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '扣子全自动视频素材生产工作台',
    description: '从爆款数据到可投放成片',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
