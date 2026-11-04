'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileInstallModal({ isOpen, onClose }: MobileInstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'pwa' | 'apk'>('pwa');

  const liveUrl = 'https://calen-neo.vercel.app';
  const githubActionsUrl = 'https://github.com/Maxi9108/calen-neo/actions';

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-slide-fade">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl neofaro-scrollbar">
        {/* Franja superior */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Versión para Celular & APK
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instalá Calen-Neo como app nativa en tu dispositivo Android o iOS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Métodos */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('pwa')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'pwa'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Instalar Directo (WebAPK)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('apk')}
              className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'apk'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-500" />
              <span>Descargar Archivo .APK</span>
            </button>
          </div>

          {/* CONTENIDO 1: INSTALACIÓN WEBAPK NATIVA (RECOMENDADO) */}
          {activeTab === 'pwa' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-sky-50/40 to-emerald-50/30 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/50 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      ¿Qué es WebAPK de Android?
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      Android y Chrome compilan automáticamente un paquete <strong>.APK nativo</strong> firmado por Google Play Services. No requiere descargar archivos externos sospechosos, se actualiza solo cada vez que subes cambios a GitHub y funciona <strong>100% offline</strong> sin barra de navegador.
                    </p>
                  </div>
                </div>

                {deferredPrompt ? (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>📲 Instalar App en este Dispositivo Ahora</span>
                  </button>
                ) : isInstalled ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>¡Calen-Neo ya está instalado como aplicación en este dispositivo!</span>
                  </div>
                ) : null}
              </div>

              {/* Guía Paso a Paso */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Pasos para instalar en 10 segundos desde tu celular:
                </h5>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Abre <strong>calen-neo.vercel.app</strong> en el navegador Chrome de tu teléfono.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Toca el menú de <strong>tres puntos (⋮)</strong> arriba a la derecha en Chrome.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Selecciona <strong>&ldquo;Instalar aplicación&rdquo;</strong> (o <em>&ldquo;Agregar a la pantalla principal&rdquo;</em>).
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      4
                    </span>
                    <span>
                      ¡Listo! Tendrás el ícono de Calen-Neo en tu pantalla de inicio y en tu cajón de apps de Android.
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 font-mono truncate max-w-[220px]">
                    {liveUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copiado' : 'Copiar Link'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTENIDO 2: DESCARGA DE ARCHIVO .APK DESDE GITHUB ACTIONS */}
          {activeTab === 'apk' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Compilación Automática de .APK
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      El repositorio de GitHub está configurado con <strong>GitHub Actions</strong> para compilar el paquete Android APK (<code>Calen-Neo-v1.0.apk</code>) en la nube usando Gradle y el Android SDK.
                    </p>
                  </div>
                </div>

                <a
                  href={githubActionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Descargar .APK desde GitHub Actions</span>
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <h5 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Cómo instalar el archivo .APK descargado en Android:
                </h5>
                <ol className="list-decimal list-inside space-y-1 pl-1 leading-relaxed">
                  <li>Descarga el archivo <code>Calen-Neo-v1.0.apk</code> en tu teléfono.</li>
                  <li>Toca la notificación de descarga o búscalo en tu carpeta de <em>Descargas</em>.</li>
                  <li>Si Android te avisa por seguridad, selecciona <em>&ldquo;Permitir instalar desde esta fuente&rdquo;</em>.</li>
                  <li>Presiona <strong>Instalar</strong> y la app se añadirá a tus aplicaciones.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <span className="text-[11px] text-slate-400">
            Calen-Neo PWA & WebAPK v1.0
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
