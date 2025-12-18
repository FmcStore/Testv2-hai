
export enum AIModel {
  FMC_PERPLEXITY = 'fmc_perplexity',
  QUILL_CHAT = 'quill_chat',
  GEMINI_PRO = 'gemini_pro'
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model?: AIModel;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: AIModel;
  quillChatId?: string | null;
  lastActive: number;
}

export interface AskParams {
  prompt: string;
  chatId?: string | null;
  webSearch?: boolean;
}

export interface AskResponse {
  success: boolean;
  chatId?: string;
  response: string;
}
