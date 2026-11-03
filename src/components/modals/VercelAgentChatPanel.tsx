'use client';

import React, { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import {
  Send,
  Sparkles,
  CheckCircle2,
  Calendar as CalendarIcon,
  Bot,
  User,
  AlertCircle,
} from 'lucide-react';
import type { CalenNeoAgentUIMessage } from '@/lib/ai/calenNeoAgent';
import {
  CalendarEvent,
  FastAPIAgentIngestRequest,
} from '@/types/calendar';

interface VercelAgentChatPanelProps {
  onIngestConfirmedEvents: (
    payload: FastAPIAgentIngestRequest
  ) => Promise<CalendarEvent[]>;
}

export function VercelAgentChatPanel({
  onIngestConfirmedEvents,
}: VercelAgentChatPanelProps) {
  const [input, setInput] = useState('');
  const [importedCallIds, setImportedCallIds] = useState<
    Record<string, boolean>
  >({});

  const { messages, sendMessage, status, error } =
    useChat<CalenNeoAgentUIMessage>({
      transport: new DefaultChatTransport({
        api: '/api/chat',
      }),
    });

  const isBusy = status === 'streaming' || status === 'submitted';

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isBusy) return;
    sendMessage({ text: input.trim() });
    setInput('');
  };

  return (
    <div className="flex flex-col h-[460px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 overflow-hidden">
      {/* Cabecera del Chat con Vercel AI SDK */}
      <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            ToolLoopAgent · Vercel AI SDK (Streaming + Tools)
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-semibold">
          google/gemini-3.8-flash
        </span>
      </div>

      {/* Historial de Mensajes (message.parts) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 neofaro-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 text-slate-400 dark:text-slate-500 space-y-2">
            <Sparkles className="w-7 h-7 text-indigo-500/70" />
            <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              Agente Conversacional de Calen-Neo (Vercel AI SDK)
            </p>
            <p className="text-xs max-w-md leading-relaxed">
              Pedile que analice un texto con fechas de la UNGS, que arme un campamento de Sábado a Sábado para Scout o que consulte tus eventos pendientes.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 pt-2">
              {[
                '¿Qué eventos tengo pendientes en Académico UNGS?',
                'Analizá esto: El sábado 14/11 de 9 a 18 campamento Sábado a Sábado de Unidad Scout',
                'Agendá entrega de TP3 de Programación III para el viernes 20/11 a las 18:00',
              ].map((promptSample) => (
                <button
                  key={promptSample}
                  type="button"
                  onClick={() => sendMessage({ text: promptSample })}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500/50 transition-colors"
                >
                  {promptSample}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2.5 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role !== 'user' && (
              <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm space-y-2 ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs shadow-neofaro-sm'
              }`}
            >
              {message.parts.map((part, idx) => {
                switch (part.type) {
                  case 'text':
                    return (
                      <div
                        key={`${message.id}-text-${idx}`}
                        className="whitespace-pre-wrap leading-relaxed"
                      >
                        {part.text}
                      </div>
                    );

                  case 'tool-extractAndProposeEvents': {
                    const callId = part.toolCallId;
                    if (
                      part.state === 'input-streaming' ||
                      part.state === 'input-available'
                    ) {
                      return (
                        <div
                          key={callId}
                          className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-xs font-medium"
                        >
                          Extrayendo y estructurando eventos del texto...
                        </div>
                      );
                    }
                    if (part.state === 'output-available') {
                      const proposed = part.output.proposedEvents || [];
                      const alreadyImported = Boolean(importedCallIds[callId]);

                      return (
                        <div
                          key={callId}
                          className="p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {proposed.length} evento(s) propuestos por el Agente
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {proposed.map((ev, i) => (
                              <div
                                key={i}
                                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs"
                              >
                                <p className="font-bold text-slate-800 dark:text-slate-100">
                                  {ev.titulo}
                                </p>
                                <p className="text-[11px] font-mono text-slate-500">
                                  {ev.tipo_calendario.toUpperCase()} ·{' '}
                                  {ev.categoria} · {ev.fecha_inicio}
                                </p>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            disabled={alreadyImported}
                            onClick={async () => {
                              await onIngestConfirmedEvents({
                                agente_id: 'vercel-ai-sdk-tool-loop-agent',
                                fuente: 'chat-tool-extract',
                                eventos: proposed.map((p) => ({
                                  titulo: p.titulo,
                                  descripcion: p.descripcion,
                                  fecha_inicio: p.fecha_inicio,
                                  fecha_fin: p.fecha_fin,
                                  tipo_calendario: p.tipo_calendario,
                                  categoria: p.categoria,
                                  estado: p.estado,
                                  completado:
                                    p.estado === 'completado' ||
                                    p.estado === 'aprobado',
                                  origen: 'agente_ia',
                                  subcategoria_id: p.subcategoria_id,
                                  es_sabado_a_sabado: p.es_sabado_a_sabado,
                                  puntos_obtenidos: p.puntos_obtenidos,
                                  puntos_maximos: p.puntos_maximos,
                                  ubicacion: p.ubicacion,
                                })),
                              });
                              setImportedCallIds((prev) => ({
                                ...prev,
                                [callId]: true,
                              }));
                            }}
                            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white flex items-center justify-center gap-1.5 transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {alreadyImported
                                ? '✓ Eventos Confirmados e Incorporados'
                                : 'Confirmar e Incorporar al Calendario'}
                            </span>
                          </button>
                        </div>
                      );
                    }
                    return null;
                  }

                  case 'tool-listCalendarEvents': {
                    const callId = part.toolCallId;
                    if (part.state === 'output-available') {
                      return (
                        <div
                          key={callId}
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs font-mono text-slate-600 dark:text-slate-300"
                        >
                          ✓ Consultados {part.output.total} evento(s) en la agenda.
                        </div>
                      );
                    }
                    return null;
                  }

                  case 'tool-createCalendarEvent': {
                    const callId = part.toolCallId;
                    if (part.state === 'output-available') {
                      return (
                        <div
                          key={callId}
                          className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
                        >
                          ✓ Evento creado: {part.output.event.titulo}
                        </div>
                      );
                    }
                    return null;
                  }

                  default:
                    return null;
                }
              })}
            </div>

            {message.role === 'user' && (
              <div className="w-7 h-7 rounded-xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/30 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            Configurá <code className="font-mono">AI_GATEWAY_API_KEY</code> en{' '}
            <code className="font-mono">.env.local</code> o Vercel para activar el streaming en vivo con AI Gateway, o usá la pestaña 1 (Analizador de Documentos) que incluye motor local sin llave.
          </span>
        </div>
      )}

      {/* Barra de entrada del Chat */}
      <form
        onSubmit={handleFormSubmit}
        className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribile al Agente IA (ej. Analizá estas fechas de parciales...)"
          className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
        <button
          type="submit"
          disabled={isBusy || !input.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          <span>{isBusy ? '...' : 'Enviar'}</span>
        </button>
      </form>
    </div>
  );
}

