import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText, Eye, Maximize2, Loader2 } from 'lucide-react';

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
  onClick: () => void;
}

export const LectureSlidePreview: React.FC<LectureSlidePreviewProps> = ({
  pdfUrl,
  title,
  pageCount,
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const cachedDocRef = useRef<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

  // Render first page onto canvas
  useEffect(() => {
    if (!pdfUrl) {
      setIsLoading(false);
      setHasError(true);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setHasError(false);

    const renderFirstPage = async () => {
      try {
        let doc = cachedDocRef.current;
        if (!doc) {
          try {
            // First attempt: fetch arrayBuffer to avoid HTTP range issues in dev server
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
            // Fallback: direct URL loading
            doc = await pdfjsLib.getDocument({
              url: pdfUrl,
              cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
              cMapPacked: true,
            }).promise;
          }
          cachedDocRef.current = doc;
        }

        if (isCancelled || !doc) return;

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

        // Cancel previous render task if still executing
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // ignore
          }
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
        } catch {
          // ignore
        }
      }
    };
  }, [pdfUrl]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      style={{ aspectRatio: `${aspectRatio}` }}
      className="relative w-full rounded-2xl bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer group shadow-xs hover:shadow-xl transition-all duration-300 ring-1 ring-black/5 dark:ring-white/10 hover:border-cyan-500/50 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
      title="Click to launch interactive slide reader"
    >
      {/* 1. Underlying Real Slide Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain block transition-opacity duration-500 ${
          isRendered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 2. Loading Shimmer Skeleton */}
      {isLoading && !isRendered && (
        <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center gap-3 text-slate-300 z-10">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center px-4">
            <span className="text-xs font-bold font-mono tracking-wide text-slate-200">
              Rendering Slide 1 Preview...
            </span>
            <span className="text-[11px] text-slate-400">Loading high-definition slide canvas</span>
          </div>
        </div>
      )}

      {/* 3. Graceful Error Fallback */}
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
              Click to open interactive slide deck
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Slide 1 of {pageCount || 14}</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
              Open Reader →
            </span>
          </div>
        </div>
      )}

      {/* 4. Top Floating Badges */}
      {!hasError && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-mono tracking-wider font-bold text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              SLIDE 1 PREVIEW
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md text-[10px] font-mono font-medium text-slate-300 border border-white/10 shadow-md">
              1 of {pageCount || 14} Slides
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-950/80 backdrop-blur-md text-cyan-400 border border-white/10 flex items-center justify-center shadow-md group-hover:bg-cyan-500 group-hover:text-white group-hover:scale-105 transition-all">
            <Eye className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* 5. Center Hover Action Badge */}
      {!hasError && (
        <div className="absolute inset-0 bg-slate-950/10 group-hover:bg-slate-950/40 backdrop-blur-[0.5px] group-hover:backdrop-blur-[2px] transition-all duration-300 flex items-center justify-center pointer-events-none z-10">
          <div className="transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 px-5 py-2.5 rounded-full bg-slate-950/90 text-white backdrop-blur-md border border-cyan-500/50 shadow-2xl flex items-center gap-2 text-xs font-bold tracking-wide">
            <Maximize2 className="w-4 h-4 text-cyan-400" />
            <span>Launch Slide Reader</span>
          </div>
        </div>
      )}

      {/* 6. Bottom Scrim with Title and CTA */}
      {!hasError && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent pt-8 pb-3 px-4 flex items-center justify-between text-white pointer-events-none z-10">
          <div className="flex items-center gap-2 min-w-0 pr-3">
            <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-200 truncate">{title}</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-cyan-300 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0">
            Open Reader →
          </span>
        </div>
      )}
    </div>
  );
};
