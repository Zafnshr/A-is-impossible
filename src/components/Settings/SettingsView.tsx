import React from 'react';
import {
  Sliders,
  Sun,
  Moon,
  Type,
  Sparkles,
  Keyboard,
  Shuffle,
  Eye,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { UserSettings } from '../../types';
import { createDefaultSettings } from '../../services/defaultSettings';
import { Tooltip } from '../Tooltip';

interface SettingsViewProps {
  settings?: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  // Safe fallback to prevent any undefined crash
  const safeSettings: UserSettings = settings || createDefaultSettings('workspace');

  const shuffleOptions = safeSettings.defaultShuffleOptions || {
    shuffleQuestions: false,
    shuffleAnswers: false,
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-subtle">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary flex items-center gap-2">
          <Sliders className="w-6 h-6 text-cyan-500" />
          Settings & Preferences
        </h1>
        <p className="text-xs text-secondary mt-1">
          Customize interface themes, typography scale, keyboard shortcuts, and study defaults.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Theme & Appearance */}
        <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Sun className="w-4 h-4 text-cyan-500" /> Interface Theme & Contrast
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'dark' })}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition ${
                safeSettings.theme === 'dark'
                  ? 'border-cyan-500 bg-cyan-950/20 text-cyan-400 ring-1 ring-cyan-500'
                  : 'border-subtle bg-subtle text-secondary hover:text-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="font-bold text-primary">Dark Mode</div>
                  <div className="text-[11px] text-muted">Deep dark palette for late night study</div>
                </div>
              </div>
              {safeSettings.theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ theme: 'light' })}
              className={`p-4 rounded-xl border text-left flex items-center justify-between transition ${
                safeSettings.theme === 'light'
                  ? 'border-cyan-500 bg-cyan-50 text-cyan-800 ring-1 ring-cyan-500'
                  : 'border-subtle bg-subtle text-secondary hover:text-primary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-amber-500" />
                <div>
                  <div className="font-bold text-primary">Light Mode</div>
                  <div className="text-[11px] text-muted">Crisp daylight layout with high contrast</div>
                </div>
              </div>
              {safeSettings.theme === 'light' && <CheckCircle2 className="w-4 h-4 text-cyan-600" />}
            </button>
          </div>

          {/* High Contrast Toggle */}
          <div className="p-3.5 rounded-xl bg-subtle border border-subtle flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-primary">High-Contrast Mode</span>
              <p className="text-[11px] text-muted">
                Enhance contrast borders and text weight for optimal readability.
              </p>
            </div>
            <input
              type="checkbox"
              checked={Boolean(safeSettings.highContrast)}
              onChange={(e) => onUpdateSettings({ highContrast: e.target.checked })}
              className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        {/* 2. Typography & Font Sizing */}
        <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Type className="w-4 h-4 text-cyan-500" /> Typography Sizing
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-secondary font-semibold mb-2">Overall Interface Scale</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'normal', label: 'Standard (100%)' },
                  { id: 'large', label: 'Large (110%)' },
                  { id: 'xlarge', label: 'Extra Large (120%)' },
                ].map((scale) => (
                  <button
                    key={scale.id}
                    type="button"
                    onClick={() => onUpdateSettings({ fontSize: scale.id as any })}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition ${
                      safeSettings.fontSize === scale.id
                        ? 'bg-cyan-600 text-slate-950 font-bold border-cyan-500'
                        : 'bg-subtle border-subtle text-secondary hover:text-primary'
                    }`}
                  >
                    {scale.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-secondary font-semibold mb-2">
                Question Stem & Option Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'normal', label: 'Compact' },
                  { id: 'relaxed', label: 'Relaxed (Recommended)' },
                  { id: 'large', label: 'Large Text' },
                ].map((qScale) => (
                  <button
                    key={qScale.id}
                    type="button"
                    onClick={() => onUpdateSettings({ questionFontSize: qScale.id as any })}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition ${
                      safeSettings.questionFontSize === qScale.id
                        ? 'bg-cyan-600 text-slate-950 font-bold border-cyan-500'
                        : 'bg-subtle border-subtle text-secondary hover:text-primary'
                    }`}
                  >
                    {qScale.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Study Defaults & Shuffling */}
        <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Shuffle className="w-4 h-4 text-cyan-500" /> Study Defaults & Shuffling
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-subtle border border-subtle flex items-center justify-between">
              <div>
                <span className="font-semibold text-primary">Auto-Reveal Explanation on Submit</span>
                <p className="text-[11px] text-muted">
                  Immediately open the rationale card when submitting an answer choice.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(safeSettings.autoRevealOnSubmit)}
                onChange={(e) => onUpdateSettings({ autoRevealOnSubmit: e.target.checked })}
                className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-subtle border border-subtle flex items-center justify-between">
              <div>
                <span className="font-semibold text-primary">Default Shuffle Questions</span>
                <p className="text-[11px] text-muted">
                  Automatically randomize question order for new sessions.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(shuffleOptions.shuffleQuestions)}
                onChange={(e) =>
                  onUpdateSettings({
                    defaultShuffleOptions: {
                      shuffleQuestions: e.target.checked,
                      shuffleAnswers: Boolean(shuffleOptions.shuffleAnswers),
                    },
                  })
                }
                className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-subtle border border-subtle flex items-center justify-between">
              <div>
                <span className="font-semibold text-primary">Default Shuffle Answer Choices</span>
                <p className="text-[11px] text-muted">
                  Randomize MCQ option letters while retaining correct answer mapping.
                </p>
              </div>
              <input
                type="checkbox"
                checked={Boolean(shuffleOptions.shuffleAnswers)}
                onChange={(e) =>
                  onUpdateSettings({
                    defaultShuffleOptions: {
                      shuffleQuestions: Boolean(shuffleOptions.shuffleQuestions),
                      shuffleAnswers: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded text-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 4. Keyboard Shortcuts Reference */}
        <div className="p-6 rounded-2xl bg-surface border border-subtle shadow-card space-y-4">
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-cyan-500" /> Active Keyboard Shortcuts
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {[
              { key: 'Left Arrow (←)', action: 'Previous Question' },
              { key: 'Right Arrow (→)', action: 'Next Question' },
              { key: 'Enter (↵)', action: 'Submit Answer' },
              { key: 'F', action: 'Favorite Question' },
              { key: 'R', action: 'Flag Question' },
              { key: 'Spacebar', action: 'Reveal Correct Answer' },
              { key: 'Ctrl + K / ⌘K', action: 'Global Search' },
              { key: 'Ctrl + Z', action: 'Undo Question Edit' },
              { key: 'Ctrl + Y', action: 'Redo Question Edit' },
            ].map((sc, i) => (
              <div
                key={i}
                className="p-2.5 rounded-lg bg-subtle border border-subtle flex items-center justify-between"
              >
                <span className="text-secondary">{sc.action}</span>
                <kbd className="px-2 py-0.5 rounded bg-surface border border-subtle font-mono text-[11px] text-primary font-bold shadow-sm">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
