import React, { useState } from 'react';
import { ModuleContent } from '../types';
import { 
  X, ChevronRight, ChevronLeft, BookOpen, 
  HelpCircle, Award, CheckCircle2, Info, ArrowLeft,
  PieChart as ChartIcon, Image as ImageIcon, Video as VideoIcon, ClipboardList as TutorialIcon, 
  ChevronDown, Download, ShieldCheck, RefreshCw, AlertTriangle, FileJson, FileText, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AssessmentView from './AssessmentView';
import VisualRenderer from './VisualRenderer';
import { cn } from '../lib/utils';
import { reviewModule } from '../services/geminiService';

interface ModulePlayerProps {
  module: ModuleContent;
  onClose: () => void;
  onUpdateModule: (module: ModuleContent) => void;
  onComplete?: (score: number, maxScore: number, timeSeconds: number, answers: number[]) => void;
}

export default function ModulePlayer({ module, onClose, onUpdateModule, onComplete }: ModulePlayerProps) {
  const [currentStep, setCurrentStep] = useState<'hero' | 'instructions' | 'content' | 'assessment' | 'summary' | 'badge'>('hero');
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [showReviewSidebar, setShowReviewSidebar] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

  const handleReview = async () => {
    setIsReviewing(true);
    try {
      const updated = await reviewModule(module);
      onUpdateModule(updated);
      alert("Module gecontroleerd en waar nodig gecorrigeerd.");
    } catch (error) {
      console.error("Review failed:", error);
      alert("Review tool fout.");
    } finally {
      setIsReviewing(false);
    }
  };

  const exportAsJson = () => {
    const blob = new Blob([JSON.stringify(module, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${module.id}.json`;
    a.click();
  };

  const exportAsMarkdown = () => {
    const md = `# ${module.title}\n\n## Hero\n${module.hero.introduction}\n\n## Instructies\n${module.instructions.join('\n')}\n\n## Content\n${module.learningContent.map(c => `### ${c.sectionTitle}\n${c.text}`).join('\n\n')}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${module.id}.md`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col font-sans overflow-hidden text-black selection:bg-black selection:text-white">
      {/* Background Atmosphere - Simplified for light theme */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-gray-50 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-gray-50 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Header */}
      <div className="h-20 border-b border-gray-100 flex items-center justify-between px-12 shrink-0 bg-white/80 backdrop-blur-xl z-10">
        <div className="flex items-center gap-12">
          <button 
            onClick={onClose}
            className="group flex items-center gap-3 text-sm font-bold text-gray-400 hover:text-black transition-all"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-2 transition-transform" />
            Sluit module
          </button>
          <div className="flex flex-col">
             <h2 className="text-lg font-bold font-display uppercase tracking-tight">{module.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold uppercase tracking-widest text-gray-400">
              {module.department} // {module.level}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Module Content */}
        <div className="flex-1 overflow-y-auto relative p-12 sm:p-24 md:p-32 custom-scrollbar">
          <AnimatePresence mode="wait">
            {currentStep === 'hero' && (
              <motion.div 
                key="hero"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="max-w-4xl mx-auto space-y-12 py-12"
              >
                <div className="space-y-6 border-l-[6px] border-black pl-10">
                  <h1 className="text-4xl font-bold tracking-tight font-display uppercase leading-tight">{module.hero.title}</h1>
                  <p className="text-gray-500 leading-relaxed text-lg max-w-2xl">{module.hero.introduction}</p>
                </div>
                <button 
                  onClick={() => setCurrentStep('instructions')}
                  className="px-10 py-4 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all uppercase tracking-widest shadow-lg"
                >
                  Start module
                </button>
              </motion.div>
            )}

            {currentStep === 'instructions' && (
              <motion.div 
                key="instructions"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-3xl mx-auto space-y-12"
              >
                <div className="space-y-6">
                  {module.instructions.map((inst, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-8 items-start p-8 border border-gray-100 rounded-2xl bg-gray-50/50 group"
                    >
                      <span className="text-lg font-bold text-white bg-black w-10 h-10 flex items-center justify-center rounded-lg">0{i+1}</span>
                      <p className="text-lg leading-relaxed text-gray-700 pt-1">{inst}</p>
                    </motion.div>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentStep('content')}
                  className="w-full py-5 bg-black text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
                >
                  Begrepen, start de uitleg
                </button>
              </motion.div>
            )}

            {currentStep === 'content' && (
              <motion.div 
                key={`content-${currentContentIndex}`} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-2 gap-20 items-center min-h-full"
              >
                <div className="space-y-12">
                  <div className="space-y-3">
                    <h2 className="text-3xl font-bold font-display leading-tight uppercase tracking-tight">{module.learningContent[currentContentIndex].sectionTitle}</h2>
                  </div>
                  
                  <div className="p-8 bg-gray-50 border-l-[4px] border-black rounded-r-xl shadow-sm">
                    <p className="text-gray-700 leading-relaxed text-xl italic">{module.learningContent[currentContentIndex].text}</p>
                  </div>
                  
                  <div className="flex gap-8 pt-8">
                    <button 
                      onClick={() => {
                        if (currentContentIndex > 0) setCurrentContentIndex(i => i - 1);
                        else setCurrentStep('instructions');
                      }}
                      className="px-10 py-4 border border-gray-200 text-sm font-bold rounded-xl hover:bg-gray-100 transition-all uppercase tracking-widest text-gray-400 hover:text-black"
                    >
                      Vorige
                    </button>
                    <button 
                      onClick={() => {
                        if (currentContentIndex < module.learningContent.length - 1) setCurrentContentIndex(i => i + 1);
                        else setCurrentStep('assessment');
                      }}
                      className="flex-1 px-10 py-4 bg-black text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all uppercase tracking-widest"
                    >
                      Volgende stap
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50/50 border border-gray-100 rounded-[2.5rem] shadow-xl flex items-center justify-center min-h-[600px] p-16 relative overflow-hidden group">
                  <div className="relative z-10 w-full h-full flex items-center justify-center">
                    <VisualRenderer 
                      type={module.learningContent[currentContentIndex].visualType} 
                      data={module.learningContent[currentContentIndex].visualData} 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 'assessment' && (
              <div className="max-w-5xl mx-auto py-12">
                <AssessmentView 
                  questions={module.assessment} 
                  onComplete={(score, max, time, ans) => {
                    if (onComplete) onComplete(score, max, time, ans);
                    setCurrentStep('summary');
                  }} 
                />
              </div>
            )}

            {currentStep === 'summary' && (
              <div className="max-w-3xl mx-auto space-y-16 text-center py-20">
                <div className="space-y-6">
                  <div className="p-12 bg-gray-50 border border-gray-100 rounded-3xl text-xl leading-relaxed text-gray-700 italic font-medium shadow-sm">
                    "{module.summary}"
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentStep('badge')}
                  className="w-full py-6 bg-black text-white rounded-xl text-lg font-bold uppercase tracking-widest shadow-xl hover:bg-gray-800 transition-all"
                >
                  Afronden
                </button>
              </div>
            )}

            {currentStep === 'badge' && (
              <div className="max-w-xl mx-auto text-center space-y-12 py-24">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gray-100 blur-[80px] rounded-full scale-150 animate-pulse" />
                  <div className="w-48 h-48 border-[8px] border-black rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl relative z-10 bg-white">
                    <Award size={80} className="text-black" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold font-display uppercase tracking-tight leading-none text-black">{module.badge.name}</h2>
                  <p className="text-base text-gray-400 uppercase tracking-widest italic">Module succesvol afgerond</p>
                </div>
                <div className="pt-16">
                   <button 
                    onClick={onClose}
                    className="w-full py-6 bg-black text-white rounded-xl text-lg font-bold hover:bg-gray-800 transition-all uppercase tracking-widest"
                  >
                    Terug naar het overzicht
                  </button>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Tool */}
        <AnimatePresence>
          {showReviewSidebar && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="w-[400px] border-l border-gray-100 bg-white z-20 flex flex-col shadow-2xl"
            >
              <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <h3 className="font-bold text-black uppercase tracking-widest text-xs">Analytics & Export</h3>
                </div>
                <button onClick={() => setShowReviewSidebar(false)} className="text-gray-300 hover:text-black transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-16 custom-scrollbar">
                <div className="space-y-8">
                  <h4 className="font-bold text-gray-300 uppercase tracking-widest text-[10px]">Quality Engine</h4>
                  <p className="text-gray-500 leading-relaxed text-sm">
                    Inhoudelijke validatie van didactische structuren en precisie.
                  </p>
                  <button 
                    onClick={handleReview}
                    disabled={isReviewing}
                    className="w-full py-5 border border-black text-black rounded-xl font-bold text-xs flex items-center justify-center gap-4 disabled:opacity-30 hover:bg-black hover:text-white transition-all uppercase tracking-widest"
                  >
                    {isReviewing ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                    Optimaliseer content
                  </button>
                </div>

                <div className="space-y-8">
                  <h4 className="font-bold text-gray-300 uppercase tracking-widest text-[10px]">Export Hub</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={exportAsJson}
                      className="p-6 border border-gray-100 rounded-xl flex items-center justify-between hover:border-black group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <FileJson size={24} className="text-gray-300 group-hover:text-black" />
                        <span className="font-bold text-gray-600 uppercase text-xs group-hover:text-black">LMS JSON</span>
                      </div>
                      <Download size={20} className="text-gray-300" />
                    </button>
                    <button 
                      onClick={exportAsMarkdown}
                      className="p-6 border border-gray-100 rounded-xl flex items-center justify-between hover:border-black group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <FileText size={24} className="text-gray-300 group-hover:text-black" />
                        <span className="font-bold text-gray-600 uppercase text-xs group-hover:text-black">TEXT DOC</span>
                      </div>
                      <Download size={20} className="text-gray-300" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
