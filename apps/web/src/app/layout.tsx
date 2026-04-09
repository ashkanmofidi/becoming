import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { SkipToContent } from '@/components/a11y/SkipToContent';
import './globals.css';

export const metadata: Metadata = {
  title: 'Becoming.. | Enterprise Focus Timer',
  description: 'Enterprise-grade Pomodoro focus timer with analytics, streaks, and team management.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0A',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bg-primary text-surface-100 antialiased">
        <SkipToContent />
        <div id="main-content">
          {children}
        </div>
        {/* Service worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
