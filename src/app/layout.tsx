import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Calen-Neo | Gestión de Calendarios UNGS, Scout y Trabajo',
  description:
    'Plataforma unificada de calendarios Académico (UNGS), Scout y Laboral con persistencia en Google Sheets, FastAPI y Agente de IA.',
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
      </body>
    </html>
  );
}

