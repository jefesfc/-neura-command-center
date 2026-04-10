import React from 'react';
import { Check, Loader2, AlertCircle, SkipForward } from 'lucide-react';

const STEP_LABELS = {
  copy: 'Copy Agent — GPT-4o',
  image: 'Image Agent — Gemini',
  layout: 'Layout Agent — Playwright',
  caption: 'Caption Agent — GPT-4o mini',
};

export default function ProgressStep({ step, state }) {
  const label = STEP_LABELS[step] || step;
  const { status } = state || {};

  return (
    <div className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-300 ${
      status === 'running' ? 'border-teal/40 bg-teal/5' :
      status === 'done' ? 'border-white/10 bg-white/3' :
      status === 'skipped' ? 'border-white/5 bg-white/2' :
      'border-white/5'
    }`}>
      <div className="mt-0.5 shrink-0">
        {status === 'running' && <Loader2 size={18} className="text-teal animate-spin" />}
        {status === 'done' && <Check size={18} className="text-teal" />}
        {status === 'skipped' && <SkipForward size={18} className="text-white/30" />}
        {status === 'error' && <AlertCircle size={18} className="text-red-400" />}
        {!status && <div className="w-4.5 h-4.5 rounded-full border border-white/20" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${
          status === 'running' ? 'text-teal' :
          status === 'done' ? 'text-white/80' :
          'text-white/30'
        }`}>
          {label}
        </div>
        {status === 'running' && (
          <div className="text-xs text-white/40 mt-0.5 animate-pulse-teal">Procesando...</div>
        )}
        {status === 'done' && state.headline && (
          <div className="text-xs text-white/40 mt-0.5 truncate">"{state.headline}"</div>
        )}
        {status === 'done' && state.pngUrl && (
          <div className="text-xs text-teal/60 mt-0.5">PNG generado</div>
        )}
        {status === 'skipped' && state.warning && (
          <div className="text-xs text-yellow-400/60 mt-0.5">{state.warning}</div>
        )}
      </div>
    </div>
  );
}
