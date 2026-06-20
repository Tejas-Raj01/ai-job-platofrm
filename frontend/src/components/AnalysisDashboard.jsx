import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowLeft, Lightbulb, Target } from 'lucide-react';

export default function AnalysisDashboard({ results, onReset }) {
  if (!results) return null;
  const { match_score, missing_skills, recommendations } = results;

  // Determine score color
  let scoreColor = "text-green-400";
  let ringColor = "stroke-green-500";
  if (match_score < 70) {
    scoreColor = "text-yellow-400";
    ringColor = "stroke-yellow-500";
  }
  if (match_score < 40) {
    scoreColor = "text-red-400";
    ringColor = "stroke-red-500";
  }

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (match_score / 100) * circumference;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Match Results</h2>
          <p className="text-sm text-zinc-400 mt-1">Detailed breakdown of your resume fit.</p>
        </div>
        <button 
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-surfaceBorder hover:bg-surfaceHover text-zinc-300 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>New Analysis</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto custom-scrollbar pb-6">
        
        {/* Left Column: Score */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-8 flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest mb-6">Overall Score</h3>
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* SVG Ring */}
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                <circle 
                  cx="96" cy="96" r={radius} 
                  className="stroke-zinc-800" strokeWidth="8" fill="none"
                />
                <motion.circle 
                  cx="96" cy="96" r={radius}
                  className={`${ringColor} transition-all duration-1000 ease-out drop-shadow-[0_0_10px_rgba(currentColor,0.5)]`}
                  strokeWidth="8" fill="none" strokeLinecap="round"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  style={{ strokeDasharray: circumference }}
                />
              </svg>
              <div className="flex flex-col items-center justify-center">
                <span className={`text-5xl font-bold tracking-tighter ${scoreColor}`}>
                  {match_score}%
                </span>
                <span className="text-xs text-zinc-500 mt-1 font-medium uppercase tracking-widest">Match</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6">
             <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-accent-400" />
              <h3 className="text-sm font-semibold text-white tracking-wide">Summary</h3>
            </div>
            <p className="text-sm leading-relaxed text-zinc-300">
              {match_score >= 80 ? "Excellent fit! You have most of the required skills for this role." : 
               match_score >= 50 ? "Good potential, but there are some notable gaps in your skillset." : 
               "Significant gaps detected. Consider upskilling before applying."}
            </p>
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <div className="glass-panel p-6 flex-1">
            <div className="flex items-center gap-2 mb-6">
              <XCircle className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Missing Skills & Keywords</h3>
            </div>
            {missing_skills && missing_skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {missing_skills.map((skill, i) => (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={i} 
                    className="px-3 py-1.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-400 bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">No major missing skills detected!</span>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 flex-1">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Actionable Recommendations</h3>
            </div>
            {recommendations && recommendations.length > 0 ? (
              <ul className="space-y-4">
                {recommendations.map((rec, i) => (
                  <motion.li 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (i * 0.1) }}
                    key={i} 
                    className="flex gap-3 text-sm text-zinc-300"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed pt-0.5">{rec}</span>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">No specific recommendations at this time.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
