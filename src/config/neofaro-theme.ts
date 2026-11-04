import {
  BackgroundStyleId,
  CalendarEnvironmentMeta,
  CalendarEvent,
  CalendarType,
  EventCategory,
  EventOrigin,
  EventStatus,
  SubCategoryTag,
} from '@/types/calendar';

export const CALENDAR_ORDER: CalendarType[] = ['academico', 'scout', 'trabajo'];

export const CALENDAR_ENVIRONMENTS: Record<CalendarType, CalendarEnvironmentMeta> = {
  academico: {
    id: 'academico',
    title: 'Calendario Académico',
    subtitle: 'Universidad Nacional de General Sarmiento (UNGS)',
    institutionTag: 'UNGS · Lic. en Sistemas',
    subCategoryLabel: 'Materias UNGS',
    accentHex: '#4F46E5',
    badgeClasses:
      'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/70',
    activeTabClasses:
      'bg-indigo-600 text-white shadow-neofaro-glow-indigo border-indigo-500',
    ringClasses: 'focus:ring-indigo-500/30 border-indigo-500/40',
    glowClass: 'from-indigo-500/15 via-cyan-500/5 to-transparent',
    headerGradient: 'from-indigo-600 to-cyan-500',
  },
  scout: {
    id: 'scout',
    title: 'Calendario Scout',
    subtitle: 'Planificación de Ciclo de Programa, Sábados y Campamentos',
    institutionTag: 'Grupo Scout · Ciclo Anual',
    subCategoryLabel: 'Ramas Scout',
    accentHex: '#10B981',
    badgeClasses:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/70',
    activeTabClasses:
      'bg-emerald-600 text-white shadow-neofaro-glow-emerald border-emerald-500',
    ringClasses: 'focus:ring-emerald-500/30 border-emerald-500/40',
    glowClass: 'from-emerald-500/15 via-amber-500/5 to-transparent',
    headerGradient: 'from-emerald-600 to-amber-500',
  },
  trabajo: {
    id: 'trabajo',
    title: 'Calendario de Trabajo',
    subtitle: 'Entorno Corporativo, Sprints, Entregas y Seguimiento Operativo',
    institutionTag: 'Calen-Neo Workspace',
    subCategoryLabel: 'Categorías Laborales',
    accentHex: '#0284C7',
    badgeClasses:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/70',
    activeTabClasses:
      'bg-sky-600 text-white shadow-neofaro-glow-sky border-sky-500',
    ringClasses: 'focus:ring-sky-500/30 border-sky-500/40',
    glowClass: 'from-sky-500/15 via-slate-500/5 to-transparent',
    headerGradient: 'from-sky-700 to-slate-700',
  },
};

export const EVENT_CATEGORY_META: Record<
  EventCategory,
  {
    label: string;
    shortLabel: string;
    badgeBg: string;
    dotColor: string;
    description: string;
  }
> = {
  actividad: {
    label: 'Actividad',
    shortLabel: 'ACT',
    badgeBg:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
    dotColor: '#10B981',
    description: 'Actividad presencial, taller o jornada de programa',
  },
  trabajo_practico: {
    label: 'Trabajo Práctico',
    shortLabel: 'TP',
    badgeBg:
      'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
    dotColor: '#6366F1',
    description: 'Entrega grupal o individual de cátedra',
  },
  tarea: {
    label: 'Tarea',
    shortLabel: 'TAR',
    badgeBg:
      'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20',
    dotColor: '#0EA5E9',
    description: 'Tarea operativa, guía de ejercicios o entregable',
  },
  examen: {
    label: 'Examen / Parcial',
    shortLabel: 'EXA',
    badgeBg:
      'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25',
    dotColor: '#F43F5E',
    description: 'Instancia de evaluación parcial o recuperatorio',
  },
  final: {
    label: 'Examen Final',
    shortLabel: 'FIN',
    badgeBg:
      'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25',
    dotColor: '#A855F7',
    description: 'Mesa de examen final o defensa integradora',
  },
  charla: {
    label: 'Charla / Seminario',
    shortLabel: 'CHA',
    badgeBg:
      'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25',
    dotColor: '#F59E0B',
    description: 'Charla académica, reunión técnica o fogón temático',
  },
  evento_con_puntos: {
    label: 'Evento con Puntos',
    shortLabel: 'PTS',
    badgeBg:
      'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/25',
    dotColor: '#D946EF',
    description: 'Evento con seguimiento de puntaje, créditos o insignias',
  },
  lecturas: {
    label: 'Lecturas',
    shortLabel: 'LEC',
    badgeBg:
      'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25',
    dotColor: '#14B8A6',
    description: 'Bibliografía obligatoria, papers o documentación técnica',
  },
};

export const EVENT_STATUS_META: Record<
  EventStatus,
  {
    label: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  pendiente: {
    label: 'Pendiente',
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
    dotClass: 'bg-amber-500',
  },
  en_proceso: {
    label: 'En Proceso',
    badgeClass:
      'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60',
    dotClass: 'bg-sky-500 animate-pulse',
  },
  completado: {
    label: 'Completado',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    dotClass: 'bg-emerald-500',
  },
  aprobado: {
    label: 'Aprobado',
    badgeClass:
      'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60',
    dotClass: 'bg-indigo-500',
  },
};

export const EVENT_ORIGIN_META: Record<
  EventOrigin,
  { label: string; badge: string }
> = {
  manual: {
    label: 'Manual',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
  agente_ia: {
    label: 'Agente IA (FastAPI)',
    badge:
      'bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300 border border-violet-300/50 dark:border-violet-700/50',
  },
  campus_ungs: {
    label: 'Campus UNGS',
    badge:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300',
  },
  sincronizado: {
    label: 'Sincronizado',
    badge:
      'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/80 dark:text-cyan-300',
  },
};

export const DEFAULT_USER_ROUTINES: import('@/types/calendar').UserRoutineItem[] = [
  {
    id: 'routine-work',
    title: 'Horario Laboral',
    category: 'trabajo',
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '18:00',
    notes: 'Bloque corporativo y reuniones',
  },
  {
    id: 'routine-gym',
    title: 'Gimnasio / Entrenamiento',
    category: 'gimnasio',
    daysOfWeek: [1, 3, 5],
    startTime: '18:30',
    endTime: '20:00',
    notes: 'Entrenamiento de fuerza y acondicionamiento',
  },
  {
    id: 'routine-scout',
    title: 'Actividad Scout de Sábados',
    category: 'otro',
    daysOfWeek: [6],
    startTime: '14:30',
    endTime: '18:30',
    notes: 'Encuentro semanal en el patio de grupo',
  },
];

export const DEFAULT_SUBCATEGORIES: SubCategoryTag[] = [
  // Materias Académicas (UNGS)
  {
    id: 'ungs-prog3',
    calendarType: 'academico',
    name: 'Programación III',
    shortCode: 'PROG-III',
    colorHex: '#4F46E5',
    description: 'Grafos, complejidad y diseño de algoritmos',
    archived: false,
    syllabusTopics: [
      {
        id: 'p3-top-1',
        title: 'Grafos y Representaciones (Matriz y Listas de Adyacencia)',
        completed: true,
        priority: 'alta',
        targetHours: 6,
        notes: 'Repasar BFS, DFS y detección de ciclos en grafos dirigidos.',
      },
      {
        id: 'p3-top-2',
        title: 'Árboles Generadores Mínimos (Kruskal & Prim)',
        completed: true,
        priority: 'alta',
        targetHours: 8,
        notes: 'Implementación con estructura Union-Find (Disjoint Set).',
      },
      {
        id: 'p3-top-3',
        title: 'Caminos Mínimos (Dijkstra, Bellman-Ford, Floyd-Warshall)',
        completed: false,
        priority: 'alta',
        targetHours: 10,
        notes: 'Hacer hincapié en pesos negativos y colas de prioridad.',
      },
      {
        id: 'p3-top-4',
        title: 'Redes de Flujo Máximo y Cortes Mínimos (Ford-Fulkerson & Edmonds-Karp)',
        completed: false,
        priority: 'alta',
        targetHours: 12,
        notes: 'Tema central de la entrega del TP2.',
      },
      {
        id: 'p3-top-5',
        title: 'Complejidad Computacional (P, NP, NP-Completo y Reducciones)',
        completed: false,
        priority: 'media',
        targetHours: 8,
        notes: 'Comprender Teorema de Cook y reducciones polinomiales.',
      },
    ],
  },
  {
    id: 'ungs-inge1',
    calendarType: 'academico',
    name: 'Ingeniería de Software I',
    shortCode: 'ISW-I',
    colorHex: '#0891B2',
    description: 'Requerimientos, arquitectura y metodologías ágiles',
    archived: false,
    syllabusTopics: [
      {
        id: 'isw-top-1',
        title: 'Ingeniería de Requerimientos y Casos de Uso Extendidos',
        completed: true,
        priority: 'media',
        targetHours: 6,
      },
      {
        id: 'isw-top-2',
        title: 'Patrones de Diseño GoF (Creacionales, Estructurales, Comportamiento)',
        completed: false,
        priority: 'alta',
        targetHours: 10,
        notes: 'Hacer hincapié para el 2do parcial: Factory, Observer, Strategy.',
      },
      {
        id: 'isw-top-3',
        title: 'Arquitectura Limpia (Hexagonal / Clean Architecture) y DDD',
        completed: false,
        priority: 'alta',
        targetHours: 8,
      },
      {
        id: 'isw-top-4',
        title: 'Metodologías Ágiles (Scrum, Kanban, Estimación con Story Points)',
        completed: true,
        priority: 'media',
        targetHours: 4,
      },
    ],
  },
  {
    id: 'ungs-evs',
    calendarType: 'academico',
    name: 'Especificación y Verif. de SW',
    shortCode: 'EVS',
    colorHex: '#9333EA',
    description: 'Lógica formal, contratos y testing automatizado',
    archived: false,
    syllabusTopics: [
      {
        id: 'evs-top-1',
        title: 'Diseño por Contratos (Precondiciones, Postcondiciones e Invariantes)',
        completed: true,
        priority: 'alta',
        targetHours: 6,
      },
      {
        id: 'evs-top-2',
        title: 'Model Checking y Lógica Temporal (LTL / CTL)',
        completed: false,
        priority: 'alta',
        targetHours: 12,
        notes: 'Lectura de Lamport y modelado de exclusión mutua en TLA+.',
      },
      {
        id: 'evs-top-3',
        title: 'Testing Automatizado: Cobertura de Código, Mutación y BDD',
        completed: false,
        priority: 'media',
        targetHours: 8,
      },
    ],
  },
  {
    id: 'ungs-sor',
    calendarType: 'academico',
    name: 'Sistemas Operativos y Redes',
    shortCode: 'SOR',
    colorHex: '#E11D48',
    description: 'Concurrencia, memoria virtual y protocolos TCP/IP',
    archived: false,
    syllabusTopics: [
      {
        id: 'sor-top-1',
        title: 'Sincronización de Procesos (Semáforos, Monitores y Deadlock)',
        completed: false,
        priority: 'alta',
        targetHours: 10,
      },
      {
        id: 'sor-top-2',
        title: 'Gestión de Memoria Virtual (Paginación, Segmentación y TLB)',
        completed: false,
        priority: 'alta',
        targetHours: 8,
      },
      {
        id: 'sor-top-3',
        title: 'Arquitectura TCP/IP y Ruteo Dinámico (OSPF, BGP)',
        completed: false,
        priority: 'media',
        targetHours: 8,
      },
    ],
  },
  {
    id: 'ungs-creditos',
    calendarType: 'academico',
    name: 'Seminarios / Puntos Académicos',
    shortCode: 'SEM-UNGS',
    colorHex: '#D946EF',
    description: 'Actividades acreditables con puntaje de carrera',
    archived: false,
    syllabusTopics: [
      {
        id: 'sem-top-1',
        title: 'Jornadas de Investigación en Informática (ICI)',
        completed: true,
        priority: 'media',
        targetHours: 4,
      },
      {
        id: 'sem-top-2',
        title: 'Taller de Ética en Inteligencia Artificial y Datos',
        completed: false,
        priority: 'media',
        targetHours: 6,
      },
    ],
  },

  // Ramas Scout
  {
    id: 'scout-manada',
    calendarType: 'scout',
    name: 'Rama Manada (Lobatos)',
    shortCode: 'MANADA',
    colorHex: '#F59E0B',
    description: 'Actividades y acantonamientos de Manada',
  },
  {
    id: 'scout-unidad',
    calendarType: 'scout',
    name: 'Unidad Scout',
    shortCode: 'UNIDAD',
    colorHex: '#10B981',
    description: 'Patrullas, vida en la naturaleza y técnica scout',
  },
  {
    id: 'scout-caminantes',
    calendarType: 'scout',
    name: 'Rama Caminantes',
    shortCode: 'CAMINANTES',
    colorHex: '#0284C7',
    description: 'Empresas, raids y proyectos comunitarios',
  },
  {
    id: 'scout-rovers',
    calendarType: 'scout',
    name: 'Rama Rovers',
    shortCode: 'ROVERS',
    colorHex: '#E11D48',
    description: 'Servicio, rutas y proyectos rover',
  },
  {
    id: 'scout-grupo',
    calendarType: 'scout',
    name: 'Consejo de Grupo / Campamento',
    shortCode: 'GRUPO',
    colorHex: '#7C3AED',
    description: 'Eventos generales de Sábado a Sábado y Consejos',
  },

  // Categorías Laborales
  {
    id: 'work-dev',
    calendarType: 'trabajo',
    name: 'Desarrollo & Sprints',
    shortCode: 'DEV-SPRINT',
    colorHex: '#0284C7',
    description: 'Entregables de código, PRs y objetivos de sprint',
  },
  {
    id: 'work-ops',
    calendarType: 'trabajo',
    name: 'Arquitectura & Backend API',
    shortCode: 'ARCH-API',
    colorHex: '#475569',
    description: 'Integración FastAPI, despliegues e infraestructura',
  },
  {
    id: 'work-release',
    calendarType: 'trabajo',
    name: 'Releases & Demos',
    shortCode: 'RELEASE',
    colorHex: '#0D9488',
    description: 'Hitos de producto y presentaciones con stakeholders',
  },
  {
    id: 'work-training',
    calendarType: 'trabajo',
    name: 'Capacitación & OKRs',
    shortCode: 'OKR-PRO',
    colorHex: '#7C3AED',
    description: 'Objetivos trimestrales con puntaje y formación',
  },
];

export const BACKGROUND_STYLES: Record<
  BackgroundStyleId,
  {
    name: string;
    description: string;
    containerClass: string;
  }
> = {
  'neofaro-clean': {
    name: 'Minimal Clean',
    description: 'Superficie limpia de alto contraste sin textura',
    containerClass: 'bg-white dark:bg-slate-900',
  },
  'neofaro-grid': {
    name: 'Cuadrícula Técnica',
    description: 'Trama arquitectónica sutil estilo blueprint',
    containerClass: 'bg-white dark:bg-slate-900 neofaro-bg-grid',
  },
  'neofaro-dots': {
    name: 'Matriz de Puntos',
    description: 'Patrón de puntos finos para foco visual',
    containerClass: 'bg-white dark:bg-slate-900 neofaro-bg-dots',
  },
  'neofaro-aurora': {
    name: 'Aurora Académica',
    description: 'Degradado ambiental suave superior',
    containerClass:
      'bg-gradient-to-br from-indigo-50/50 via-white to-cyan-50/40 dark:from-indigo-950/30 dark:via-slate-900 dark:to-cyan-950/20',
  },
  'neofaro-scout-topo': {
    name: 'Brisa Scout',
    description: 'Tono orgánico esmeralda/ámbar suave para aire libre',
    containerClass:
      'bg-gradient-to-br from-emerald-50/50 via-white to-amber-50/40 dark:from-emerald-950/30 dark:via-slate-900 dark:to-amber-950/20 neofaro-bg-dots',
  },
  'neofaro-exec': {
    name: 'Ejecutivo Sobrio',
    description: 'Acabado pizarra corporativo para entorno laboral',
    containerClass:
      'bg-gradient-to-b from-slate-50/90 to-white dark:from-slate-900 dark:to-slate-950 neofaro-bg-grid',
  },
};

export const PRESET_COLOR_SWATCHES = [
  '#4F46E5', // Indigo
  '#0284C7', // Sky
  '#0891B2', // Cyan
  '#10B981', // Emerald
  '#0D9488', // Teal
  '#F59E0B', // Amber
  '#EA580C', // Orange
  '#E11D48', // Rose
  '#9333EA', // Purple
  '#D946EF', // Fuchsia
  '#475569', // Slate
];

/**
 * Genera eventos iniciales realistas anclados al mes actual
 * incluyendo eventos de Sábado a Sábado para Scout, materias de la UNGS y entregas laborales.
 */
export function buildInitialSeedEvents(referenceDate: Date = new Date()): CalendarEvent[] {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  const fmtDate = (day: number, hour = 9, minute = 0) => {
    const safeDay = Math.max(1, Math.min(28, day));
    const d = new Date(year, month, safeDay, hour, minute);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // Buscamos el primer y segundo sábado del mes para el evento "Sábado a Sábado"
  let firstSaturday = 1;
  for (let d = 1; d <= 7; d++) {
    const testDate = new Date(year, month, d);
    if (testDate.getDay() === 6) {
      firstSaturday = d;
      break;
    }
  }
  const secondSaturday = firstSaturday + 7;
  const thirdSaturday = firstSaturday + 14;

  return [
    // ================= ACADÉMICO (UNGS) =================
    {
      id: 'evt-ungs-1',
      title: 'Entrega TP2: Grafos y Flujo Máximo',
      description:
        'Implementación en Java/TypeScript con informe de complejidad temporal y casos de test JUnit.',
      startDate: fmtDate(firstSaturday - 1 > 0 ? firstSaturday - 1 : 4, 18, 0),
      endDate: fmtDate(firstSaturday - 1 > 0 ? firstSaturday - 1 : 4, 22, 0),
      calendarType: 'academico',
      category: 'trabajo_practico',
      status: 'en_proceso',
      completed: false,
      origin: 'campus_ungs',
      subCategoryId: 'ungs-prog3',
      location: 'Campus UNGS · Módulo 7 / Lab',
    },
    {
      id: 'evt-ungs-2',
      title: '2do Parcial Presencial · Ingeniería de Software I',
      description:
        'Temas: Arquitectura limpia, patrones de diseño, BDD, estimación con Story Points.',
      startDate: fmtDate(secondSaturday - 3, 14, 0),
      endDate: fmtDate(secondSaturday - 3, 18, 0),
      calendarType: 'academico',
      category: 'examen',
      status: 'pendiente',
      completed: false,
      origin: 'agente_ia',
      subCategoryId: 'ungs-inge1',
      location: 'Aula 7024 · UNGS',
    },
    {
      id: 'evt-ungs-3',
      title: 'Jornada de Investigación en IA & Verificación Formal',
      description:
        'Participación en seminario del Instituto de Ciencias (ICI-UNGS). Suma puntos para créditos de seminario.',
      startDate: fmtDate(secondSaturday - 1, 10, 0),
      endDate: fmtDate(secondSaturday - 1, 13, 0),
      calendarType: 'academico',
      category: 'evento_con_puntos',
      status: 'aprobado',
      completed: true,
      origin: 'agente_ia',
      subCategoryId: 'ungs-creditos',
      pointsEarned: 15,
      pointsMax: 15,
      location: 'Auditorio UNGS',
    },
    {
      id: 'evt-ungs-4',
      title: 'Lectura Obligatoria: Model Checking & TLA+',
      description:
        'Capítulos 3 y 4 de Lamport. Preparar resumen de invariantes para la práctica.',
      startDate: fmtDate(firstSaturday + 2, 9, 0),
      endDate: fmtDate(firstSaturday + 3, 20, 0),
      calendarType: 'academico',
      category: 'lecturas',
      status: 'completado',
      completed: true,
      origin: 'manual',
      subCategoryId: 'ungs-evs',
    },
    {
      id: 'evt-ungs-5',
      title: 'Mesa Examen Final · Sistemas Operativos y Redes',
      description:
        'Defensa oral y práctica sobre sincronización de procesos, paginación y ruteo BGP.',
      startDate: fmtDate(thirdSaturday + 2, 9, 0),
      endDate: fmtDate(thirdSaturday + 2, 13, 0),
      calendarType: 'academico',
      category: 'final',
      status: 'pendiente',
      completed: false,
      origin: 'campus_ungs',
      subCategoryId: 'ungs-sor',
      location: 'Módulo 5 · UNGS',
    },

    // ================= SCOUT (Sábado a Sábado + Actividades) =================
    {
      id: 'evt-scout-sab-a-sab-1',
      title: 'Campamento Anual de Grupo (Sábado a Sábado)',
      description:
        'Campamento volante y fijo de 8 días completos (Sábado a Sábado). Incluye Gran Juego Nocturno, Construcciones Rústicas, Raid de Caminantes y Fogón de Promesas.',
      startDate: fmtDate(firstSaturday, 8, 0),
      endDate: fmtDate(secondSaturday, 18, 0),
      calendarType: 'scout',
      category: 'actividad',
      status: 'en_proceso',
      completed: false,
      origin: 'agente_ia',
      subCategoryId: 'scout-grupo',
      isSaturdayToSaturday: true,
      location: 'Campo Escuela Scout · Necochea / Sierra',
    },
    {
      id: 'evt-scout-2',
      title: 'Desafío de Especialidades e Insignias de Progresión',
      description:
        'Evaluación y entrega de puntos por desafíos de Pista, Primeros Auxilios y Cocina Rústica.',
      startDate: fmtDate(thirdSaturday, 14, 0),
      endDate: fmtDate(thirdSaturday, 18, 30),
      calendarType: 'scout',
      category: 'evento_con_puntos',
      status: 'pendiente',
      completed: false,
      origin: 'manual',
      subCategoryId: 'scout-unidad',
      pointsEarned: 75,
      pointsMax: 100,
      location: 'Sede del Grupo Scout',
    },
    {
      id: 'evt-scout-3',
      title: 'Semana de Servicio Rover y Logística (Sábado a Sábado)',
      description:
        'Semana completa de acondicionamiento de refugio comunitario y preparación de intendencia entre dos sábados consecutivos.',
      startDate: fmtDate(secondSaturday, 9, 0),
      endDate: fmtDate(thirdSaturday, 17, 0),
      calendarType: 'scout',
      category: 'tarea',
      status: 'completado',
      completed: true,
      origin: 'sincronizado',
      subCategoryId: 'scout-rovers',
      isSaturdayToSaturday: true,
      location: 'Base Scout & Comunidad',
    },
    {
      id: 'evt-scout-4',
      title: 'Charla de Padres y Consejo de Grupo',
      description:
        'Presentación del balance de campamento, fichas médicas y autorizaciones.',
      startDate: fmtDate(firstSaturday - 2 > 0 ? firstSaturday - 2 : 2, 19, 30),
      endDate: fmtDate(firstSaturday - 2 > 0 ? firstSaturday - 2 : 2, 21, 30),
      calendarType: 'scout',
      category: 'charla',
      status: 'aprobado',
      completed: true,
      origin: 'agente_ia',
      subCategoryId: 'scout-manada',
    },

    // ================= TRABAJO (Laboral) =================
    {
      id: 'evt-work-1',
      title: 'Integración Pipeline Agente IA ↔ FastAPI Gateway',
      description:
        'Conectar webhook de ingesta automática para parsear eventos entrantes y persistirlos en PostgreSQL.',
      startDate: fmtDate(firstSaturday - 3 > 0 ? firstSaturday - 3 : 3, 10, 0),
      endDate: fmtDate(firstSaturday - 1 > 0 ? firstSaturday - 1 : 5, 18, 0),
      calendarType: 'trabajo',
      category: 'tarea',
      status: 'en_proceso',
      completed: false,
      origin: 'agente_ia',
      subCategoryId: 'work-ops',
      location: 'Remoto / Calen-Neo Cloud',
    },
    {
      id: 'evt-work-2',
      title: 'Release v2.4 Calen-Neo & Demo con Stakeholders',
      description:
        'Presentación de métricas de rendimiento, nuevo diseño del sistema de calendarios y validación QA.',
      startDate: fmtDate(secondSaturday - 2, 11, 0),
      endDate: fmtDate(secondSaturday - 2, 12, 30),
      calendarType: 'trabajo',
      category: 'charla',
      status: 'pendiente',
      completed: false,
      origin: 'sincronizado',
      subCategoryId: 'work-release',
      location: 'Sala Meet · Principal',
    },
    {
      id: 'evt-work-3',
      title: 'OKR Trimestral: Certificación Cloud & Seguridad API',
      description:
        'Objetivo de carrera con puntos de evaluación de desempeño trimestral.',
      startDate: fmtDate(secondSaturday + 2, 9, 0),
      endDate: fmtDate(secondSaturday + 4, 18, 0),
      calendarType: 'trabajo',
      category: 'evento_con_puntos',
      status: 'aprobado',
      completed: true,
      origin: 'manual',
      subCategoryId: 'work-training',
      pointsEarned: 90,
      pointsMax: 100,
    },
  ];
}

