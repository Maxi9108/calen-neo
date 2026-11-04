import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Calen-Neo | Gestión de Calendarios UNGS, Scout y Trabajo',
  description:
    'Plataforma unificada de calendarios Académico (UNGS), Scout y Laboral con persistencia en Google Sheets, FastAPI y Agente de IA.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Calen-Neo',
  },
};

export const viewport: Viewport = {
  themeColor: '#4F46E5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-neofaro-bg-light dark:bg-neofaro-bg-dark text-slate-900 dark:text-slate-100">
        {children}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').catch(err => {
                  console.log('SW registration error:', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}

