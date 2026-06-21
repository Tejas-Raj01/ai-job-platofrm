import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle2, Loader2, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function FileUpload({ onUploadComplete, resumeId }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    if (selectedFile.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/resumes/upload?user_id=1`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      onUploadComplete(data.resume_id, data.filename);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Is the backend running?");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    onUploadComplete(null);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {resumeId && file ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-green-100 truncate">{file.name}</p>
                <p className="text-xs text-green-400/70">Processed & ready for analysis</p>
              </div>
            </div>
            <button 
              onClick={removeFile}
              className="p-2 hover:bg-green-500/20 rounded-full transition-colors text-green-400"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className={`
                relative group flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl transition-all duration-300
                ${dragActive 
                  ? 'border-primary-400 bg-primary-400/5 shadow-[0_0_30px_rgba(99,102,241,0.15)]' 
                  : file ? 'border-zinc-600 bg-surface' : 'border-zinc-700 bg-surface/50 hover:bg-surface hover:border-zinc-600'}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleChange}
              />
              
              {!file ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <UploadCloud className={`w-7 h-7 ${dragActive ? 'text-primary-400' : 'text-zinc-400'}`} />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-200 mb-1">Upload your Resume</h3>
                  <p className="text-sm text-zinc-500 mb-6 text-center max-w-xs">
                    Drag and drop your PDF file here, or click to browse from your computer.
                  </p>
                  <button 
                    onClick={() => inputRef.current?.click()}
                    className="px-5 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-zinc-200 transition-colors"
                  >
                    Select PDF
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <div className="flex items-center gap-3 bg-zinc-800/50 px-4 py-3 rounded-lg border border-zinc-700 w-full max-w-sm mb-6">
                    <FileText className="w-6 h-6 text-primary-400 flex-shrink-0" />
                    <span className="text-sm text-zinc-200 truncate">{file.name}</span>
                    <button onClick={removeFile} className="ml-auto text-zinc-500 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button 
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full max-w-sm flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing PDF...
                      </>
                    ) : (
                      'Confirm & Process'
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
