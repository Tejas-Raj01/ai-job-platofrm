import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Search, Zap, CheckCircle2 } from 'lucide-react';

export default function JobSelector({ selectedJobId, onSelectJob, externalJobs = [] }) {
  // We no longer fetch jobs here; we rely on the App passing down the AI-matched top jobs
  const jobs = externalJobs;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2 mt-2">
        {jobs.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-surface mx-auto flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-400 mb-2">Upload resume to scan jobs</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job, idx) => {
              const isSelected = selectedJobId === job.job_id;
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={job.job_id} 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onSelectJob(job.job_id)}
                  className={`
                    relative cursor-pointer p-3 rounded-xl border transition-all duration-200 group
                    ${isSelected 
                      ? 'border-primary-500 bg-primary-500/10' 
                      : 'border-surfaceBorder bg-surface hover:border-zinc-600 hover:bg-surfaceHover'}
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-semibold text-sm pr-6 ${isSelected ? 'text-primary-100' : 'text-zinc-200 group-hover:text-white'}`}>
                      {job.title}
                    </h3>
                    {job.match_score >= 80 && (
                      <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
                    <Building2 className="w-3 h-3" />
                    <span className="truncate">{job.company}</span>
                  </div>
                  
                  {/* Score Indicator */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 mr-3">
                      <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${job.match_score}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-primary-400">{job.match_score}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
