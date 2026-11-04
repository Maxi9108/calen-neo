'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Plus,
  Archive,
  ArchiveRestore,
  Trash2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Sparkles,
  Copy,
  Check,
  Download,
  AlertCircle,
  Compass,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarType,
  SubCategoryTag,
  SyllabusTopic,
} from '@/types/calendar';
import {
  CALENDAR_ENVIRONMENTS,
  PRESET_COLOR_SWATCHES,
} from '@/config/neofaro-theme';
import {
  generateGeminiStudyPrompt,
  exportRoadmapMarkdown,
  triggerFileDownload,
} from '@/utils/exportAndPrompts';

interface SubjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCalendar: CalendarType;
  subCategories: SubCategoryTag[];
  allSubCategoriesOfActiveCalendar: SubCategoryTag[];
  events: CalendarEvent[];
  onSelectSubCategoryForCalendar: (id: string) => void;
  onAddSubCategory: (tag: Omit<SubCategoryTag, 'id'>) => SubCategoryTag;
  onUpdateSubCategory: (tag: SubCategoryTag) => void;
  onToggleArchiveSubCategory: (id: string) => void;
  onDeleteSubCategory: (id: string) => void;
  onToggleSyllabusTopic: (subCatId: string, topicId: string) => void;
  onAddSyllabusTopic: (
    subCatId: string,
    title: string,
    priority?: 'alta' | 'media' | 'baja',
    targetHours?: number,
    notes?: string
  ) => void;
  onDeleteSyllabusTopic: (subCatId: string, topicId: string) => void;
}

export function SubjectManagerModal({
  isOpen,
  onClose,
  activeCalendar,
  subCategories: _subCategories,
  allSubCategoriesOfActiveCalendar,
  events,
  onSelectSubCategoryForCalendar,
  onAddSubCategory,
  onUpdateSubCategory: _onUpdateSubCategory,
  onToggleArchiveSubCategory,
  onDeleteSubCategory,
  onToggleSyllabusTopic,
  onAddSyllabusTopic,
  onDeleteSyllabusTopic,
}: SubjectManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);

  // Formulario de nueva materia
  const [newName, setNewName] = useState('');
  const [newShortCode, setNewShortCode] = useState('');
  const [newColorHex, setNewColorHex] = useState('#4F46E5');
  const [newDescription, setNewDescription] = useState('');

  // Formulario de nuevo tema en roadmap
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicPriority, setNewTopicPriority] = useState<
    'alta' | 'media' | 'baja'
  >('alta');
  const [newTopicHours, setNewTopicHours] = useState<number>(6);
  const [newTopicNotes, setNewTopicNotes] = useState('');

  // Prompt generado
  const [copiedPromptType, setCopiedPromptType] = useState<string | null>(null);
  const [customPromptResult, setCustomPromptResult] = useState<string | null>(
    null
  );

  const envMeta = CALENDAR_ENVIRONMENTS[activeCalendar];

  const activeList = allSubCategoriesOfActiveCalendar.filter(
    (s) => !s.archived
  );
  const archivedList = allSubCategoriesOfActiveCalendar.filter(
    (s) => s.archived
  );

  const selectedSubject = allSubCategoriesOfActiveCalendar.find(
    (s) => s.id === selectedSubjectId
  );

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newShortCode.trim()) return;

    const created = onAddSubCategory({
      calendarType: activeCalendar,
      name: newName.trim(),
      shortCode: newShortCode.trim().toUpperCase(),
      colorHex: newColorHex,
      description: newDescription.trim() || undefined,
      archived: false,
      syllabusTopics: [],
    });

    setIsCreating(false);
    setNewName('');
    setNewShortCode('');
    setNewDescription('');
    setSelectedSubjectId(created.id);
  };

  const handleAddTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !newTopicTitle.trim()) return;

    onAddSyllabusTopic(
      selectedSubject.id,
      newTopicTitle.trim(),
      newTopicPriority,
      newTopicHours || undefined,
      newTopicNotes.trim() || undefined
    );

    setNewTopicTitle('');
    setNewTopicNotes('');
  };

  const handleCopyPrompt = (
    mode: 'deep_dive' | 'exam_prep' | 'code_practice' | 'flashcards' | 'notebooklm',
    topicTitle: string
  ) => {
    if (!selectedSubject) return;
    const prompt = generateGeminiStudyPrompt(
      selectedSubject.name,
      topicTitle,
      mode
    );
    navigator.clipboard.writeText(prompt);
    setCustomPromptResult(prompt);
    setCopiedPromptType(`${mode}-${topicTitle}`);
    setTimeout(() => setCopiedPromptType(null), 3000);
  };

  const handleExportRoadmap = () => {
    if (!selectedSubject) return;
    const relatedEvents = events.filter(
      (e) => e.subCategoryId === selectedSubject.id
    );
    const md = exportRoadmapMarkdown(selectedSubject, relatedEvents);
    triggerFileDownload(
      `Roadmap-${selectedSubject.shortCode}.md`,
      md,
      'text/markdown;charset=utf-8'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: envMeta.accentHex }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
            >
              {activeCalendar === 'academico' ? (
                <GraduationCap className="w-5 h-5" />
              ) : activeCalendar === 'scout' ? (
                <Compass className="w-5 h-5" />
              ) : (
                <Briefcase className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Gestor de {envMeta.subCategoryLabel} & Roadmap
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800/60">
                  {envMeta.title}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alta, baja, archivo y plan de estudio con checklist interactivo
                y prompts para Gemini / NotebookLM
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo con 2 columnas (Lista y Detalle de Roadmap) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Columna Izquierda: Listado de Materias */}
          <div className="md:col-span-5 border-r border-slate-200/80 dark:border-slate-800 flex flex-col min-h-0 bg-slate-50/30 dark:bg-slate-950/20">
            {/* Solapas Activas vs Archivadas + Botón Crear */}
            <div className="p-3 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
              <div className="inline-flex rounded-xl p-1 bg-slate-200/60 dark:bg-slate-800/80 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('active');
                    setSelectedSubjectId(null);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'active'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Activas ({activeList.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('archived');
                    setSelectedSubjectId(null);
                  }}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeTab === 'archived'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Archivadas ({archivedList.length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva</span>
              </button>
            </div>

            {/* Formulario de Alta si isCreating es true */}
            {isCreating && (
              <form
                onSubmit={handleCreateSubmit}
                className="p-3 m-3 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-500/40 shadow-sm space-y-2.5 animate-in slide-in-from-top-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Dar de alta {envMeta.subCategoryLabel.slice(0, -1)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancelar
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Nombre completo (ej: Base de Datos)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Código (ej: BD-UNGS)"
                    value={newShortCode}
                    onChange={(e) => setNewShortCode(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs uppercase font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />

                  {/* Selector de color */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    {PRESET_COLOR_SWATCHES.slice(0, 5).map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setNewColorHex(hex)}
                        style={{ backgroundColor: hex }}
                        className={`w-5 h-5 rounded-full shrink-0 transition-transform ${
                          newColorHex === hex
                            ? 'scale-125 ring-2 ring-indigo-500'
                            : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Descripción corta opcional"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none"
                />

                <button
                  type="submit"
                  className="w-full py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Guardar y Crear
                </button>
              </form>
            )}

            {/* Lista scrollable */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {(activeTab === 'active' ? activeList : archivedList).map(
                (item) => {
                  const topics = item.syllabusTopics || [];
                  const doneCount = topics.filter((t) => t.completed).length;
                  const percent =
                    topics.length > 0
                      ? Math.round((doneCount / topics.length) * 100)
                      : 0;
                  const isSelected = selectedSubjectId === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSubjectId(item.id)}
                      className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/20'
                          : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            style={{ backgroundColor: item.colorHex }}
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          />
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase shrink-0">
                          {item.shortCode}
                        </span>
                      </div>

                      {/* Barra de progreso de temas */}
                      <div className="mt-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            {topics.length > 0
                              ? `${doneCount}/${topics.length} temas completados`
                              : 'Sin temario cargado'}
                          </span>
                          {topics.length > 0 && (
                            <span className="font-semibold">{percent}%</span>
                          )}
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            style={{
                              width: `${percent}%`,
                              backgroundColor: item.colorHex,
                            }}
                            className="h-full rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>

                      {/* Botones de acción rápida */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSubCategoryForCalendar(item.id);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <CalendarIcon className="w-3 h-3" />
                          <span>Ver en Calendario</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleArchiveSubCategory(item.id);
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
                              item.archived
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-amber-600'
                            }`}
                            title={item.archived ? 'Restaurar / Desarchivar' : 'Archivar para no mostrar'}
                          >
                            {item.archived ? (
                              <>
                                <ArchiveRestore className="w-3 h-3 text-emerald-600" />
                                <span>Restaurar</span>
                              </>
                            ) : (
                              <>
                                <Archive className="w-3 h-3" />
                                <span>Archivar</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                confirm(
                                  `¿Eliminar definitivamente ${item.name}?`
                                )
                              ) {
                                onDeleteSubCategory(item.id);
                                if (selectedSubjectId === item.id) {
                                  setSelectedSubjectId(null);
                                }
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Eliminar materia de forma permanente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}

              {(activeTab === 'active' ? activeList : archivedList).length ===
                0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  No hay {envMeta.subCategoryLabel.toLowerCase()}{' '}
                  {activeTab === 'active' ? 'activas' : 'archivadas'}.
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Detalle de "Cómo Seguir", Temario y Generador de Prompts */}
          <div className="md:col-span-7 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-y-auto p-4 sm:p-5 space-y-4">
            {selectedSubject ? (
              <>
                {/* Cabecera de la materia seleccionada */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{ backgroundColor: selectedSubject.colorHex }}
                      className="w-4 h-4 rounded-full shadow-sm shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                        {selectedSubject.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {selectedSubject.description || 'Sin descripción'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleArchiveSubCategory(selectedSubject.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                        selectedSubject.archived
                          ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      }`}
                      title={selectedSubject.archived ? 'Volver a mostrar en el calendario' : 'Ocultar del calendario sin borrar'}
                    >
                      {selectedSubject.archived ? (
                        <>
                          <ArchiveRestore className="w-3.5 h-3.5" />
                          <span>Desarchivar / Restaurar</span>
                        </>
                      ) : (
                        <>
                          <Archive className="w-3.5 h-3.5" />
                          <span>Archivar (Ocultar)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `¿Estás seguro de que deseas eliminar definitivamente "${selectedSubject.name}"?`
                          )
                        ) {
                          onDeleteSubCategory(selectedSubject.id);
                          setSelectedSubjectId(null);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-all"
                      title="Eliminar materia de forma permanente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Borrar</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportRoadmap}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Descargar Plan de Estudio en Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Plan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectSubCategoryForCalendar(selectedSubject.id);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>Ver en Agenda</span>
                    </button>
                  </div>
                </div>

                {/* Sección "Cómo Seguir": Checklist de Temas / Unidades */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        Cómo Seguir · Temario & Checklist
                      </h5>
                    </div>
                    <span className="text-xs text-slate-400">
                      Tildá los conceptos que vayas dominando
                    </span>
                  </div>

                  {/* Lista de Temas */}
                  <div className="space-y-2">
                    {(selectedSubject.syllabusTopics || []).map((topic, idx) => (
                      <div
                        key={topic.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          topic.completed
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-white dark:bg-slate-950 border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onToggleSyllabusTopic(selectedSubject.id, topic.id)
                            }
                            className="flex items-start gap-2.5 text-left flex-1"
                          >
                            {topic.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p
                                className={`text-xs sm:text-sm font-semibold ${
                                  topic.completed
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-900 dark:text-white'
                                }`}
                              >
                                {idx + 1}. {topic.title}
                              </p>
                              {topic.notes && (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {topic.notes}
                                </p>
                              )}
                            </div>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            {topic.targetHours && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                ~{topic.targetHours}h
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                onDeleteSyllabusTopic(
                                  selectedSubject.id,
                                  topic.id
                                )
                              }
                              className="p-1 text-slate-300 hover:text-rose-500"
                              title="Borrar tema"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Generador de Prompts para Gemini / NotebookLM por tema */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="text-slate-400 font-medium inline-flex items-center gap-1 mr-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Practicar con IA:
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopyPrompt('deep_dive', topic.title)
                            }
                            className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            {copiedPromptType === `deep_dive-${topic.title}` ? (
                              <span className="text-emerald-500 inline-flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> ¡Copiado!
                              </span>
                            ) : (
                              'Explicación profunda'
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopyPrompt('exam_prep', topic.title)
                            }
                            className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            {copiedPromptType === `exam_prep-${topic.title}` ? (
                              <span className="text-emerald-500 inline-flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> ¡Copiado!
                              </span>
                            ) : (
                              'Simular Parcial'
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopyPrompt('notebooklm', topic.title)
                            }
                            className="px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                          >
                            {copiedPromptType === `notebooklm-${topic.title}` ? (
                              <span className="text-emerald-500 inline-flex items-center gap-0.5">
                                <Check className="w-3 h-3" /> ¡Copiado!
                              </span>
                            ) : (
                              'Para NotebookLM'
                            )}
                          </button>
                        </div>
                      </div>
                    ))}

                    {(!selectedSubject.syllabusTopics ||
                      selectedSubject.syllabusTopics.length === 0) && (
                      <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                        Aún no tienes temas cargados en esta materia. Usa el
                        formulario de abajo o pídele al Agente de IA que extraiga
                        el temario de un PDF o programa.
                      </div>
                    )}
                  </div>

                  {/* Formulario para agregar nuevo tema al temario */}
                  <form
                    onSubmit={handleAddTopicSubmit}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2"
                  >
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      + Agregar Tema / Unidad al Temario
                    </span>
                    <input
                      type="text"
                      placeholder="Título del tema (ej: Redes de Flujo Máximo)"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newTopicPriority}
                        onChange={(e) =>
                          setNewTopicPriority(
                            e.target.value as 'alta' | 'media' | 'baja'
                          )
                        }
                        className="px-2 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      >
                        <option value="alta">Prioridad Alta</option>
                        <option value="media">Prioridad Media</option>
                        <option value="baja">Prioridad Baja</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Horas estimadas"
                        value={newTopicHours}
                        onChange={(e) =>
                          setNewTopicHours(parseInt(e.target.value) || 0)
                        }
                        className="px-2 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-1.5 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                    >
                      Agregar Tema al Plan
                    </button>
                  </form>
                </div>

                {/* Previsualizador de Prompt generado */}
                {customPromptResult && (
                  <div className="p-3.5 rounded-2xl bg-slate-950 text-slate-200 border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-indigo-400 font-bold">
                      <span>Prompt listo para pegar en Gemini / NotebookLM:</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(customPromptResult);
                          alert('¡Prompt copiado al portapapeles!');
                        }}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar de nuevo</span>
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-slate-300 max-h-40 overflow-y-auto">
                      {customPromptResult}
                    </pre>
                  </div>
                )}
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <BookOpen className="w-10 h-10 stroke-1 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Selecciona una materia o categoría
                </p>
                <p className="text-xs max-w-xs">
                  Podrás ver su checklist de temas, marcar lo que ya estudiaste,
                  ver el roadmap sugerido y generar prompts para Gemini o Google
                  NotebookLM.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

