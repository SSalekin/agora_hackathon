import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#123f32',
};

export const metadata: Metadata = {
  title: 'NestFind | Voice apartment search in Da Nang',
  description: 'Talk naturally and discover Da Nang apartments matched to your budget, location, and move-in date.',
  manifest: '/site.webmanifest',
  applicationName: 'NestFind',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'NestFind' },
  icons: {
    icon: [{ url: '/nestfind-mark.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/nestfind-mark.svg' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-screen">{children}</body>
    </html>
  );
}
