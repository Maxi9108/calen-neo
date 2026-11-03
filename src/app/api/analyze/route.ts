import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_SUBCATEGORIES } from '@/config/neofaro-theme';
import { CalendarType, SubCategoryTag } from '@/types/calendar';
import { analyzeTextWithAISDK } from '@/lib/ai/calenNeoAgent';

export async function POST(request: NextRequest) {
  try {
    const body: {
      text: string;
      defaultCalendar?: CalendarType;
      subCategories?: SubCategoryTag[];
      fileName?: string;
    } = await request.json();

    if (!body.text || !body.text.trim()) {
      return NextResponse.json(
        { detail: 'El texto o documento está vacío.' },
        { status: 400 }
      );
    }

    const { candidates, engine } = await analyzeTextWithAISDK(
      body.text,
      body.defaultCalendar || 'academico',
      body.subCategories || DEFAULT_SUBCATEGORIES,
      body.fileName
    );

    return NextResponse.json({
      status: 'ok',
      engine,
      count: candidates.length,
      candidates,
    });
  } catch {
    return NextResponse.json(
      { detail: 'Error al analizar el documento o texto.' },
      { status: 500 }
    );
  }
}
