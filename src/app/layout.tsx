import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VORTEX: OUTPOST-09 | AAA Tactical Multiplayer FPS',
  description: 'High-performance 60Hz competitive tactical browser FPS powered by Next.js, Three.js, and Socket.io.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#07090e] text-gray-100 overflow-hidden antialiased">
        {children}
      </body>
    </html>
  );
}
