import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Search, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function JobSelector({ selectedJobId, onSelectJob }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/jobs/');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerScrape = async () => {
    setScraping(true);
    try {
      await fetch('http://localhost:8000/api/jobs/scrape', { method: 'POST' });
      // Simple poll or delay
      setTimeout(() => {
        fetchJobs();
        setScraping(false);
      }, 3000);
    } catch (e) {
      console.error(e);
      setScraping(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-zinc-500" />
        </div>
        <input 
          type="text" 
          placeholder="Search roles..." 
          className="w-full bg-surface border border-surfaceBorder rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-32 space-y-3">
            <RefreshCw className="w-5 h-5 text-zinc-500 animate-spin" />
            <span className="text-xs text-zinc-500">Loading jobs...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-full bg-surface mx-auto flex items-center justify-center mb-3">
              <Building2 className="w-6 h-6 text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-400 mb-4">No jobs available.</p>
            <button 
              onClick={triggerScrape} 
              disabled={scraping}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-2 mx-auto w-full max-w-[200px]"
            >
              {scraping ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              {scraping ? 'Scraping Job Boards...' : 'Auto-Scrape Jobs'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {jobs.map((job) => {
              const isSelected = selectedJobId === job.id;
              return (
                <motion.div 
                  key={job.id} 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onSelectJob(job.id)}
                  className={`
                    relative cursor-pointer p-3 rounded-xl border transition-all duration-200 group
                    ${isSelected 
                      ? 'border-primary-500 bg-primary-500/10' 
                      : 'border-surfaceBorder bg-surface hover:border-zinc-600 hover:bg-surfaceHover'}
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 text-primary-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                  <h3 className={`font-semibold text-sm pr-6 ${isSelected ? 'text-primary-100' : 'text-zinc-200 group-hover:text-white'}`}>
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
                    <Building2 className="w-3 h-3" />
                    <span>{job.company}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {jobs.length > 0 && (
        <div className="pt-4 mt-auto border-t border-surfaceBorder text-center">
           <button 
              onClick={triggerScrape} 
              disabled={scraping}
              className="text-xs text-zinc-500 hover:text-primary-400 transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <RefreshCw className={`w-3 h-3 ${scraping ? 'animate-spin' : ''}`} />
              Fetch latest listings
            </button>
        </div>
      )}
    </div>
  );
}
