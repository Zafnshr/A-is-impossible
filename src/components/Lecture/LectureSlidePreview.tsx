import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText, Eye, Maximize2, Loader2 } from 'lucide-react';
import { officialContentService } from '../../services/officialContentService';
import {
  isGoogleDriveUrl,
  getGoogleDriveEmbedPreviewUrl,
} from '../../services/googleDrivePdf';

// Configure Mozilla PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('[LectureSlidePreview] Worker setup fallback:', e);
  }
}

export interface LectureSlidePreviewProps {
  pdfUrl?: string;
  title: string;
  pageCount?: number;
  onClick?: () => void;
  onPageCountDetected?: (count: number) => void;
}

export const LectureSlidePreview: React.FC<LectureSlidePreviewProps> = ({
  pdfUrl,
  title,
  pageCount,
  onClick,
  onPageCountDetected,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const cachedDocRef = useRef<any>(null);

  const isDrive = isGoogleDriveUrl(pdfUrl);

  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(pdfUrl) && !isDrive);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
  const [detectedPages, setDetectedPages] = useState<number | null>(null);

  // Render first page onto canvas ONLY for non-Google-Drive local/direct PDFs
  useEffect(() => {
    if (!pdfUrl || isDrive) {
      setIsLoading(false);
      setIsRendered(false);
      setHasError(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setHasError(false);

    const renderFirstPage = async () => {
      try {
        let doc = cachedDocRef.current;
        if (!doc) {
          if (pdfUrl.startsWith('idb://')) {
            const lectureId = pdfUrl.replace('idb://', '');
            const record = await officialContentService.getOfficialPdf(lectureId);
            if (record && record.fileData) {
              let buffer: ArrayBuffer;
              if (record.fileData instanceof ArrayBuffer) {
                buffer = record.fileData;
              } else if (record.fileData instanceof Blob) {
                buffer = await record.fileData.arrayBuffer();
              } else {
                buffer = (record.fileData as Uint8Array).buffer as ArrayBuffer;
              }
              if (isCancelled) return;
              doc = await pdfjsLib.getDocument({
                data: buffer,
                cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
                cMapPacked: true,
              }).promise;
            }
          }

          if (!doc) {
            try {
              const response = await fetch(pdfUrl);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              const arrayBuffer = await response.arrayBuffer();
              if (isCancelled) return;
              doc = await pdfjsLib.getDocument({
                data: arrayBuffer,
                cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
                cMapPacked: true,
              }).promise;
            } catch {
              if (isCancelled) return;
              doc = await pdfjsLib.getDocument({
                url: pdfUrl,
                cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
                cMapPacked: true,
              }).promise;
            }
          }
          cachedDocRef.current = doc;
        }

        if (isCancelled || !doc) return;

        if (doc.numPages) {
          setDetectedPages(doc.numPages);
          onPageCountDetected?.(doc.numPages);
        }

        const page = await doc.getPage(1);
        if (isCancelled) return;

        const unscaledViewport = page.getViewport({ scale: 1 });
        if (unscaledViewport.width && unscaledViewport.height) {
          setAspectRatio(unscaledViewport.width / unscaledViewport.height);
        }

        const container = containerRef.current;
        const canvas = canvasRef.current;
        if (!container || !canvas) return;

        const containerWidth = container.clientWidth || 800;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scale = (containerWidth / unscaledViewport.width) * dpr;
        const viewport = page.getViewport({ scale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
        }

        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });
        renderTaskRef.current = renderTask;

        await renderTask.promise;

        if (!isCancelled) {
          setIsRendered(true);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') return;
        console.warn('[LectureSlidePreview] Failed to render slide preview:', err);
        if (!isCancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    renderFirstPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfUrl, isDrive]);

  // 1. Clean Empty Placeholder when no PDF or Drive link is attached
  if (!pdfUrl) {
    return (
      <div
        style={{ aspectRatio: '16 / 9' }}
        className="relative w-full rounded-2xl bg-slate-900/90 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs flex flex-col items-center justify-center p-6 text-center gap-3"
      >
        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-200">No Slide Deck Attached Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Attach a Google Drive PDF link in the Admin Portal to enable interactive slide reading.
          </p>
        </div>
      </div>
    );
  }

  // 2. Live Google Drive Embed Preview Container
  if (isDrive) {
    return (
      <div
        style={{ aspectRatio: '16 / 9' }}
        className="relative w-full rounded-2xl bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs ring-1 ring-black/5 dark:ring-white/10"
      >
        <iframe
          src={getGoogleDriveEmbedPreviewUrl(pdfUrl)}
          className="w-full h-full border-0"
          allow="autoplay"
          title={title}
        />
        {onClick && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="absolute top-3 right-3 z-20 px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-cyan-600 text-white text-[11px] font-bold border border-white/15 hover:border-cyan-400 shadow-lg flex items-center gap-1.5 transition cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400 group-hover:text-white" />
            <span>Open Fullscreen Reader</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ aspectRatio: `${aspectRatio}` }}
      className={`relative w-full rounded-2xl bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs transition-all duration-300 ring-1 ring-black/5 dark:ring-white/10 ${
        onClick
          ? 'cursor-pointer group hover:shadow-xl hover:border-cyan-500/50 focus:outline-hidden focus:ring-2 focus:ring-cyan-500'
          : ''
      }`}
      title={onClick ? 'Click to launch interactive slide reader' : title}
    >
      {/* Underlying Real Slide Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain block transition-opacity duration-500 ${
          isRendered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Loading Shimmer Skeleton */}
      {isLoading && !isRendered && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-300 z-10">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center px-4">
            <span className="text-xs font-bold font-mono tracking-wide text-slate-200">
              Loading Slide Preview...
            </span>
          </div>
        </div>
      )}

      {/* Graceful Error Fallback */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-cyan-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex flex-col justify-between p-6 sm:p-7 z-10">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-[10px] font-mono tracking-wider font-bold text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
              OFFICIAL DECK
            </span>
            <div className="w-9 h-9 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center text-center py-2 px-4 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {onClick ? 'Click to open interactive slide deck' : 'Official presentation slides'}
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <span>{detectedPages || pageCount ? `${detectedPages || pageCount} Slides` : 'Official Slide Deck'}</span>
            {onClick && (
              <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                Open Reader →
              </span>
            )}
          </div>
        </div>
      )}

      {/* Top Floating Badges */}
      {!hasError && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-slate-950/90 text-[10px] font-mono tracking-wider font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              SLIDE PREVIEW
            </div>
            {(detectedPages || (pageCount && pageCount > 0)) ? (
              <div className="px-2.5 py-1 rounded-lg bg-slate-950/90 text-[10px] font-mono font-medium text-slate-300 border border-white/10 shadow-md">
                {detectedPages || pageCount} Slides
              </div>
            ) : null}
          </div>
          {onClick && (
            <div className="w-8 h-8 rounded-full bg-slate-950/90 text-cyan-400 border border-white/10 flex items-center justify-center shadow-md group-hover:bg-cyan-500 group-hover:text-white group-hover:scale-105 transition-all">
              <Eye className="w-4 h-4" />
            </div>
          )}
        </div>
      )}

      {/* Center Hover Action Badge */}
      {!hasError && onClick && (
        <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/50 transition-all duration-300 flex items-center justify-center pointer-events-none z-10">
          <div className="transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 px-5 py-2.5 rounded-full bg-slate-950/95 text-white border border-cyan-500/50 shadow-2xl flex items-center gap-2 text-xs font-bold tracking-wide">
            <Maximize2 className="w-4 h-4 text-cyan-400" />
            <span>Open Fullscreen Reader</span>
          </div>
        </div>
      )}

      {/* Bottom Scrim with Title and CTA */}
      {!hasError && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent pt-8 pb-3 px-4 flex items-center justify-between text-white pointer-events-none z-10">
          <div className="flex items-center gap-2 min-w-0 pr-3">
            <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-200 truncate">{title}</span>
          </div>
          {onClick && (
            <span className="text-[11px] font-mono font-bold text-cyan-300 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0">
              Open Reader →
            </span>
          )}
        </div>
      )}
    </div>
  );
};

