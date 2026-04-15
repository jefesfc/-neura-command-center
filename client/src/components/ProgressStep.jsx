import React from 'react';
import { Check, Loader2, AlertCircle, SkipForward } from 'lucide-react';

const STEP_LABELS = {
  'creative-director': 'Creative Director — Strategy',
  copy:       'Copy Agent — GPT-4o',
  image:      'Image Agent — Gemini',
  carousel:   'Carousel Agent — GPT-4o',
  layout:     'Layout Agent — Render',
  caption:    'Caption Agent — GPT-4o mini',
  validation: 'Creative Director — Validation',
};

export default function ProgressStep({ step, state }) {
  const label = STEP_LABELS[step] || step;
  const { status } = state || {};

  const borderColor =
    status === 'running' ? 'rgba(42,127,168,0.35)' :
    status === 'done'    ? 'rgba(26,21,10,0.08)' :
    status === 'skipped' ? 'rgba(26,21,10,0.05)' :
    'rgba(26,21,10,0.06)';

  const bgColor =
    status === 'running' ? 'rgba(42,127,168,0.06)' :
    status === 'done'    ? 'rgba(26,21,10,0.02)' :
    'transparent';

  const labelColor =
    status === 'running' ? 'rgb(var(--tw-teal))' :
    status === 'done'    ? 'rgb(var(--color-text))' :
    'rgb(var(--color-text-muted))';

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '16px',
      padding: '14px 16px', borderRadius: '10px',
      border: `1px solid ${borderColor}`,
      background: bgColor,
      transition: 'all 0.3s',
    }}>
      <div style={{ marginTop: '2px', flexShrink: 0 }}>
        {status === 'running' && <Loader2 size={18} className="animate-spin" style={{ color: 'rgb(var(--tw-teal))' }} />}
        {status === 'done'    && <Check size={18} style={{ color: 'rgb(var(--tw-teal))' }} />}
        {status === 'skipped' && <SkipForward size={18} style={{ color: 'rgb(var(--color-text-muted))' }} />}
        {status === 'error'   && <AlertCircle size={18} style={{ color: '#b85050' }} />}
        {!status && (
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid rgba(26,21,10,0.18)' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: labelColor }}>
          {label}
        </div>
        {status === 'running' && (
          <div style={{ fontSize: '11px', color: 'rgb(var(--color-text-muted))', marginTop: '2px' }}
            className="animate-pulse-teal">
            Procesando...
          </div>
        )}
        {status === 'done' && state.content_angle && (
          <div style={{ fontSize: '11px', color: 'rgb(var(--color-text-muted))', marginTop: '2px', fontStyle: 'italic' }}
            className="truncate">
            "{state.content_angle}"
          </div>
        )}
        {status === 'done' && state.headline && (
          <div style={{ fontSize: '11px', color: 'rgb(var(--color-text-muted))', marginTop: '2px' }}
            className="truncate">
            "{state.headline}"
          </div>
        )}
        {status === 'done' && state.pngUrl && (
          <div style={{ fontSize: '11px', color: 'rgb(var(--tw-teal))', marginTop: '2px', opacity: 0.7 }}>
            PNG generado
          </div>
        )}
        {status === 'skipped' && state.warning && (
          <div style={{ fontSize: '11px', color: 'rgba(180,140,50,0.8)', marginTop: '2px' }}>
            {state.warning}
          </div>
        )}
      </div>
    </div>
  );
}
