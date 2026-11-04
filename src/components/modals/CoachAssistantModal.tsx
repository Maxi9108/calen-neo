'use client';

import React, { useState, useMemo } from 'react';
import {
  Bot,
  X,
  Dumbbell,
  Briefcase,
  Clock,
  Sparkles,
  Calendar as CalendarIcon,
  Bell,
  BellRing,
  Download,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Copy,
  Check,
  Send,
  Zap,
} from 'lucide-react';
import {
  CalendarEvent,
  CalendarType,
  SubCategoryTag,
  UserRoutineItem,
} from '@/types/calendar';
import {
  generateICalendar,
  generateGeminiStudyPrompt,
  triggerFileDownload,
} from '@/utils/exportAndPrompts';

interface CoachAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCalendar: CalendarType;
  events: CalendarEvent[];
  subCategories: SubCategoryTag[];
  userRoutines: UserRoutineItem[];
  onAddRoutine: (routine: Omit<UserRoutineItem, 'id'>) => void;
  onDeleteRoutine: (id: string) => void;
  notificationsEnabled: boolean;
  onRequestNotificationPermission: () => Promise<boolean>;
  onScheduleStudyEvent: (event: Omit<CalendarEvent, 'id'>) => void;
}

export function CoachAssistantModal({
  isOpen,
  onClose,
  activeCalendar,
  events,
  subCategories,
  userRoutines,
  onAddRoutine,
  onDeleteRoutine,
  notificationsEnabled,
  onRequestNotificationPermission,
  onScheduleStudyEvent,
}: CoachAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<
    'coach' | 'routines' | 'prompts' | 'downloads'
  >('coach');

  // Input de diálogo con el Coach
  const [userStatusMessage, setUserStatusMessage] = useState('');
  const [coachResponse, setCoachResponse] = useState<string | null>(null);

  // Formulario de nueva rutina
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineCategory, setRoutineCategory] = useState<
    'gimnasio' | 'trabajo' | 'estudio' | 'otro'
  >('gimnasio');
  const [routineDays, setRoutineDays] = useState<number[]>([1, 3, 5]);
  const [routineStart, setRoutineStart] = useState('18:30');
  const [routineEnd, setRoutineEnd] = useState('20:00');

  // Generador de Prompts
  const [promptSubjectId, setPromptSubjectId] = useState<string>('');
  const [promptTopicTitle, setPromptTopicTitle] = useState<string>('');
  const [promptMode, setPromptMode] = useState<
    'deep_dive' | 'exam_prep' | 'code_practice' | 'flashcards' | 'notebooklm'
  >('deep_dive');
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);

  // Notificación de agendado
  const [scheduledSuccess, setScheduledSuccess] = useState<string | null>(null);

  // Análisis de Estado y Diagnóstico
  const diagnosis = useMemo(() => {
    const activeSubs = subCategories.filter(
      (s) => s.calendarType === activeCalendar && !s.archived
    );

    const pendingEvents = events.filter(
      (e) => e.calendarType === activeCalendar && !e.completed
    );

    // Temas sin completar
    let totalTopics = 0;
    let completedTopics = 0;
    const subjectsNeedingAttention: { name: string; pendingTopics: string[]; nextExam?: string }[] = [];

    activeSubs.forEach((sub) => {
      const topics = sub.syllabusTopics || [];
      const pending = topics.filter((t) => !t.completed).map((t) => t.title);
      totalTopics += topics.length;
      completedTopics += topics.filter((t) => t.completed).length;

      const nextExam = events.find(
        (e) =>
          e.subCategoryId === sub.id &&
          (e.category === 'examen' || e.category === 'final' || e.category === 'trabajo_practico') &&
          !e.completed
      );

      if (pending.length > 0 || nextExam) {
        subjectsNeedingAttention.push({
          name: sub.name,
          pendingTopics: pending.slice(0, 3),
          nextExam: nextExam ? `${nextExam.title} (${nextExam.startDate.split('T')[0]})` : undefined,
        });
      }
    });

    return {
      activeSubsCount: activeSubs.length,
      pendingEventsCount: pendingEvents.length,
      totalTopics,
      completedTopics,
      progressPercent:
        totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      subjectsNeedingAttention,
    };
  }, [events, subCategories, activeCalendar]);

  if (!isOpen) return null;

  const handleSendStatusToCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userStatusMessage.trim()) return;

    const lower = userStatusMessage.toLowerCase();
    let advice = '';

    if (lower.includes('gimnasio') || lower.includes('entrenar') || lower.includes('cansado')) {
      advice = `¡Excelente que mantengas tu rutina física! El descanso y el gimnasio son fundamentales para el rendimiento cognitivo. Te sugiero aprovechar bloques de estudio de 45 minutos antes de entrenar, o bien una sesión de repaso suave post-entrenamiento (20:30 a 21:30) enfocándote en los conceptos que tienes pendientes en ${diagnosis.subjectsNeedingAttention[0]?.name || 'tus materias'}.`;
    } else if (lower.includes('atrasado') || lower.includes('no llego') || lower.includes('parcial')) {
      advice = `Tranquilo. Vamos a priorizar: según tu calendario, te recomiendo hacer foco exclusivo en ${diagnosis.subjectsNeedingAttention[0]?.name || 'tu entrega más cercana'}. Deja las lecturas complementarias para después y genera un prompt con Gemini para que te haga preguntas clave de examen de los temas que aún no tildaste.`;
    } else {
      advice = `¡Tomado nota! Según tus registros, llevas un ${diagnosis.progressPercent}% del temario completado. Te recomiendo apartar hoy 1 hora y media para avanzar con: "${diagnosis.subjectsNeedingAttention[0]?.pendingTopics[0] || 'repaso general'}" y tildarlo en tu roadmap para mantener el ritmo.`;
    }

    setCoachResponse(advice);
  };

  const handleAddRoutineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineTitle.trim()) return;
    onAddRoutine({
      title: routineTitle.trim(),
      category: routineCategory,
      daysOfWeek: routineDays,
      startTime: routineStart,
      endTime: routineEnd,
    });
    setRoutineTitle('');
  };

  const toggleDay = (dayIndex: number) => {
    if (routineDays.includes(dayIndex)) {
      setRoutineDays(routineDays.filter((d) => d !== dayIndex));
    } else {
      setRoutineDays([...routineDays, dayIndex].sort());
    }
  };

  const handleGeneratePrompt = () => {
    const sub = subCategories.find((s) => s.id === promptSubjectId);
    const subName = sub ? sub.name : 'Materia Universitaria UNGS';
    const topic = promptTopicTitle.trim() || 'Temario General y Algoritmos';

    const p = generateGeminiStudyPrompt(subName, topic, promptMode);
    setGeneratedPrompt(p);
  };

  const handleCopyPrompt = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 3000);
  };

  const handleScheduleRecommendedSlot = (subjectName: string, topicName: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');

    const startISO = `${yyyy}-${mm}-${dd}T19:00`;
    const endISO = `${yyyy}-${mm}-${dd}T20:30`;

    onScheduleStudyEvent({
      title: `Bloque de Estudio: ${subjectName} · ${topicName}`,
      description: `Sesión de práctica recomendada por el Coach Calen-Neo para hacer hincapié en el tema antes del examen.`,
      startDate: startISO,
      endDate: endISO,
      calendarType: activeCalendar,
      category: 'tarea',
      status: 'pendiente',
      completed: false,
      origin: 'agente_ia',
    });

    setScheduledSuccess(`¡Bloque agendado para mañana de 19:00 a 20:30!`);
    setTimeout(() => setScheduledSuccess(null), 4000);
  };

  const DAYS_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Cabecera del Coach */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 dark:from-indigo-950/40 dark:via-slate-900 dark:to-sky-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Coach Calen-Neo · Asistente de Organización y Estudio
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seguimiento de materias, rutinas (gimnasio/trabajo), recomendaciones de horarios y prompts para Gemini / NotebookLM
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

        {/* Selector de Solapas */}
        <div className="px-5 pt-3 border-b border-slate-200/80 dark:border-slate-800 flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('coach')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'coach'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>1. Diagnóstico & Coach</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('routines')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'routines'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-4 h-4" />
            <span>2. Mis Rutinas (Gym / Trabajo)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prompts')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'prompts'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>3. Prompts Gemini / NotebookLM</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('downloads')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'downloads'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>4. Descargas & Notificaciones</span>
          </button>
        </div>

        {/* Contenido según Solapa */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: DIAGNÓSTICO Y DIÁLOGO CON EL COACH */}
          {activeTab === 'coach' && (
            <div className="space-y-4">
              {/* Tarjetas de estado rápido */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60">
                  <span className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                    Progreso Temario
                  </span>
                  <p className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
                    {diagnosis.progressPercent}%
                  </p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400">
                    {diagnosis.completedTopics}/{diagnosis.totalTopics} temas listos
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60">
                  <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
                    Eventos Pendientes
                  </span>
                  <p className="text-xl font-bold text-amber-900 dark:text-amber-100">
                    {diagnosis.pendingEventsCount}
                  </p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">
                    en {activeCalendar}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                    Rutinas Semanales
                  </span>
                  <p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                    {userRoutines.length}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    bloques protegidos
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-800/60">
                  <span className="text-[11px] font-medium text-sky-700 dark:text-sky-300">
                    Notificaciones
                  </span>
                  <p className="text-xl font-bold text-sky-900 dark:text-sky-100">
                    {notificationsEnabled ? 'Activas' : 'Inactivas'}
                  </p>
                  <p className="text-[10px] text-sky-600 dark:text-sky-400">
                    alertas del navegador
                  </p>
                </div>
              </div>

              {/* Mensaje proactivo del Coach: En qué hacer hincapié */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Diagnóstico del Coach: En qué hacer hincapié hoy
                  </h4>
                </div>

                <div className="space-y-2">
                  {diagnosis.subjectsNeedingAttention.map((sub, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {sub.name}
                          </span>
                          {sub.nextExam && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 font-semibold">
                              Próximo: {sub.nextExam}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Temas prioritarios a reforzar:{' '}
                          <span className="text-slate-700 dark:text-slate-300 font-medium">
                            {sub.pendingTopics.join(', ') || 'Repasar ejercicios prácticos'}
                          </span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleScheduleRecommendedSlot(
                            sub.name,
                            sub.pendingTopics[0] || 'Práctica'
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 shrink-0"
                      >
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>Agendar Bloque Sugerido</span>
                      </button>
                    </div>
                  ))}
                </div>

                {scheduledSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{scheduledSuccess}</span>
                  </div>
                )}
              </div>

              {/* Chat / Check-in del usuario */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Contale al Coach cómo venís con tus tiempos
                </h4>
                <p className="text-xs text-slate-500">
                  Decile qué hiciste hoy (ej: <em>"Fui al gimnasio y trabajé hasta las 18, estoy cansado para avanzar con programación"</em> o <em>"Rindo el parcial la semana que viene y no llego con los temas"</em>):
                </p>

                <form onSubmit={handleSendStatusToCoach} className="flex gap-2">
                  <input
                    type="text"
                    value={userStatusMessage}
                    onChange={(e) => setUserStatusMessage(e.target.value)}
                    placeholder="Escribí aquí cómo venís hoy con tus tiempos..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Consultar</span>
                  </button>
                </form>

                {coachResponse && (
                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                      <Bot className="w-4 h-4" />
                      <span>Respuesta y recomendación personalizada del Coach:</span>
                    </div>
                    <p>{coachResponse}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RUTINAS DEL USUARIO (GYM, TRABAJO, ETC) */}
          {activeTab === 'routines' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Tus Actividades Fijas y Rutinas
                  </h4>
                  <p className="text-xs text-slate-500">
                    Definí tus bloques de gimnasio, horario laboral y otras ocupaciones para que el bot recomiende horarios de estudio sin superponerse.
                  </p>
                </div>
              </div>

              {/* Lista de Rutinas cargadas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {userRoutines.map((routine) => (
                  <div
                    key={routine.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {routine.category === 'gimnasio' ? (
                          <Dumbbell className="w-4 h-4 text-emerald-500" />
                        ) : routine.category === 'trabajo' ? (
                          <Briefcase className="w-4 h-4 text-sky-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {routine.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {routine.startTime} a {routine.endTime} hs
                        </span>
                      </div>

                      {/* Días activos */}
                      <div className="flex gap-1 pt-1">
                        {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, idx) => (
                          <span
                            key={idx}
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              routine.daysOfWeek.includes(idx)
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteRoutine(routine.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                      title="Eliminar rutina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Formulario para agregar rutina */}
              <form
                onSubmit={handleAddRoutineSubmit}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                  + Agregar Nueva Actividad / Rutina Recurrente
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Título (ej: Gimnasio / Crossfit / Trabajo)"
                    value={routineTitle}
                    onChange={(e) => setRoutineTitle(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none"
                    required
                  />

                  <select
                    value={routineCategory}
                    onChange={(e) =>
                      setRoutineCategory(
                        e.target.value as 'gimnasio' | 'trabajo' | 'estudio' | 'otro'
                      )
                    }
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <option value="gimnasio">Gimnasio / Deporte</option>
                    <option value="trabajo">Trabajo / Guardias</option>
                    <option value="estudio">Horario Fijo de Cursada</option>
                    <option value="otro">Otra Actividad</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 mr-1">Días:</span>
                    {DAYS_LABELS.map((day, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          routineDays.includes(idx)
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={routineStart}
                      onChange={(e) => setRoutineStart(e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                    <span className="text-xs text-slate-400">a</span>
                    <input
                      type="time"
                      value={routineEnd}
                      onChange={(e) => setRoutineEnd(e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                >
                  Guardar Rutina
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: GENERADOR DE PROMPTS GEMINI / NOTEBOOKLM */}
          {activeTab === 'prompts' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Generador de Prompts Especializados para Gemini y NotebookLM
                </h4>
                <p className="text-xs text-slate-500">
                  Crea prompts pedagógicos estructurados para llevar directamente a Gemini o Google NotebookLM y practicar tus materias UNGS o temas específicos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Materia o Categoría:
                    </label>
                    <select
                      value={promptSubjectId}
                      onChange={(e) => setPromptSubjectId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <option value="">Seleccionar materia...</option>
                      {subCategories
                        .filter((s) => s.calendarType === activeCalendar)
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.shortCode})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Objetivo de Aprendizaje:
                    </label>
                    <select
                      value={promptMode}
                      onChange={(e) =>
                        setPromptMode(
                          e.target.value as
                            | 'deep_dive'
                            | 'exam_prep'
                            | 'code_practice'
                            | 'flashcards'
                            | 'notebooklm'
                        )
                      }
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <option value="deep_dive">Explicación conceptual profunda (con analogías)</option>
                      <option value="exam_prep">Simulación de Examen Parcial (con calificación)</option>
                      <option value="code_practice">Ejercicios de Programación y Complejidad</option>
                      <option value="flashcards">Set de Tarjetas de Memoria (Flashcards)</option>
                      <option value="notebooklm">Nota de Investigación para Google NotebookLM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Tema o Concepto Puntual:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Redes de Flujo Máximo, Patrones de Diseño, Concurrencia..."
                    value={promptTopicTitle}
                    onChange={(e) => setPromptTopicTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGeneratePrompt}
                  className="w-full py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generar Prompt para Gemini</span>
                </button>
              </div>

              {generatedPrompt && (
                <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 border border-slate-800 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400">
                      Prompt Generado:
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPrompt}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                    >
                      {promptCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Prompt</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-slate-300 leading-relaxed max-h-56 overflow-y-auto">
                    {generatedPrompt}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DESCARGAS Y NOTIFICACIONES */}
          {activeTab === 'downloads' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Exportación, Descargas y Alertas del Sistema
                </h4>
                <p className="text-xs text-slate-500">
                  Descargá tu agenda para Google Calendar / Outlook y activá notificaciones en el navegador.
                </p>
              </div>

              {/* Notificaciones del Navegador */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                    {notificationsEnabled ? (
                      <BellRing className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Bell className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Notificaciones en el Navegador
                    </h5>
                    <p className="text-xs text-slate-500">
                      {notificationsEnabled
                        ? 'Las notificaciones están activadas. Recibirás avisos de entregas y check-in.'
                        : 'Permite que Calen-Neo te avise de entregas, parciales y recordatorios.'}
                    </p>
                  </div>
                </div>

                {!notificationsEnabled && (
                  <button
                    type="button"
                    onClick={onRequestNotificationPermission}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shrink-0"
                  >
                    Activar
                  </button>
                )}
              </div>

              {/* Exportación iCalendar (.ics) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Descargar Calendario Completo (.ics)
                    </h5>
                    <p className="text-xs text-slate-500">
                      Compatible con Google Calendar, Apple Calendar y Outlook.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const ics = generateICalendar(events);
                    triggerFileDownload('Calen-Neo-Eventos.ics', ics, 'text/calendar;charset=utf-8');
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shrink-0 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .ics</span>
                </button>
              </div>

              {/* Exportación JSON */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Copia de Seguridad JSON
                    </h5>
                    <p className="text-xs text-slate-500">
                      Descarga todos tus eventos, materias y rutinas en un archivo JSON estructurado.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const backup = {
                      calenNeoVersion: '1.0.0',
                      exportedAt: new Date().toISOString(),
                      eventos: events,
                      materias: subCategories,
                      rutinas: userRoutines,
                    };
                    triggerFileDownload(
                      'Calen-Neo-Backup.json',
                      JSON.stringify(backup, null, 2),
                      'application/json;charset=utf-8'
                    );
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shrink-0"
                >
                  Descargar JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
