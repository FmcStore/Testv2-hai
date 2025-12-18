
import React, { useState, useEffect, useCallback } from 'react';
import { AIModel, Message, ChatSession } from './types';
import { callFmcPerplexity, callQuillChat, callGemini } from './services/aiService';
import MessageList from './components/MessageList';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>(AIModel.FMC_PERPLEXITY);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize first session if none exists
  useEffect(() => {
    const saved = localStorage.getItem('fmc_ai_sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('fmc_ai_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const currentSession = sessions.find(s => s.id === currentSessionId) || null;

  const startNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'Percakapan Baru',
      messages: [],
      model: selectedModel,
      lastActive: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsSidebarOpen(false);
  }, [selectedModel]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    let sessionId = currentSessionId;
    let activeSession = currentSession;

    if (!sessionId || !activeSession) {
      const newId = crypto.randomUUID();
      const newSession: ChatSession = {
        id: newId,
        title: input.slice(0, 30) + (input.length > 30 ? '...' : ''),
        messages: [],
        model: selectedModel,
        lastActive: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newId);
      sessionId = newId;
      activeSession = newSession;
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    const updatedMessages = [...activeSession.messages, userMsg];
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: updatedMessages, lastActive: Date.now() } : s));
    setInput('');
    setIsLoading(true);

    try {
      let responseText = '';
      let newQuillChatId: string | null = activeSession.quillChatId || null;

      if (selectedModel === AIModel.FMC_PERPLEXITY) {
        responseText = await callFmcPerplexity(input);
      } else if (selectedModel === AIModel.QUILL_CHAT) {
        const res = await callQuillChat({
          prompt: input,
          chatId: activeSession.quillChatId,
          webSearch: webSearchEnabled
        });
        responseText = res.response;
        newQuillChatId = res.chatId || null;
      } else {
        responseText = await callGemini(input);
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: responseText,
        model: selectedModel,
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { 
              ...s, 
              messages: [...updatedMessages, assistantMsg], 
              quillChatId: newQuillChatId,
              title: s.messages.length === 0 ? input.slice(0, 30) : s.title
            } 
          : s
      ));
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Maaf, terjadi kesalahan saat menghubungi server AI. Silakan coba lagi nanti.",
        timestamp: Date.now()
      };
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages: [...updatedMessages, errorMsg] } : s));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="material-icons text-white text-lg">bolt</span>
            </div>
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">Fmc AI Pro</h1>
          </div>

          <button 
            onClick={startNewChat}
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all font-medium mb-6 shadow-sm active:scale-[0.98]"
          >
            <span className="material-icons text-xl">add</span>
            Mulai Chat Baru
          </button>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">Riwayat</h3>
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => { setCurrentSessionId(s.id); setIsSidebarOpen(false); }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 group ${
                  currentSessionId === s.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`material-icons text-lg ${currentSessionId === s.id ? 'text-blue-500' : 'text-slate-400'}`}>chat_bubble_outline</span>
                <span className="truncate flex-1">{s.title}</span>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100">
             <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-center">Powered by Fmc AI & Quill</div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-full">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-slate-200 glass-effect sticky top-0 z-30">
          <button className="lg:hidden p-2 text-slate-500" onClick={() => setIsSidebarOpen(true)}>
            <span className="material-icons">menu</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button 
                onClick={() => setSelectedModel(AIModel.FMC_PERPLEXITY)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedModel === AIModel.FMC_PERPLEXITY ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Fmc AI
              </button>
              <button 
                onClick={() => setSelectedModel(AIModel.QUILL_CHAT)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedModel === AIModel.QUILL_CHAT ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Quill AI
              </button>
              <button 
                onClick={() => setSelectedModel(AIModel.GEMINI_PRO)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedModel === AIModel.GEMINI_PRO ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Gemini Pro
              </button>
            </div>
            
            {selectedModel === AIModel.QUILL_CHAT && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={webSearchEnabled} 
                  onChange={(e) => setWebSearchEnabled(e.target.checked)} 
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <span className="material-icons text-sm">public</span> Web Search
                </span>
              </label>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-tighter">System Ready</span>
          </div>
        </header>

        {/* Messages */}
        <MessageList 
          messages={currentSession?.messages || []} 
          isTyping={isLoading} 
        />

        {/* Input area */}
        <div className="px-4 pb-6 md:pb-10 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-10">
          <div className="max-w-3xl mx-auto relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Tanyakan sesuatu pada ${selectedModel.replace('_', ' ')}...`}
              rows={1}
              className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 pr-14 shadow-sm focus:shadow-md focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none resize-none transition-all placeholder-slate-400 text-slate-700 min-h-[60px]"
              style={{ height: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`absolute right-3 bottom-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                input.trim() && !isLoading ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-300'
              }`}
            >
              <span className="material-icons">{isLoading ? 'hourglass_top' : 'send'}</span>
            </button>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-4">Fmc AI Pro dapat memberikan informasi yang tidak akurat. Selalu verifikasi data penting.</p>
        </div>
      </main>
    </div>
  );
};

export default App;
