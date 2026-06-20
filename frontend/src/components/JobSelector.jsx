import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Search, Zap, ExternalLink } from 'lucide-react';

export default function JobSelector({ selectedJobId, onSelectJob, externalJobs = [] }) {
  const jobs = externalJobs;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 mt-2">
        {jobs.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-surface mx-auto flex items-center justify-center mb-3">
              <Search className="w-6 h-6 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-400 mb-2">Upload resume to scan live jobs</p>
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
                  className={`
                    relative p-4 rounded-xl border transition-all duration-200 group flex flex-col
                    ${isSelected 
                      ? 'border-primary-500 bg-primary-500/10' 
                      : 'border-surfaceBorder bg-surface hover:border-zinc-600 hover:bg-surfaceHover'}
                  `}
                >
                  <div className="cursor-pointer flex-1" onClick={() => onSelectJob(job.job_id)}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold text-base pr-6 ${isSelected ? 'text-primary-100' : 'text-zinc-100 group-hover:text-white'}`}>
                        {job.title}
                      </h3>
                      {job.match_score >= 80 && (
                        <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="truncate">{job.company}</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${job.match_score >= 80 ? 'bg-primary-500/20 text-primary-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        {job.match_score}% Match
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                      {job.short_description || "No description available."}
                    </p>
                  </div>
                  
                  <div className="pt-3 border-t border-surfaceBorder/50 flex items-center justify-between mt-auto">
                    {job.url && (
                      <a 
                        href={job.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Apply Now <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button 
                      onClick={() => onSelectJob(job.job_id)}
                      className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${isSelected ? 'bg-primary-500 text-white' : 'bg-surface border border-surfaceBorder text-zinc-300 hover:bg-zinc-800'}`}
                    >
                      {isSelected ? 'Analyzing...' : 'Analyze Gap'}
                    </button>
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
