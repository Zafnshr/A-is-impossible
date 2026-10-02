import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Download, Trash2, ShieldAlert } from 'lucide-react';
import { dbService } from '../services/db';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isExportingBackup: boolean;
}

export class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isExportingBackup: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      isExportingBackup: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CRITICAL: RootErrorBoundary caught unhandled application error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearSessionAndReload = async () => {
    try {
      await dbService.clearActiveSession('workspace');
      localStorage.removeItem('a_plus_active_session');
    } catch {
      // Ignore
    }
    window.location.reload();
  };

  private handleEmergencyExport = async () => {
    this.setState({ isExportingBackup: true });
    try {
      const dump = await dbService.exportFullDump();
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `a-is-impossible-emergency-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Emergency backup failed: ${err?.message || 'Database inaccessible'}`);
    } finally {
      this.setState({ isExportingBackup: false });
    }
  };

  private handleFactoryResetAndReload = async () => {
    if (window.confirm('Reset local application state? Your saved decks in local storage will be cleared. Continue?')) {
      try {
        await dbService.factoryResetPlatform();
      } catch {
        localStorage.clear();
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans antialiased overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
                <AlertOctagon className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">System Diagnostics & Recovery</h1>
                <p className="text-xs text-slate-400 font-mono">A is Impossible · Application Safety Shield</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4" />
                <span>Runtime Exception Caught</span>
              </div>
              <p className="text-xs font-mono text-slate-300 break-words leading-relaxed">
                {this.state.error?.message || 'An unexpected runtime error prevented the application from rendering.'}
              </p>
            </div>

            {this.state.errorInfo?.componentStack && (
              <details className="text-[11px] text-slate-500 font-mono bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <summary className="cursor-pointer hover:text-slate-300">View Diagnostic Call Stack</summary>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap max-h-40 text-[10px] text-slate-400">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearSessionAndReload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 transition active:scale-95"
              >
                <span>Clear Session & Restart</span>
              </button>

              <button
                type="button"
                onClick={this.handleEmergencyExport}
                disabled={this.state.isExportingBackup}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs border border-slate-700 transition active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>{this.state.isExportingBackup ? 'Exporting...' : 'Emergency Data Backup'}</span>
              </button>

              <button
                type="button"
                onClick={this.handleFactoryResetAndReload}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/30 transition active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset to Clean State</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
