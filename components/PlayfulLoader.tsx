import React from 'react';
import { Atom, BookOpen, Sparkles } from 'lucide-react';

export const PlayfulLoader = ({ message = '正在整理知识素材...' }: { message?: string }) => (
  <div className="min-h-[42vh] flex items-center justify-center px-6">
    <div className="text-center">
      <div className="relative w-28 h-28 mx-auto mb-5">
        <div className="absolute inset-3 rounded-full border border-indigo-200 animate-ping opacity-50" />
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s' }}>
          <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 text-amber-400" />
          <BookOpen className="absolute bottom-1 left-2 w-6 h-6 text-emerald-500 rotate-12" />
          <Atom className="absolute bottom-1 right-2 w-6 h-6 text-indigo-500 -rotate-12" />
        </div>
        <div className="absolute inset-7 rounded-2xl bg-white shadow-lg border border-indigo-100 flex items-center justify-center animate-pulse">
          <Sparkles className="w-8 h-8 text-indigo-600" />
        </div>
      </div>
      <p className="font-bold text-slate-700">{message}</p>
      <div className="mt-3 flex justify-center gap-1.5">
        {[0, 1, 2, 3, 4].map(index => (
          <span
            key={index}
            className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
            style={{ animationDelay: `${index * 120}ms` }}
          />
        ))}
      </div>
    </div>
  </div>
);
