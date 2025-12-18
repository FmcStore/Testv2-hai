
import { GoogleGenAI } from "@google/genai";
import { AIModel, AskParams, AskResponse } from "../types";

// Helper untuk mengambil API Key dengan aman di lingkungan browser
const getApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch (e) {
    console.warn("API_KEY tidak ditemukan di process.env");
    return "";
  }
};

const FGSI_API_KEY = "fgsiapi-27a08a79-6d";

export const callFmcPerplexity = async (text: string): Promise<string> => {
  const apiUrl = `https://fgsi.dpdns.org/api/ai/perplexity?apikey=${FGSI_API_KEY}&text=${encodeURIComponent(text)}`;
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error("Gagal menghubungi Fmc AI");
  
  const data = await response.json();
  if (data.status && data.data && Array.isArray(data.data.text)) {
    const finalStep = data.data.text.find((step: any) => step.step_type === 'FINAL');
    if (finalStep && finalStep.content && finalStep.content.answer) {
      try {
        const answerObj = JSON.parse(finalStep.content.answer);
        return answerObj.answer || finalStep.content.answer;
      } catch (e) {
        return finalStep.content.answer;
      }
    }
  }
  return "Maaf, Fmc AI tidak memberikan respon yang valid.";
};

export const callQuillChat = async ({ prompt, chatId = null, webSearch = false }: AskParams): Promise<AskResponse> => {
  const payload = {
    stream: true,
    chatId,
    message: {
      role: "user",
      content: prompt,
      messageId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      files: []
    },
    product: "ai-chat",
    originUrl: "/ai-chat",
    prompt: { id: "ai_chat" },
    tools: webSearch ? ["web_search"] : []
  };

  const response = await fetch("https://quillbot.com/api/raven/quill-chat/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "text/event-stream",
      "useridtoken": "empty-token",
      "webapp-version": "38.36.1",
      "platform-type": "webapp",
      "qb-product": "ai-chat"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Gagal membaca stream dari Quillbot");

  let finalText = "";
  let finalChatId = chatId || undefined;
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 2);

      const dataLine = rawEvent.split("\n").find(l => l.startsWith("data:"));
      if (!dataLine) continue;

      const jsonStr = dataLine.replace("data:", "").trim();
      try {
        const json = JSON.parse(jsonStr);
        if (json.chatId) finalChatId = json.chatId;
        if (json.chunk) finalText += json.chunk;
        if (json.text) finalText = json.text;
      } catch (e) {
        // Skip parse errors
      }
    }
  }

  return {
    success: true,
    chatId: finalChatId,
    response: finalText.trim() || "Respon kosong dari Quillbot."
  };
};

export const callGemini = async (prompt: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "API Key Gemini belum dikonfigurasi.";

  const ai = new GoogleGenAI({ apiKey });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Tidak ada respon dari Gemini.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Terjadi kesalahan pada layanan Gemini.";
  }
};
