import React, { useState, useEffect, useRef } from 'react';
import {
  FolderPlus,
  UploadCloud,
  FileText,
  FileUp,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  Plus,
} from 'lucide-react';
import { Deck, Question, UserPdfUpload } from '../../types';
import { dbService } from '../../services/db';
import { LibraryExplorer } from '../Decks/LibraryExplorer';
import { PDFViewerModal } from '../PDF/PDFViewerModal';

interface MyContentViewProps {
  decks: Deck[];
  questions: Question[];
  onOpenDeckDetail: (deck: Deck) => void;
  onStartStudyDeck: (deckId: string) => void;
  onCreateDeckPrompt: (year?: string, module?: string, subject?: string) => void;
  onRenameDeck?: (deckId: string, newLectureName: string) => void;
  onDeleteDeck?: (deckId: string) => void;
  onOpenWorkflowGuide?: () => void;
  onOpenImportPrompt?: () => void;
  onSwitchToOfficial?: () => void;
}

export const MyContentView: React.FC<MyContentViewProps> = ({
  decks,
  questions,
  onOpenDeckDetail,
  onStartStudyDeck,
  onCreateDeckPrompt,
  onRenameDeck,
  onDeleteDeck,
  onOpenWorkflowGuide,
  onOpenImportPrompt,
  onSwitchToOfficial,
}) => {
  const [subTab, setSubTab] = useState<'decks' | 'pdfs'>('decks');
  const [userPdfs, setUserPdfs] = useState<UserPdfUpload[]>([]);
  const [loadingPdfs, setLoadingPdfs] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState<{ url: string; title: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load personal PDFs from IndexedDB for the current user (or guest)
  const loadPdfs = async () => {
    try {
      setLoadingPdfs(true);
      const list = await dbService.getUserPdfUploads('current_user');
      setUserPdfs(list);
    } catch (err) {
      console.error('[MyContentView] Error loading user PDFs:', err);
    } finally {
      setLoadingPdfs(false);
    }
  };

  useEffect(() => {
    loadPdfs();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Please select a valid PDF file.');
      return;
    }

    try {
      // Create local blob URL for reading
      const blobUrl = URL.createObjectURL(file);
      const newPdf: UserPdfUpload = {
        id: `pdf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: 'current_user',
        title: file.name.replace(/\.pdf$/i, ''),
        pdfUrl: blobUrl,
        fileSizeBytes: file.size,
        pageCount: 1, // Will be resolved dynamically by viewer
        createdAt: Date.now(),
      };

      await dbService.saveUserPdfUpload(newPdf);
      setUserPdfs((prev) => [newPdf, ...prev]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('[MyContentView] Error uploading PDF:', err);
      alert('Unable to process PDF file. Please try again.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hidden file input for personal PDF upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-surface border border-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/20">
            <Layers className="w-3.5 h-3.5" />
            <span>Personal Learning Workspace</span>
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tight">
            My Content & Sandbox
          </h1>
          <p className="text-xs text-muted leading-relaxed">
            Create custom flashcard decks, import external files from Anki or CSV, and view your personal
            lecture slide PDFs. Stored safely in your local workspace.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onOpenImportPrompt && (
            <button
              type="button"
              onClick={onOpenImportPrompt}
              className="px-3.5 py-2 rounded-xl bg-subtle hover:bg-subtle/80 text-secondary hover:text-primary text-xs font-bold border border-subtle transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5 text-cyan-500" />
              <span>Import Anki / CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onCreateDeckPrompt()}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Deck</span>
          </button>
        </div>
      </div>

      {/* Subtab Navigation: Personal Decks vs Personal PDFs */}
      <div className="flex items-center justify-between border-b border-subtle pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('decks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'decks'
                ? 'bg-primary text-canvas shadow-xs'
                : 'text-secondary hover:text-primary bg-subtle/50 hover:bg-subtle'
            }`}
          >
            <span>Personal Decks ({decks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('pdfs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'pdfs'
                ? 'bg-primary text-canvas shadow-xs'
                : 'text-secondary hover:text-primary bg-subtle/50 hover:bg-subtle'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Personal PDFs ({userPdfs.length})</span>
          </button>
        </div>

        {onSwitchToOfficial && (
          <button
            type="button"
            onClick={onSwitchToOfficial}
            className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Switch to Official Curriculum</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Pane Content */}
      {subTab === 'decks' ? (
        <LibraryExplorer
          decks={decks}
          questions={questions}
          onOpenDeckDetail={onOpenDeckDetail}
          onStartStudyDeck={onStartStudyDeck}
          onCreateDeckPrompt={onCreateDeckPrompt}
          onRenameDeck={onRenameDeck}
          onDeleteDeck={onDeleteDeck}
          onOpenWorkflowGuide={onOpenWorkflowGuide}
        />
      ) : (
        /* Personal PDFs Explorer */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-primary">Uploaded Lecture Slides & Notes</h3>
              <p className="text-xs text-muted">
                Read your own slide decks using the high-performance distraction-free PDF viewer.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Upload PDF Document</span>
            </button>
          </div>

          {userPdfs.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-surface border border-subtle space-y-4">
              <FileText className="w-12 h-12 text-muted mx-auto stroke-1" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-primary">No Personal PDFs Uploaded</h4>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Upload your medical faculty slide decks, clinical guidelines, or lecture handouts to
                  read them here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer shadow-sm"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Upload First PDF</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userPdfs.map((pdf) => (
                <div
                  key={pdf.id}
                  className="p-5 rounded-2xl bg-surface border border-subtle hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-primary truncate" title={pdf.title}>
                        {pdf.title}
                      </h4>
                      <p className="text-[11px] text-muted mt-0.5">
                        {Math.round(pdf.fileSizeBytes / 1024)} KB • Added{' '}
                        {new Date(pdf.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-subtle flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setActivePdfUrl({ url: pdf.pdfUrl, title: pdf.title })}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open in Reader</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {activePdfUrl && (
        <PDFViewerModal
          isOpen={true}
          onClose={() => setActivePdfUrl(null)}
          pdfUrl={activePdfUrl.url}
          title={activePdfUrl.title}
        />
      )}
    </div>
  );
};
