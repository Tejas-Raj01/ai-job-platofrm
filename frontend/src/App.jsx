import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Briefcase, ChevronRight, Search, CheckCircle2 } from 'lucide-react';
import FileUpload from './components/FileUpload';
import JobSelector from './components/JobSelector';
import ProcessingLoader from './components/ProcessingLoader';
import AnalysisDashboard from './components/AnalysisDashboard';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [resumeId, setResumeId] = useState(() => localStorage.getItem('nexus_resume_id') || null);
  const [resumeName, setResumeName] = useState(() => localStorage.getItem('nexus_resume_name') || null);
  const [jobId, setJobId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [results, setResults] = useState(null);
  const [topJobs, setTopJobs] = useState([]);
  const [customJd, setCustomJd] = useState("");

  // Persist resume ID so user doesn't have to upload again
  useEffect(() => {
    if (resumeId) {
      localStorage.setItem('nexus_resume_id', resumeId);
      if (resumeName) localStorage.setItem('nexus_resume_name', resumeName);
    } else {
      localStorage.removeItem('nexus_resume_id');
      localStorage.removeItem('nexus_resume_name');
      setTopJobs([]);
      setJobId(null);
      setResults(null);
      setResumeName(null);
    }
  }, [resumeId, resumeName]);

  const handleCustomJdMatch = async () => {
    if (!resumeId || !customJd.trim()) return;
    setLoading(true);
    setLoadingMsg("Analyzing your custom job description...");
    try {
      const response = await fetch(`${API_URL}/api/resumes/${resumeId}/match_custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: "Custom Target Job", 
          company: "Custom Target Company", 
          jd_text: customJd 
        })
      });
      if (!response.ok) throw new Error('Failed to match custom JD');
      const data = await response.json();
      
      setTopJobs(data.matches || []);
      if (data.matches && data.matches.length > 0) {
        const bestJobId = data.matches[0].job_id;
        setJobId(bestJobId);
        handleMatch(bestJobId, data.matches[0].match_score);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleFindJobs = async () => {
    if (!resumeId) return;
    setLoading(true);
    setLoadingMsg("Extracting keywords & searching live internet job boards...");
    try {
      const response = await fetch(`${API_URL}/api/resumes/${resumeId}/analyze-and-fetch`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to fetch and analyze jobs');
      const data = await response.json();
      setTopJobs(data.matches || []);
      
      // Auto-select and analyze the top match
      if (data.matches && data.matches.length > 0) {
        const bestJobId = data.matches[0].job_id;
        setJobId(bestJobId);
        handleMatch(bestJobId, data.matches[0].match_score);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleMatch = async (targetJobId, precalculatedScore = null) => {
    const idToUse = targetJobId || jobId;
    if (!resumeId || !idToUse) return;
    
    setLoading(true);
    setLoadingMsg("Running Gemini 1.5 Pro to analyze specific skill gaps...");
    try {
      const response = await fetch(`${API_URL}/api/resumes/match?resume_id=${resumeId}&job_id=${idToUse}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Match failed');
      const data = await response.json();
      
      // If we precalculated the score during the search phase, we can override or keep it
      if (precalculatedScore) {
        data.match_score = precalculatedScore;
      }
      setResults(data);
    } catch (error) {
      console.error(error);
      alert("Error: Analysis failed. Please check backend server logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background font-sans text-zinc-300">
      <div className="absolute top-0 inset-x-0 h-[500px] pointer-events-none overflow-hidden">
        <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary-600/20 blur-[120px] rounded-full opacity-50 mix-blend-screen" />
      </div>

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
            v3.0 AI Feed
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10 h-[calc(100vh-64px)] flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar: Jobs Feed */}
        <aside className="w-full md:w-80 flex-shrink-0 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary-400" />
              <h2 className="text-sm font-semibold tracking-wider text-zinc-100 uppercase">Top Matches</h2>
            </div>
          </div>
          <div className="flex-1 glass-panel p-4 overflow-hidden flex flex-col">
            <JobSelector 
              onSelectJob={(id) => {
                setJobId(id);
                setResults(null);
                handleMatch(id);
              }} 
              selectedJobId={jobId} 
              externalJobs={topJobs}
            />
          </div>
        </aside>

        {/* Right Main Area */}
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
                <ProcessingLoader message={loadingMsg} />
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
                    Discover <span className="gradient-text">Your Best Fit</span>
                  </h1>
                  <p className="text-zinc-400">
                    Upload your resume and our AI will automatically scan thousands of job listings to find and rank your perfect matches.
                  </p>
                </div>

                <div className="glass-panel p-8 mb-8">
                  {resumeId ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-primary-500/30 rounded-xl bg-primary-500/5">
                      <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-6 h-6 text-primary-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">Active Resume</h3>
                      <p className="text-sm text-zinc-400 mb-4">
                        {resumeName ? (
                          <span className="font-medium text-primary-400">{resumeName}</span>
                        ) : (
                          "Your profile is loaded and ready for analysis."
                        )}
                      </p>
                      <button 
                        onClick={() => setResumeId(null)}
                        className="text-xs font-medium px-4 py-2 rounded-full bg-surface border border-surfaceBorder hover:bg-surfaceHover text-zinc-300 transition-colors"
                      >
                        Upload a Different Resume
                      </button>
                    </div>
                  ) : (
                    <FileUpload onUploadComplete={(id, name) => {
                      setResumeId(id);
                      setResumeName(name);
                      setResults(null);
                      setTopJobs([]);
                      setJobId(null);
                    }} resumeId={resumeId} />
                  )}
                </div>

                <div className="flex justify-center mb-8">
                  <button 
                    onClick={handleFindJobs}
                    disabled={!resumeId}
                    className={`
                      group relative overflow-hidden flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300
                      ${(resumeId) 
                        ? 'bg-primary-600 hover:bg-primary-500 shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)] hover:shadow-[0_0_40px_-5px_rgba(99,102,241,0.6)] hover:-translate-y-0.5' 
                        : 'bg-surface border border-surfaceBorder text-zinc-500 cursor-not-allowed'}
                    `}
                  >
                    <Search className="w-5 h-5" />
                    <span>Auto-Find Jobs from Internet</span>
                    <ChevronRight className={`w-5 h-5 transition-transform ${(resumeId) ? 'group-hover:translate-x-1' : ''}`} />
                  </button>
                </div>

                <div className="relative flex items-center py-5">
                  <div className="flex-grow border-t border-surfaceBorder"></div>
                  <span className="flex-shrink-0 mx-4 text-zinc-500 text-sm font-medium tracking-widest">OR TARGET A SPECIFIC ROLE</span>
                  <div className="flex-grow border-t border-surfaceBorder"></div>
                </div>

                <div className="glass-panel p-6 mt-2">
                  <p className="text-sm text-zinc-400 mb-3 font-medium">Paste a specific Job Description (e.g. from Google Careers)</p>
                  <textarea
                    className="w-full h-32 bg-surface border border-surfaceBorder rounded-lg p-3 text-sm text-zinc-300 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors resize-none mb-3 custom-scrollbar"
                    placeholder="Paste job description text here..."
                    value={customJd}
                    onChange={(e) => setCustomJd(e.target.value)}
                  />
                  <button
                    onClick={handleCustomJdMatch}
                    disabled={!resumeId || !customJd.trim()}
                    className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${resumeId && customJd.trim() ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : 'bg-surface border border-surfaceBorder text-zinc-500 cursor-not-allowed'}`}
                  >
                    Analyze Custom Job
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
