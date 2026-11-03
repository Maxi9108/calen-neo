import { createAgentUIStreamResponse } from 'ai';
import { calenNeoAgent } from '@/lib/ai/calenNeoAgent';

export async function POST(request: Request) {
  const { messages } = await request.json();

  return createAgentUIStreamResponse({
    agent: calenNeoAgent,
    uiMessages: messages,
  });
}

