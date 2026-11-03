'use client';

import React, { useState } from 'react';
import { X, Palette, Sparkles, Plus, Check } from 'lucide-react';
import {
  BackgroundStyleId,
  CalendarType,
  SubCategoryTag,
} from '@/types/calendar';
import {
  BACKGROUND_STYLES,
  CALENDAR_ENVIRONMENTS,
  PRESET_COLOR_SWATCHES,
} from '@/config/neofaro-theme';

interface CustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCalendar: CalendarType;
  subCategories: SubCategoryTag[];
  onUpdateSubCategoryColor: (id: string, colorHex: string) => void;
  onAddSubCategory: (tag: Omit<SubCategoryTag, 'id'>) => void;
  activeBackgroundStyle: BackgroundStyleId;
  onSelectBackgroundStyle: (styleId: BackgroundStyleId) => void;
}

export function CustomizerModal({
  isOpen,
  onClose,
  activeCalendar,
  subCategories,
  onUpdateSubCategoryColor,
  onAddSubCategory,
  activeBackgroundStyle,
  onSelectBackgroundStyle,
}: CustomizerModalProps) {
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newColor, setNewColor] = useState('#4F46E5');

  if (!isOpen) return null;

  const envMeta = CALENDAR_ENVIRONMENTS[activeCalendar];

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddSubCategory({
      calendarType: activeCalendar,
      name: newName.trim(),
      shortCode:
        newCode.trim().toUpperCase() ||
        newName.trim().slice(0, 5).toUpperCase(),
      colorHex: newColor,
    });
    setNewName('');
    setNewCode('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-slide-fade">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl neofaro-scrollbar">
        <div
          className={`h-1.5 w-full bg-gradient-to-r ${envMeta.headerGradient}`}
        />

        <div className="sticky top-0 z-20 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Personalización Visual · {envMeta.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configurá los colores por {envMeta.subCategoryLabel.toLowerCase()} y el estilo ambiental del lienzo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 1. Fondos y Estilos Visuales del Calendario */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Fondo y Textura Ambiental ({envMeta.title})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(Object.keys(BACKGROUND_STYLES) as BackgroundStyleId[]).map(
                (styleKey) => {
                  const styleMeta = BACKGROUND_STYLES[styleKey];
                  const isSelected = activeBackgroundStyle === styleKey;

                  return (
                    <button
                      key={styleKey}
                      type="button"
                      onClick={() => onSelectBackgroundStyle(styleKey)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/30'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {styleMeta.name}
                        </span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-indigo-500" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {styleMeta.description}
                      </p>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* 2. Colores por Materia UNGS / Rama Scout / Categoría Laboral */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Paleta de Colores por {envMeta.subCategoryLabel}
            </h4>

            <div className="space-y-2.5">
              {subCategories.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="color"
                      value={sub.colorHex}
                      onChange={(e) =>
                        onUpdateSubCategoryColor(sub.id, e.target.value)
                      }
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                      title="Elegir color personalizado"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            backgroundColor: `${sub.colorHex}20`,
                            color: sub.colorHex,
                          }}
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                        >
                          {sub.shortCode}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {sub.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {PRESET_COLOR_SWATCHES.map((swatch) => (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() =>
                          onUpdateSubCategoryColor(sub.id, swatch)
                        }
                        style={{ backgroundColor: swatch }}
                        className={`w-4 h-4 rounded-full transition-transform ${
                          sub.colorHex.toLowerCase() === swatch.toLowerCase()
                            ? 'scale-125 ring-2 ring-offset-1 ring-slate-900 dark:ring-white dark:ring-offset-slate-900'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        title={`Usar color ${swatch}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Crear Nueva Materia / Rama / Categoría Laboral */}
          <form
            onSubmit={handleAddTag}
            className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/30 space-y-3"
          >
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
              + Agregar nueva etiqueta en {envMeta.subCategoryLabel}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={
                  activeCalendar === 'academico'
                    ? 'Ej. Base de Datos II'
                    : activeCalendar === 'scout'
                    ? 'Ej. Comisión de Padres'
                    : 'Ej. DevOps & Cloud'
                }
                className="sm:col-span-2 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <input
                type="text"
                maxLength={10}
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="Código (ej. BD-II)"
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-9 h-9 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="submit"
                  style={{ backgroundColor: envMeta.accentHex }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold text-white shadow-sm hover:opacity-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

