'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Coffee, Sun, Newspaper, Quote, Sparkles, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function MorningRitual() {
  const [location, setLocation] = useState('Mariefred, Sweden');
  const [routine, setRoutine] = useState('Pour a fresh cup of coffee and walk down to the lake');
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [agentsInvoked, setAgentsInvoked] = useState([]);

  const steps = [
    { id: 'discover', label: 'Querying ARD Registry for specialized agents...', icon: Sparkles },
    { id: 'verify', label: 'Verifying cryptographic signatures & trust scores...', icon: ShieldCheck },
    { id: 'weather', label: 'Executing Weather Agent (Open-Meteo API)...', icon: Sun },
    { id: 'news', label: 'Querying News Agent (Twain Corpus RAG index)...', icon: Newspaper },
    { id: 'quotes', label: 'Fetching quote from Verified Quote Collector...', icon: Quote },
    { id: 'synthesize', label: 'Invoking Gemini: Twain is drafting your morning brief...', icon: Loader2 }
  ];

  // Simulate orchestrator steps for visual feedback
  useEffect(() => {
    let timer;
    if (loading && currentStep < steps.length - 1) {
      const delays = [800, 1000, 800, 800, 800, 1500];
      timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, delays[currentStep]);
    }
    return () => clearTimeout(timer);
  }, [loading, currentStep]);

  const handleRunTwain = async () => {
    setLoading(true);
    setCurrentStep(0);
    setBriefing('');
    setAgentsInvoked([]);

    try {
      // Trigger Quote Collector collect phase to ensure DB has quotes
      await fetch('/api/agents/quote-collector?action=collect', { method: 'POST' }).catch(() => {});

      const res = await fetch('/api/agents/agent-twain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location, routine }),
      });
      const data = await res.json();
      
      if (data.success) {
        setBriefing(data.briefing);
        setAgentsInvoked(data.agents_invoked || []);
      } else {
        setBriefing(`Alas, the machine encountered a hitch: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      setBriefing(`Confound it! The connection faltered: ${err.message}`);
    } finally {
      // Keep loading spinner until Gemini returns, then finish step
      setCurrentStep(steps.length);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 selection:bg-amber-500/30 selection:text-amber-200">
      <div className="w-full max-w-2xl bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative Golden Ambient Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="text-center mb-8 relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 mb-2">
              Agent Twain Morning Ritual
            </h1>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              An ARD-driven Morning Briefing Orchestrator. Waking up in 2026 with 190 years of wit.
            </p>
          </motion.div>
        </div>

        {/* Inputs */}
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Your Current Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-5 h-5 text-amber-500/70" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                placeholder="Where are you waking up?"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Your Morning Routine
            </label>
            <div className="relative">
              <Coffee className="absolute left-3 top-3 w-5 h-5 text-amber-500/70" />
              <textarea
                value={routine}
                onChange={(e) => setRoutine(e.target.value)}
                rows={2}
                className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl py-2.5 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
                placeholder="What is your ritual?"
              />
            </div>
          </div>
        </div>

        {/* Orchestrator Trigger Button */}
        <div className="mb-8">
          <button
            onClick={handleRunTwain}
            disabled={loading}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
              loading
                ? 'bg-amber-500/20 text-amber-400 cursor-not-allowed border border-amber-500/30'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/20 active:scale-[0.98] cursor-pointer'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Orchestrating Agents...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Run Twain Morning Ritual
              </>
            )}
          </button>
        </div>

        {/* Dynamic Stepper Checklist */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-zinc-950/40 border border-zinc-850 rounded-xl p-5 mb-8 space-y-3"
            >
              <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2 border-b border-zinc-800/80 pb-2 flex items-center justify-between">
                <span>Agentic Resource Discovery (ARD) Pipeline</span>
                <span className="text-amber-500 text-[10px] animate-pulse">Processing</span>
              </h3>
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isCompleted = currentStep > idx;
                const isCurrent = currentStep === idx;
                const isPending = currentStep < idx;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 text-xs transition-colors duration-300 ${
                      isCompleted ? 'text-zinc-500' : isCurrent ? 'text-amber-400 font-medium' : 'text-zinc-700'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <Icon className={`w-4 h-4 text-amber-400 shrink-0 ${step.id === 'synthesize' ? 'animate-spin' : 'animate-pulse'}`} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-zinc-800 shrink-0 flex items-center justify-center text-[9px] text-zinc-700 font-bold">
                        {idx + 1}
                      </div>
                    )}
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Briefing Result */}
        <AnimatePresence>
          {briefing && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-6 border-t border-zinc-800/80 pt-6"
            >
              <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-6 relative overflow-hidden">
                <Quote className="absolute right-4 top-4 w-12 h-12 text-zinc-900 pointer-events-none" />
                
                <h3 className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Twain's Dispatch Complete
                </h3>

                <div className="prose prose-invert prose-sm text-zinc-300 leading-relaxed font-serif max-w-none space-y-4">
                  {briefing.split('\n\n').map((paragraph, pIdx) => (
                    <p key={pIdx}>{paragraph}</p>
                  ))}
                </div>

                {agentsInvoked.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-zinc-800/50 flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mr-1">
                      Verified Discovered Agents:
                    </span>
                    {agentsInvoked.map((agent) => (
                      <span
                        key={agent}
                        className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full"
                      >
                        {agent}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
