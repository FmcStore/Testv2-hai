
import React, { useEffect, useRef } from 'react';
import { Message, AIModel } from '../types';

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isTyping }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    if ((window as any).MathJax) {
        (window as any).MathJax.typesetPromise();
    }
  }, [messages, isTyping]);

  const formatContent = (content: string) => {
    // Basic formatting logic (simplified for React rendering)
    let text = content;
    // Handle code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
        const lang = match?.[1] || 'code';
        const code = match?.[2] || part.slice(3, -3);
        return (
          <div key={i} className="my-4 bg-slate-900 text-slate-100 rounded-xl overflow-hidden shadow-lg font-mono text-sm">
            <div className="bg-slate-800 px-4 py-1 flex justify-between items-center text-xs text-slate-400">
              <span>{lang}</span>
            </div>
            <pre className="p-4 overflow-x-auto"><code>{code.trim()}</code></pre>
          </div>
        );
      }
      
      // Inline formatting like bold, lists, etc.
      return <div key={i} className="whitespace-pre-wrap leading-relaxed">{part}</div>;
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 space-y-8 max-w-4xl mx-auto w-full">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center">
            <img src="https://files.catbox.moe/yfxidj.png" className="w-14 h-14 rounded-full object-cover" alt="Logo" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">Selamat Datang di <span className="gemini-text">Fmc AI Pro</span></h2>
          <p className="text-slate-500 max-w-md">Pilih model favorit Anda dan mulai percakapan cerdas hari ini.</p>
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-300">
                <img src="https://files.catbox.moe/yfxidj.png" alt="Bot" className="w-full h-full object-cover" />
              </div>
            )}
            <div className={`max-w-[85%] px-5 py-3 rounded-2xl shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
            }`}>
              <div className="text-sm md:text-base">
                {formatContent(msg.content)}
              </div>
              {msg.role === 'assistant' && msg.model && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <span className="material-icons text-xs">bolt</span>
                  {msg.model.replace('_', ' ')}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-blue-200">
                <img src="https://files.catbox.moe/gpw6ah.png" alt="User" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        ))
      )}
      
      {isTyping && (
        <div className="flex gap-4 justify-start">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
            <img src="https://files.catbox.moe/yfxidj.png" alt="Bot" className="w-full h-full object-cover" />
          </div>
          <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
