import React, { useState } from 'react';
import {
  X,
  Sliders,
  CheckCircle2,
  ListOrdered,
  Shuffle,
  Layers,
  ArrowRight,
  Database,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import { OrderDebugInfo } from '../../types';

interface OrderDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  debugInfo?: OrderDebugInfo;
  sessionTitle: string;
}

export const OrderDebugModal: React.FC<OrderDebugModalProps> = ({
  isOpen,
  onClose,
  debugInfo,
  sessionTitle,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'pipeline' | 'before' | 'after'>('pipeline');

  if (!debugInfo) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
        <div className="w-full max-w-lg bg-surface border border-subtle rounded-3xl shadow-dropdown p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-subtle">
            <h3 className="text-sm font-bold text-primary">Order Debug View</h3>
            <button onClick={onClose} className="p-1 rounded text-muted hover:text-primary">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-secondary">
            No order pipeline diagnostics recorded for this session.
          </p>
        </div>
      </div>
    );
  }

  const getModeBadge = () => {
    switch (debugInfo.selectedMode) {
      case 'sequential':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            <ListOrdered className="w-3.5 h-3.5" />
            Sequential Mode (Original Order Preserved)
          </span>
        );
      case 'shuffled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400">
            <Shuffle className="w-3.5 h-3.5" />
            Fully Shuffled Mode (Randomized)
          </span>
        );
      case 'custom':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
            <Sliders className="w-3.5 h-3.5" />
            Custom Mode
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl bg-surface border border-subtle rounded-3xl shadow-dropdown p-6 space-y-5 max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-subtle shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                <Sliders className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-primary">Question Order Engine Debug View</h2>
            </div>
            <p className="text-xs text-secondary">{sessionTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-primary transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-subtle border border-subtle text-xs shrink-0">
          <div>{getModeBadge()}</div>
          <div className="flex items-center gap-4 text-secondary font-mono text-[11px]">
            <span>Lectures: <b className="text-primary">{debugInfo.deckTitles.length}</b></span>
            <span>Questions: <b className="text-primary">{debugInfo.afterGeneration.totalQuestions}</b></span>
            <span>Generated: <b className="text-primary">{new Date(debugInfo.timestamp).toLocaleTimeString()}</b></span>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-subtle shrink-0 gap-2">
          {[
            { id: 'pipeline', label: 'Transformations Pipeline', icon: Cpu },
            { id: 'before', label: `Before Generation (${debugInfo.beforeGeneration.reduce((acc, g) => acc + g.questionCount, 0)})`, icon: Database },
            { id: 'after', label: `After Generation (${debugInfo.afterGeneration.totalQuestions})`, icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                    : 'border-transparent text-secondary hover:text-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: Transformations Pipeline */}
          {activeTab === 'pipeline' && (
            <div className="space-y-4">
              {/* Lecture Sequence Flow */}
              <div className="p-3.5 rounded-2xl bg-subtle border border-subtle space-y-2">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                  Lecture Resolution Sequence
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {debugInfo.deckTitles.map((title, i) => (
                    <React.Fragment key={i}>
                      <span className="px-2.5 py-1 rounded-lg bg-surface border border-subtle text-xs font-semibold text-primary">
                        {i + 1}. {title}
                      </span>
                      {i < debugInfo.deckTitles.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-muted" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Shuffling Flags */}
              {debugInfo.shuffleOptions && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-subtle border border-subtle">
                    <div className="text-muted text-[10px]">Shuffle Questions</div>
                    <div className="font-bold text-primary mt-0.5">
                      {debugInfo.shuffleOptions.shuffleQuestions ? 'Enabled' : 'Disabled (Sequential)'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-subtle border border-subtle">
                    <div className="text-muted text-[10px]">Shuffle Answers</div>
                    <div className="font-bold text-primary mt-0.5">
                      {debugInfo.shuffleOptions.shuffleAnswers ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-subtle border border-subtle">
                    <div className="text-muted text-[10px]">Shuffle Lectures</div>
                    <div className="font-bold text-primary mt-0.5">
                      {debugInfo.shuffleOptions.shuffleLectures ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </div>
              )}

              {/* Transformation Log */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
                  Engine Execution Log
                </span>
                <div className="p-3 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] space-y-1.5 border border-slate-800">
                  {debugInfo.transformations.map((trans, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 select-none">[{idx + 1}]</span>
                      <span className="leading-relaxed">{trans}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Before Generation Snapshot */}
          {activeTab === 'before' && (
            <div className="space-y-4">
              <p className="text-xs text-secondary">
                Questions grouped by their source lecture with original import sequence indices (<code>originalOrderIndex</code>).
              </p>
              {debugInfo.beforeGeneration.map((deckGroup, gIdx) => (
                <div key={gIdx} className="p-3.5 rounded-2xl bg-subtle border border-subtle space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-primary">
                      {gIdx + 1}. {deckGroup.deckTitle}
                    </h4>
                    <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                      {deckGroup.questionCount} questions
                    </span>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {deckGroup.questions.map((q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="flex items-center justify-between gap-2 p-1.5 px-2 rounded-lg bg-surface border border-subtle text-[11px]"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="w-6 font-mono text-cyan-500 font-bold shrink-0">
                            #{q.originalOrderIndex ?? qIdx + 1}
                          </span>
                          <span className="text-primary truncate">{q.stem}</span>
                        </div>
                        <span className="font-mono text-[10px] text-muted shrink-0">
                          {q.id.slice(-6)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: After Generation Snapshot */}
          {activeTab === 'after' && (
            <div className="space-y-3">
              <p className="text-xs text-secondary">
                Exact sequence of questions loaded into this study session:
              </p>
              <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
                {debugInfo.afterGeneration.questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="flex items-center justify-between gap-3 p-2 rounded-xl bg-subtle border border-subtle text-xs"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="w-7 h-6 rounded bg-surface border border-subtle font-mono text-[11px] font-bold flex items-center justify-center shrink-0 text-cyan-600 dark:text-cyan-400">
                        {idx + 1}
                      </span>
                      <div className="overflow-hidden">
                        <div className="text-primary font-medium truncate max-w-md">{q.stem}</div>
                        <div className="text-[10px] text-secondary font-mono">
                          From: {q.deckTitle} · Orig Index: #{q.originalOrderIndex ?? '?'}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-muted shrink-0">
                      {q.id.slice(-6)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-subtle flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-subtle hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-primary transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
