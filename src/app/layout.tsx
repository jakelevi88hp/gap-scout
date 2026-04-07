import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gap Scout — TikTok Content Intelligence',
  description: 'Scout content gaps, generate scripts, dominate TikTok',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
