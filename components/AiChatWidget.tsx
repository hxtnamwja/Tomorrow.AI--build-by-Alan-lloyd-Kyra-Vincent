import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Trash2 } from 'lucide-react';
import { AiService } from '../services/aiService';
import { AIMessageContent } from './AIMessageContent';
import { Demo, Language } from '../types';

interface AiChatWidgetProps {
  t: (key: any) => string;
  language: Language;
  onOpenDemo?: (demoId: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  demos: Demo[];
}

export const AiChatWidget: React.FC<AiChatWidgetProps> = ({ t, language, onOpenDemo, isOpen, setIsOpen }) => {
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages from localStorage when component mounts
  useEffect(() => {
    const savedMessages = localStorage.getItem('ai_chat_messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          setMessages(parsedMessages);
          return;
        }
      } catch (error) {
        console.error('Error parsing saved messages:', error);
      }
    }
    // Initialize with welcome message if no saved messages
    setMessages([{role: 'model', text: t('chatWelcome')}]);
  }, [language, t]);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai_chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

	  const handleSend = async () => {
	    if (!input.trim()) return;
	    const userMsg = input;
	    const historySnapshot = messages
	      .filter(message => message.text.trim() && message.text !== t('chatWelcome'))
	      .slice(-8);
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    // Add empty model message for streaming
    setMessages(prev => [...prev, { role: 'model', text: '' }]);

    let accumulatedText = '';

    try {
	      await AiService.recommend(userMsg, `界面语言: ${language}`, (chunk) => {
	        accumulatedText += chunk;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'model') {
            lastMessage.text = accumulatedText;
          }
          return [...newMessages];
	      }, historySnapshot);
      });
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'model' && lastMessage.text === '') {
          lastMessage.text = t('aiError') || 'Sorry, I encountered an error.';
        }
        return [...newMessages];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearMessages = () => {
    if (window.confirm(t('clearChatHistory') || '确定要清除聊天历史吗？')) {
      localStorage.removeItem('ai_chat_messages');
      setMessages([{role: 'model', text: t('chatWelcome')}]);
    }
  };

  // 处理键盘事件 - 完全阻止回车键发送
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      // 完全阻止回车键的默认行为和事件传播
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-8 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-white/50 overflow-hidden flex flex-col max-h-[500px] z-50"
          >
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-sm tracking-wide">{t('aiChatTitle')}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleClearMessages}
                  className="opacity-70 hover:opacity-100"
                  title={t('clearChatHistory') || '清除聊天历史'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 opacity-70 hover:opacity-100" /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[300px]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm overflow-hidden ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                  }`}>
                    <div className="break-words overflow-wrap-anywhere">
                      {msg.role === 'model' ? (
                        <AIMessageContent 
                          text={msg.text} 
                          onOpenDemo={onOpenDemo}
                          isStreaming={isLoading && i === messages.length - 1}
                        />
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.text === '' && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* 完全分离的输入区域 - 输入框和发送按钮完全独立 */}
            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
              <div className="space-y-2">
                <input 
                  ref={inputRef}
                  type="text"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                  placeholder={t('aiChatPlaceholder')}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button 
                  type="button"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200 transition-all text-sm font-medium"
                >
                  发送
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="fixed bottom-8 right-8 z-40">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-full shadow-2xl hover:shadow-indigo-500/30 hover:scale-105 transition-all flex items-center justify-center border border-slate-700"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6 text-indigo-300" />}
        </button>
      </div>
    </>
  );
};
