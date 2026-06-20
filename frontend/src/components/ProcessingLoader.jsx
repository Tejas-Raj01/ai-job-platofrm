import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function ProcessingLoader() {
  return (
    <div className="flex flex-col items-center justify-center space-y-8 p-10">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Outer glowing rings */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-primary-500/30 border-t-primary-400"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border border-accent-500/20 border-b-accent-400"
        />
        
        {/* Core glow */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-6 rounded-full bg-primary-600/20 blur-xl"
        />
        
        {/* Center Icon */}
        <div className="relative z-10 w-12 h-12 rounded-full bg-surface border border-surfaceBorder flex items-center justify-center shadow-lg shadow-primary-500/20">
          <Sparkles className="w-6 h-6 text-primary-400" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-zinc-100 tracking-tight">AI Analysis in Progress</h3>
        <p className="text-sm text-zinc-500 max-w-xs mx-auto">
          Vectorizing your resume and cross-referencing semantic gaps using Gemini 1.5 Pro...
        </p>
      </div>

      {/* Progress Bar Mock */}
      <div className="w-64 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 15, ease: "circOut" }}
        />
      </div>
    </div>
  );
}
