'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BackgroundStyleId,
  CalendarEvent,
  CalendarType,
  CalendarViewMode,
  EventCategory,
  EventStatus,
  FastAPIAgentIngestRequest,
  SubCategoryTag,
  SyllabusTopic,
  UserRoutineItem,
} from '@/types/calendar';
import {
  buildInitialSeedEvents,
  CALENDAR_ORDER,
  DEFAULT_SUBCATEGORIES,
  DEFAULT_USER_ROUTINES,
} from '@/config/neofaro-theme';
import {
  BackendConnectionMode,
  createEventInBackend,
  deleteEventFromBackend,
  fetchEventsFromBackend,
  fetchPreferencesFromBackend,
  ingestAgentPayloadToBackend,
  pushAllStateToGoogleSheets,
  savePreferencesToBackend,
  updateEventInBackend,
} from '@/services/eventService';

const STORAGE_KEYS = {
  EVENTS: 'neofaro_cal_events_v1',
  SUBCATEGORIES: 'neofaro_cal_subcategories_v1',
  BACKGROUNDS: 'neofaro_cal_backgrounds_v1',
  THEME: 'neofaro_cal_dark_mode_v1',
  GSHEETS_URL: 'neofaro_cal_gsheets_url_v1',
  ROUTINES: 'neofaro_cal_routines_v1',
  NOTIFICATIONS: 'neofaro_cal_notifications_v1',
};

export function useCalendarState() {
  const [activeCalendar, setActiveCalendar] =
    useState<CalendarType>('academico');
  const [transitionDirection, setTransitionDirection] = useState<
    'left' | 'right' | null
  >(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [darkMode, setDarkMode] = useState<boolean>(true);

  const [googleSheetsUrl, setGoogleSheetsUrl] = useState<string>(
    () => process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL || ''
  );

  const [events, setEvents] = useState<CalendarEvent[]>(() =>
    buildInitialSeedEvents(new Date())
  );
  const [subCategories, setSubCategories] = useState<SubCategoryTag[]>(
    DEFAULT_SUBCATEGORIES
  );
  const [backgroundByCalendar, setBackgroundByCalendar] = useState<
    Record<CalendarType, BackgroundStyleId>
  >({
    academico: 'neofaro-aurora',
    scout: 'neofaro-scout-topo',
    trabajo: 'neofaro-exec',
  });

  const [userRoutines, setUserRoutines] = useState<UserRoutineItem[]>(
    DEFAULT_USER_ROUTINES
  );
  const [notificationsEnabled, setNotificationsEnabled] =
    useState<boolean>(false);

  // Filtros interactivos
  const [selectedCategory, setSelectedCategory] = useState<
    EventCategory | 'all'
  >('all');
  const [selectedStatus, setSelectedStatus] = useState<EventStatus | 'all'>(
    'all'
  );
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<
    string | 'all'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAllCalendarsOverlay, setShowAllCalendarsOverlay] =
    useState<boolean>(false);

  // Estado de conexión con Backend (Google Sheets Drive / FastAPI / Bridge)
  const [backendMode, setBackendMode] =
    useState<BackendConnectionMode>('nextjs-bridge');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Hidratación inicial desde localStorage y sincronización con Google Sheets / FastAPI
  useEffect(() => {
    let storedSheetUrl = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_WEBHOOK_URL || '';

    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme !== null) {
        setDarkMode(savedTheme === 'true');
      }

      const savedSheetUrl = localStorage.getItem(STORAGE_KEYS.GSHEETS_URL);
      if (savedSheetUrl) {
        storedSheetUrl = savedSheetUrl;
        setGoogleSheetsUrl(savedSheetUrl);
      }

      const savedSubcats = localStorage.getItem(STORAGE_KEYS.SUBCATEGORIES);
      if (savedSubcats) {
        setSubCategories(JSON.parse(savedSubcats));
      }

      const savedBgs = localStorage.getItem(STORAGE_KEYS.BACKGROUNDS);
      if (savedBgs) {
        setBackgroundByCalendar(JSON.parse(savedBgs));
      }

      const savedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (savedEvents) {
        const parsed = JSON.parse(savedEvents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEvents(parsed);
        }
      }

      const savedRoutines = localStorage.getItem(STORAGE_KEYS.ROUTINES);
      if (savedRoutines) {
        const parsed = JSON.parse(savedRoutines);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUserRoutines(parsed);
        }
      }

      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationsEnabled(Notification.permission === 'granted');
      }
    } catch {
      // Ignorar errores de almacenamiento local
    }

    // Sincronizar con Google Sheets (Drive) o Backend al iniciar
    const syncInitial = async () => {
      setIsSyncing(true);
      try {
        const [eventsRes, prefsRes] = await Promise.all([
          fetchEventsFromBackend(undefined, storedSheetUrl),
          fetchPreferencesFromBackend(storedSheetUrl),
        ]);

        setBackendMode(eventsRes.mode);

        // Si viene de Google Sheets y tiene eventos cargados en la hoja, tienen prioridad
        if (
          eventsRes.mode === 'google-sheets-drive' &&
          eventsRes.events.length > 0
        ) {
          setEvents(eventsRes.events);
        } else if (
          eventsRes.events.length > 0 &&
          !localStorage.getItem(STORAGE_KEYS.EVENTS)
        ) {
          setEvents(eventsRes.events);
        }

        if (prefsRes && prefsRes.mode === 'google-sheets-drive') {
          if (prefsRes.subCategories && prefsRes.subCategories.length > 0) {
            setSubCategories(prefsRes.subCategories);
          }
          if (prefsRes.backgroundByCalendar) {
            setBackgroundByCalendar(prefsRes.backgroundByCalendar);
          }
        }
      } finally {
        setIsSyncing(false);
      }
    };

    syncInitial();
  }, []);

  // Aplicar clase dark en <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, String(darkMode));
    } catch {
      // ignore
    }
  }, [darkMode]);

  // Persistir en localStorage como caché instantánea
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    } catch {
      // ignore
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.SUBCATEGORIES,
        JSON.stringify(subCategories)
      );
    } catch {
      // ignore
    }
  }, [subCategories]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.BACKGROUNDS,
        JSON.stringify(backgroundByCalendar)
      );
    } catch {
      // ignore
    }
  }, [backgroundByCalendar]);

  const updateGoogleSheetsUrl = useCallback(async (url: string) => {
    const clean = url.trim();
    setGoogleSheetsUrl(clean);
    try {
      localStorage.setItem(STORAGE_KEYS.GSHEETS_URL, clean);
    } catch {
      // ignore
    }
    if (clean) {
      setIsSyncing(true);
      try {
        const { events: remoteEvents, mode } = await fetchEventsFromBackend(
          undefined,
          clean
        );
        setBackendMode(mode);
        if (remoteEvents.length > 0) {
          setEvents(remoteEvents);
        }
      } finally {
        setIsSyncing(false);
      }
    }
  }, []);

  const pushCurrentStateToGoogleSheets = useCallback(
    async (overrideUrl?: string) => {
      const targetUrl = (overrideUrl ?? googleSheetsUrl).trim();
      setIsSyncing(true);
      try {
        const res = await pushAllStateToGoogleSheets(
          events,
          subCategories,
          backgroundByCalendar,
          targetUrl
        );
        setBackendMode(res.mode);
        return res.ok;
      } finally {
        setIsSyncing(false);
      }
    },
    [events, subCategories, backgroundByCalendar, googleSheetsUrl]
  );

  // Transición entre calendarios mediante Flechas o Solapas
  const selectCalendar = useCallback(
    (target: CalendarType, direction?: 'left' | 'right') => {
      const currentIdx = CALENDAR_ORDER.indexOf(activeCalendar);
      const targetIdx = CALENDAR_ORDER.indexOf(target);
      const computedDir =
        direction || (targetIdx >= currentIdx ? 'right' : 'left');
      setTransitionDirection(computedDir);
      setActiveCalendar(target);
      setSelectedSubCategoryId('all');
    },
    [activeCalendar]
  );

  const goToPreviousCalendar = useCallback(() => {
    const idx = CALENDAR_ORDER.indexOf(activeCalendar);
    const prevIdx = (idx - 1 + CALENDAR_ORDER.length) % CALENDAR_ORDER.length;
    selectCalendar(CALENDAR_ORDER[prevIdx], 'left');
  }, [activeCalendar, selectCalendar]);

  const goToNextCalendar = useCallback(() => {
    const idx = CALENDAR_ORDER.indexOf(activeCalendar);
    const nextIdx = (idx + 1) % CALENDAR_ORDER.length;
    selectCalendar(CALENDAR_ORDER[nextIdx], 'right');
  }, [activeCalendar, selectCalendar]);

  // Navegación de fechas (Mes / Semana)
  const goToPreviousPeriod = useCallback(() => {
    setCurrentDate((prev) => {
      if (viewMode === 'month') {
        return new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      }
      return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7);
    });
  }, [viewMode]);

  const goToNextPeriod = useCallback(() => {
    setCurrentDate((prev) => {
      if (viewMode === 'month') {
        return new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      }
      return new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7);
    });
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Subcategorías visibles (no archivadas) del calendario activo
  const activeSubCategories = useMemo(
    () =>
      subCategories.filter(
        (sub) => sub.calendarType === activeCalendar && !sub.archived
      ),
    [subCategories, activeCalendar]
  );

  // Todas las subcategorías del calendario activo (incluyendo archivadas)
  const allSubCategoriesOfActiveCalendar = useMemo(
    () => subCategories.filter((sub) => sub.calendarType === activeCalendar),
    [subCategories, activeCalendar]
  );

  const subCategoryMap = useMemo(() => {
    const map: Record<string, SubCategoryTag> = {};
    for (const item of subCategories) {
      map[item.id] = item;
    }
    return map;
  }, [subCategories]);

  // Eventos filtrados para la vista activa
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (!showAllCalendarsOverlay && evt.calendarType !== activeCalendar) {
        return false;
      }
      // Ocultar eventos de materias archivadas excepto si se seleccionó esa materia explícitamente
      if (
        evt.subCategoryId &&
        subCategoryMap[evt.subCategoryId]?.archived &&
        selectedSubCategoryId !== evt.subCategoryId
      ) {
        return false;
      }
      if (selectedCategory !== 'all' && evt.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'all' && evt.status !== selectedStatus) {
        return false;
      }
      if (
        selectedSubCategoryId !== 'all' &&
        evt.subCategoryId !== selectedSubCategoryId
      ) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = evt.title.toLowerCase().includes(q);
        const matchDesc = evt.description.toLowerCase().includes(q);
        const subName = evt.subCategoryId
          ? subCategoryMap[evt.subCategoryId]?.name.toLowerCase() || ''
          : '';
        if (!matchTitle && !matchDesc && !subName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [
    events,
    activeCalendar,
    showAllCalendarsOverlay,
    selectedCategory,
    selectedStatus,
    selectedSubCategoryId,
    searchQuery,
    subCategoryMap,
  ]);

  // CRUD de eventos conectado a Google Sheets (Drive) y FastAPI
  const addOrUpdateEvent = useCallback(
    async (
      eventInput: Omit<CalendarEvent, 'id'> & { id?: string }
    ): Promise<CalendarEvent> => {
      setIsSyncing(true);
      try {
        if (eventInput.id) {
          const existing: CalendarEvent = {
            ...(eventInput as CalendarEvent),
            id: eventInput.id,
          };
          const { event: updated, mode } = await updateEventInBackend(
            existing,
            googleSheetsUrl
          );
          setBackendMode(mode);
          setEvents((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item))
          );
          return updated;
        } else {
          const { event: created, mode } = await createEventInBackend(
            eventInput,
            googleSheetsUrl
          );
          setBackendMode(mode);
          setEvents((prev) => [...prev, created]);
          return created;
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [googleSheetsUrl]
  );

  const toggleEventCompleted = useCallback(
    async (eventId: string) => {
      let targetEvent: CalendarEvent | undefined;

      setEvents((prev) =>
        prev.map((evt) => {
          if (evt.id !== eventId) return evt;
          const nextCompleted = !evt.completed;
          const nextStatus: EventStatus = nextCompleted
            ? evt.category === 'examen' ||
              evt.category === 'final' ||
              evt.category === 'trabajo_practico' ||
              evt.category === 'evento_con_puntos'
              ? 'aprobado'
              : 'completado'
            : 'pendiente';
          targetEvent = {
            ...evt,
            completed: nextCompleted,
            status: nextStatus,
          };
          return targetEvent;
        })
      );

      if (targetEvent) {
        setIsSyncing(true);
        try {
          const { mode } = await updateEventInBackend(
            targetEvent,
            googleSheetsUrl
          );
          setBackendMode(mode);
        } finally {
          setIsSyncing(false);
        }
      }
    },
    [googleSheetsUrl]
  );

  const toggleEventActivity = useCallback(
    async (eventId: string, activityId: string) => {
      let targetEvent: CalendarEvent | undefined;

      setEvents((prev) =>
        prev.map((evt) => {
          if (evt.id !== eventId) return evt;
          const currentActs = evt.activities || [];
          const updatedActivities = currentActs.map((act) =>
            act.id === activityId ? { ...act, completed: !act.completed } : act
          );
          const allCompleted =
            updatedActivities.length > 0 &&
            updatedActivities.every((a) => a.completed);

          targetEvent = {
            ...evt,
            activities: updatedActivities,
            ...(allCompleted && !evt.completed
              ? {
                  completed: true,
                  status:
                    evt.category === 'examen' ||
                    evt.category === 'final' ||
                    evt.category === 'trabajo_practico' ||
                    evt.category === 'evento_con_puntos'
                      ? 'aprobado'
                      : 'completado',
                }
              : {}),
          };
          return targetEvent;
        })
      );

      if (targetEvent) {
        setIsSyncing(true);
        try {
          const { mode } = await updateEventInBackend(
            targetEvent,
            googleSheetsUrl
          );
          setBackendMode(mode);
        } finally {
          setIsSyncing(false);
        }
      }
    },
    [googleSheetsUrl]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      setEvents((prev) => prev.filter((evt) => evt.id !== eventId));
      setIsSyncing(true);
      try {
        const { mode } = await deleteEventFromBackend(eventId, googleSheetsUrl);
        setBackendMode(mode);
      } finally {
        setIsSyncing(false);
      }
    },
    [googleSheetsUrl]
  );

  // Ingesta de lote desde Agente Automatizado (FastAPI / Webhook)
  const ingestFromAgent = useCallback(
    async (payload: FastAPIAgentIngestRequest) => {
      setIsSyncing(true);
      try {
        const { events: newAgentEvents, mode } =
          await ingestAgentPayloadToBackend(payload, googleSheetsUrl);
        setBackendMode(mode);
        setEvents((prev) => [...prev, ...newAgentEvents]);
        return newAgentEvents;
      } finally {
        setIsSyncing(false);
      }
    },
    [googleSheetsUrl]
  );

  // Personalización de colores y etiquetas sincronizada con Google Sheets
  const updateSubCategoryColor = useCallback(
    (id: string, colorHex: string) => {
      setSubCategories((prev) => {
        const next = prev.map((sub) =>
          sub.id === id ? { ...sub, colorHex } : sub
        );
        savePreferencesToBackend(
          next,
          backgroundByCalendar,
          googleSheetsUrl
        ).then((mode) => setBackendMode(mode));
        return next;
      });
    },
    [backgroundByCalendar, googleSheetsUrl]
  );

  const addSubCategoryTag = useCallback(
    (tag: Omit<SubCategoryTag, 'id'>) => {
      const newTag: SubCategoryTag = {
        ...tag,
        id: `${tag.calendarType}-${Date.now().toString(36)}`,
      };
      setSubCategories((prev) => {
        const next = [...prev, newTag];
        savePreferencesToBackend(
          next,
          backgroundByCalendar,
          googleSheetsUrl
        ).then((mode) => setBackendMode(mode));
        return next;
      });
      return newTag;
    },
    [backgroundByCalendar, googleSheetsUrl]
  );

  const setActiveBackgroundStyle = useCallback(
    (styleId: BackgroundStyleId) => {
      setBackgroundByCalendar((prev) => {
        const next = {
          ...prev,
          [activeCalendar]: styleId,
        };
        savePreferencesToBackend(subCategories, next, googleSheetsUrl).then(
          (mode) => setBackendMode(mode)
        );
        return next;
      });
    },
    [activeCalendar, subCategories, googleSheetsUrl]
  );

  // Alternar archivado de una materia / rama / categoría
  const toggleArchiveSubCategory = useCallback(
    (id: string) => {
      setSubCategories((prev) => {
        const next = prev.map((sub) =>
          sub.id === id ? { ...sub, archived: !sub.archived } : sub
        );
        savePreferencesToBackend(
          next,
          backgroundByCalendar,
          googleSheetsUrl
        ).then((mode) => setBackendMode(mode));
        return next;
      });
    },
    [backgroundByCalendar, googleSheetsUrl]
  );

  // Actualizar datos completos de una materia (nombre, código, temas, etc.)
  const updateSubCategory = useCallback(
    (updated: SubCategoryTag) => {
      setSubCategories((prev) => {
        const next = prev.map((sub) => (sub.id === updated.id ? updated : sub));
        savePreferencesToBackend(
          next,
          backgroundByCalendar,
          googleSheetsUrl
        ).then((mode) => setBackendMode(mode));
        return next;
      });
    },
    [backgroundByCalendar, googleSheetsUrl]
  );

  // Eliminar una materia
  const deleteSubCategory = useCallback(
    (id: string) => {
      setSubCategories((prev) => {
        const next = prev.filter((sub) => sub.id !== id);
        savePreferencesToBackend(
          next,
          backgroundByCalendar,
          googleSheetsUrl
        ).then((mode) => setBackendMode(mode));
        return next;
      });
    },
    [backgroundByCalendar, googleSheetsUrl]
  );

  // Marcar/desmarcar tema completado en el roadmap de una materia
  const toggleSyllabusTopic = useCallback(
    (subCatId: string, topicId: string) => {
      setSubCategories((prev) => {
        const next = prev.map((sub) => {
          if (sub.id !== subCatId) return sub;
          const topics = (sub.syllabusTopics || []).map((top) =>
            top.id === topicId ? { ...top, completed: !top.completed } : top
          );
          return { ...sub, syllabusTopics: topics };
        });
        savePreferencesToBackend(
          next,
          backgroundByCalendar,
          googleSheetsUrl
        ).then((mode) => setBackendMode(mode));
        return next;
      });
    },
    [backgroundByCalendar, googleSheetsUrl]
  );

  // Agregar un tema nuevo al temario/roadmap de una materia
  const addSyllabusTopic = useCallback(
    (
      subCatId: string,
      title: string,
      priority: 'alta' | 'media' | 'baja' = 'media',
      targetHours?: number,
      notes?: string
    ) => {
      setSubCategories((prev) => {
        const next = prev.map((sub) => {
          if (sub.id !== subCatId) return sub;
          const newTopic: SyllabusTopic = {
            id: `top-${Date.now().toString(36)}`,
            title,
            completed: false,
            priority,
            targetHours,
            notes,
          };
          return {
            ...sub,
            syllabusTopics: [...(sub.syllabusTopics || []), newTopic],
          };
        });
        savePreferencesToBackend(
          next,
          backgroundByCalendar,
          googleSheetsUrl
        ).then((mode) => setBackendMode(mode));
        return next;
      });
    },
    [backgroundByCalendar, googleSheetsUrl]
  );

  // Eliminar un tema del temario
  const deleteSyllabusTopic = useCallback(
    (subCatId: string, topicId: string) => {
      setSubCategories((prev) => {
        const next = prev.map((sub) => {
          if (sub.id !== subCatId) return sub;
          return {
            ...sub,
            syllabusTopics: (sub.syllabusTopics || []).filter(
              (top) => top.id !== topicId
            ),
          };
        });
        savePreferencesToBackend(
          next,
          backgroundByCalendar,
          googleSheetsUrl
        ).then((mode) => setBackendMode(mode));
        return next;
      });
    },
    [backgroundByCalendar, googleSheetsUrl]
  );

  // Gestión de rutinas de usuario (Gimnasio, trabajo, estudio)
  const addRoutine = useCallback((routine: Omit<UserRoutineItem, 'id'>) => {
    setUserRoutines((prev) => {
      const next: UserRoutineItem[] = [
        ...prev,
        { ...routine, id: `rout-${Date.now().toString(36)}` },
      ];
      try {
        localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const updateRoutine = useCallback((updated: UserRoutineItem) => {
    setUserRoutines((prev) => {
      const next = prev.map((r) => (r.id === updated.id ? updated : r));
      try {
        localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    setUserRoutines((prev) => {
      const next = prev.filter((r) => r.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Notificaciones del navegador
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setNotificationsEnabled(granted);
      return granted;
    } catch {
      return false;
    }
  }, []);

  const sendBrowserNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      }
    },
    []
  );

  const resetDemoData = useCallback(() => {
    const fresh = buildInitialSeedEvents(new Date());
    setEvents(fresh);
    setSubCategories(DEFAULT_SUBCATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
  }, []);

  return {
    activeCalendar,
    transitionDirection,
    selectCalendar,
    goToPreviousCalendar,
    goToNextCalendar,
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
    goToPreviousPeriod,
    goToNextPeriod,
    goToToday,
    darkMode,
    setDarkMode,
    events,
    filteredEvents,
    subCategories,
    activeSubCategories,
    allSubCategoriesOfActiveCalendar,
    subCategoryMap,
    backgroundByCalendar,
    activeBackgroundStyle: backgroundByCalendar[activeCalendar],
    setActiveBackgroundStyle,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    selectedSubCategoryId,
    setSelectedSubCategoryId,
    searchQuery,
    setSearchQuery,
    showAllCalendarsOverlay,
    setShowAllCalendarsOverlay,
    addOrUpdateEvent,
    toggleEventCompleted,
    toggleEventActivity,
    deleteEvent,
    ingestFromAgent,
    updateSubCategoryColor,
    addSubCategoryTag,
    toggleArchiveSubCategory,
    updateSubCategory,
    deleteSubCategory,
    toggleSyllabusTopic,
    addSyllabusTopic,
    deleteSyllabusTopic,
    userRoutines,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    notificationsEnabled,
    requestNotificationPermission,
    sendBrowserNotification,
    resetDemoData,
    backendMode,
    isSyncing,
    googleSheetsUrl,
    updateGoogleSheetsUrl,
    pushCurrentStateToGoogleSheets,
  };
}
