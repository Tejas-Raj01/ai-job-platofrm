import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Briefcase, ChevronRight } from 'lucide-react';
import FileUpload from './components/FileUpload';
import JobSelector from './components/JobSelector';
import ProcessingLoader from './components/ProcessingLoader';
import AnalysisDashboard from './components/AnalysisDashboard';

export default function App() {
  const [resumeId, setResumeId] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleMatch = async () => {
    if (!resumeId || !jobId) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/resumes/match?resume_id=${resumeId}&job_id=${jobId}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Match failed');
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-zinc-300">
      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-[500px] pointer-events-none overflow-hidden">
        <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-600/20 blur-[120px] rounded-full opacity-50 mix-blend-screen" />
      </div>

      {/* Top Navigation */}
      <nav className="relative z-10 border-b border-surfaceBorder bg-background/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Nexus<span className="font-normal text-zinc-400">Match</span>
            </span>
          </div>
          <div className="text-xs font-medium px-3 py-1 rounded-full bg-surface border border-surfaceBorder text-zinc-400">
            v2.0 Premium
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 h-[calc(100vh-64px)] flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar: Jobs */}
        <aside className="w-full md:w-80 flex-shrink-0 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-4 px-1">
            <Briefcase className="w-5 h-5 text-primary-400" />
            <h2 className="text-sm font-semibold tracking-wider text-zinc-100 uppercase">Target Roles</h2>
          </div>
          <div className="flex-1 glass-panel p-4 overflow-hidden flex flex-col">
            <JobSelector onSelectJob={setJobId} selectedJobId={jobId} />
          </div>
        </aside>

        {/* Right Main Area: Upload & Analysis */}
        <section className="flex-1 h-full flex flex-col">
          <AnimatePresence mode="wait">
            {results ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full"
              >
                <AnalysisDashboard results={results} onReset={() => setResults(null)} />
              </motion.div>
            ) : loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full flex items-center justify-center"
              >
                <ProcessingLoader />
              </motion.div>
            ) : (
              <motion.div 
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full flex flex-col justify-center max-w-2xl mx-auto w-full"
              >
                <div className="text-center mb-10">
                  <h1 className="text-4xl font-bold text-white tracking-tight mb-3">
                    Analyze your <span className="gradient-text">Resume Fit</span>
                  </h1>
                  <p className="text-zinc-400">
                    Upload your resume to see how closely you match the selected job profile, backed by AI vector analysis.
                  </p>
                </div>

                <div className="glass-panel p-8 mb-8">
                  <FileUpload onUploadComplete={setResumeId} resumeId={resumeId} />
                </div>

                <div className="flex justify-center">
                  <button 
                    onClick={handleMatch}
                    disabled={!resumeId || !jobId}
                    className={`
                      group relative overflow-hidden flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300
                      ${(resumeId && jobId) 
                        ? 'bg-primary-600 hover:bg-primary-500 shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.6)] hover:-translate-y-0.5' 
                        : 'bg-surface border border-surfaceBorder text-zinc-500 cursor-not-allowed'}
                    `}
                  >
                    <span>Analyze Match</span>
                    <ChevronRight className={`w-5 h-5 transition-transform ${(resumeId && jobId) ? 'group-hover:translate-x-1' : ''}`} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </main>
    </div>
  );
}
