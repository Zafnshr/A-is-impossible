import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  ExternalLink,
  Search,
  AlertCircle,
  Loader2,
  ArrowLeft,
  LayoutGrid,
  Columns,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  Layers,
  BookOpen,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure Mozilla PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('[PDFViewer] Worker setup fallback:', e);
  }
}

export interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl?: string;
  title: string;
  moduleName?: string;
  subjectName?: string;
  weekNumber?: number;
}

interface SearchMatch {
  page: number;
  snippet: string;
  index: number;
}

type ViewMode = 'continuous' | 'single';

// --- SUBCOMPONENT: VIRTUALIZED SLIDE CANVAS ---
interface VirtualizedSlideProps {
  pageNum: number;
  pdfDoc: any;
  scale: number;
  isActive: boolean;
  isBuffered: boolean;
  width: number;
  height: number;
  searchMatchesForPage: SearchMatch[];
  activeMatch: SearchMatch | null;
  onInView: (pageNum: number) => void;
}

const VirtualizedSlide: React.FC<VirtualizedSlideProps> = ({
  pageNum,
  pdfDoc,
  scale,
  isActive,
  isBuffered,
  width,
  height,
  searchMatchesForPage,
  activeMatch,
  onInView,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState<boolean>(false);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Intersection observer to track active in-view slide
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          onInView(pageNum);
        }
      },
      { threshold: [0.5] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNum, onInView]);

  // Render PDF page to canvas when inside buffer window
  useEffect(() => {
    if (!isBuffered || !pdfDoc) {
      setIsRendered(false);
      return;
    }

    let isCancelled = false;
    let renderTask: any = null;

    const render = async () => {
      try {
        setIsRendering(true);
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        // Calculate viewport using actual container width for pixel sharpness
        const unscaledViewport = page.getViewport({ scale: 1 });
        const targetScale = (width / unscaledViewport.width) * dpr;
        const viewport = page.getViewport({ scale: targetScale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        renderTask = page.render({
          canvasContext: ctx,
          viewport: viewport,
        });

        await renderTask.promise;
        if (!isCancelled) {
          setIsRendered(true);
          setIsRendering(false);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`[PDFViewer] Error rendering slide ${pageNum}:`, err);
        }
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {}
      }
      // TRD 5.3 Enforce immediate GPU memory texture deallocation
      if (canvasRef.current) {
        canvasRef.current.width = 0;
        canvasRef.current.height = 0;
      }
    };
  }, [pageNum, pdfDoc, isBuffered, width, scale]);

  return (
    <div
      ref={containerRef}
      id={`pdf-slide-${pageNum}`}
      style={{ width: `${width}px`, height: `${height}px` }}
      className={`relative rounded-xl overflow-hidden transition-all duration-200 select-none ${
        isActive
          ? 'ring-2 ring-cyan-500 shadow-[0_0_35px_rgba(6,182,212,0.25)]'
          : 'shadow-2xl ring-1 ring-slate-800/80 hover:ring-slate-700'
      } bg-slate-900 flex items-center justify-center`}
    >
      {/* Watermark / Slide Badge Header */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono font-bold text-slate-200 shadow-md">
          Slide {pageNum}
        </span>
        {searchMatchesForPage.length > 0 && (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/80 text-black text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
            <Sparkles className="w-3 h-3" />
            {searchMatchesForPage.length} match{searchMatchesForPage.length > 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {/* Canvas Node (Mounted only if within buffer window) */}
      {isBuffered ? (
        <>
          <canvas
            ref={canvasRef}
            className={`block w-full h-full object-contain transition-opacity duration-300 ${
              isRendered ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {isRendering && !isRendered && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/80 backdrop-blur-sm text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-[11px] font-mono">Rendering slide {pageNum}...</span>
            </div>
          )}
        </>
      ) : (
        /* Out-of-bounds placeholder keeping exact viewport height */
        <div className="flex flex-col items-center justify-center gap-3 text-slate-600">
          <Layers className="w-8 h-8 opacity-40" />
          <span className="text-xs font-mono font-semibold tracking-wider">Slide {pageNum}</span>
          <span className="text-[10px] text-slate-700 font-mono">Buffered offscreen</span>
        </div>
      )}

      {/* Active Search Highlight Ribbon */}
      {activeMatch && activeMatch.page === pageNum && (
        <div className="absolute bottom-4 inset-x-4 z-20 pointer-events-none flex justify-center animate-bounce">
          <div className="bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold shadow-2xl border border-amber-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 fill-slate-950" />
            <span>Search Match: &ldquo;{activeMatch.snippet}&rdquo;</span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUBCOMPONENT: SLIDE THUMBNAIL CARD ---
interface ThumbnailCardProps {
  pageNum: number;
  pdfDoc: any;
  isActive: boolean;
  onClick: () => void;
}

const ThumbnailCard: React.FC<ThumbnailCardProps> = ({
  pageNum,
  pdfDoc,
  isActive,
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!pdfDoc) return;
    let isCancelled = false;

    const renderThumb = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const viewport = page.getViewport({ scale: 0.16 });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!isCancelled) setLoaded(true);
      } catch {
        // Thumbnail errors are non-fatal
      }
    };

    renderThumb();

    return () => {
      isCancelled = true;
      if (canvasRef.current) {
        canvasRef.current.width = 0;
        canvasRef.current.height = 0;
      }
    };
  }, [pageNum, pdfDoc]);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-2 rounded-xl border transition group cursor-pointer flex flex-col gap-1.5 ${
        isActive
          ? 'bg-cyan-950/40 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
          : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between text-[11px] font-mono px-1">
        <span className={isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 group-hover:text-slate-200'}>
          Slide {pageNum}
        </span>
        {isActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        )}
      </div>
      <div className="w-full aspect-[16/10] bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center relative">
        <canvas
          ref={canvasRef}
          className={`w-full h-full object-contain transition-opacity duration-200 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        {!loaded && (
          <div className="text-[10px] font-mono text-slate-600">Slide {pageNum}</div>
        )}
      </div>
    </button>
  );
};

// --- MAIN EXPORTED COMPONENT ---
export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({
  isOpen,
  onClose,
  pdfUrl,
  title,
  moduleName,
  subjectName,
  weekNumber,
}) => {
  // Navigation & Scale state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [viewMode, setViewMode] = useState<ViewMode>('continuous');
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // UI Panels
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [jumpInput, setJumpInput] = useState<string>('1');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState<boolean>(false);

  // In-Document Search state
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  // DOM Refs
  const rootContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Strict enforcement: Stateless Reset to Slide 1 upon opening
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setJumpInput('1');
      setScale(1.0);
      setViewMode('continuous');
      setSearchQuery('');
      setSearchResults([]);
      setSearchOpen(false);
      setLoadError(null);
      setIsHeaderCollapsed(false);
    }
  }, [isOpen, pdfUrl]);

  // Support browser Back button to cleanly close reader and return to Lecture Overview
  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ pdfReaderOpen: true }, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  // Load PDF Document
  useEffect(() => {
    if (!isOpen || !pdfUrl) return;

    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    const loadingTask = pdfjsLib.getDocument({
      url: pdfUrl,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });

    loadingTask.promise
      .then(async (doc) => {
        if (!isMounted) return;
        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setJumpInput('1');

        // Extract first page aspect ratio
        try {
          const firstPage = await doc.getPage(1);
          const vp = firstPage.getViewport({ scale: 1 });
          if (vp.width && vp.height) {
            setAspectRatio(vp.width / vp.height);
          }
        } catch {
          // Default to 16/9 if aspect query fails
        }

        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[PDFViewer] Canvas PDF.js failed, fallback available:', err);
        setLoadError(err.message || 'Unable to render via Canvas engine directly.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
      if (pdfDocRef.current) {
        try {
          pdfDocRef.current.destroy();
        } catch {}
      }
    };
  }, [isOpen, pdfUrl]);

  // Sync jump input with current page
  useEffect(() => {
    setJumpInput(String(currentPage));
  }, [currentPage]);

  // Calculate slide dimensions based on viewport & scale
  const slideDimensions = useMemo(() => {
    const baseWidth = Math.min(1080, (window.innerWidth || 1200) - (showThumbnails ? 340 : 120));
    const width = Math.max(360, Math.floor(baseWidth * scale));
    const height = Math.floor(width / aspectRatio);
    return { width, height };
  }, [scale, aspectRatio, showThumbnails]);

  // Scroll to slide container smoothly
  const scrollToSlide = useCallback((page: number) => {
    setCurrentPage(page);
    setJumpInput(String(page));

    if (viewMode === 'continuous') {
      const el = document.getElementById(`pdf-slide-${page}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [viewMode]);

  // Jump to slide form submission
  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      scrollToSlide(target);
    } else {
      setJumpInput(String(currentPage));
    }
  };

  // Zoom Helpers
  const handleZoomIn = () => {
    setScale((s) => Math.min(2.5, Number((s + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(0.5, Number((s - 0.25).toFixed(2))));
  };

  const handleFitWidth = () => {
    if (!scrollContainerRef.current) return;
    const availWidth = scrollContainerRef.current.clientWidth - 64;
    const baseNaturalWidth = Math.min(1080, (window.innerWidth || 1200) - (showThumbnails ? 340 : 120));
    const newScale = Number((availWidth / baseNaturalWidth).toFixed(2));
    setScale(Math.max(0.5, Math.min(2.5, newScale)));
  };

  const handleFitPage = () => {
    if (!scrollContainerRef.current) return;
    const availHeight = scrollContainerRef.current.clientHeight - 80;
    const baseNaturalWidth = Math.min(1080, (window.innerWidth || 1200) - (showThumbnails ? 340 : 120));
    const naturalHeight = baseNaturalWidth / aspectRatio;
    const newScale = Number((availHeight / naturalHeight).toFixed(2));
    setScale(Math.max(0.5, Math.min(2.5, newScale)));
  };

  const handleResetZoom = () => {
    setScale(1.0);
  };

  // In-Document Search Engine (TRD 5.2 Implementation)
  const handlePerformSearch = async () => {
    if (!pdfDocRef.current || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.trim().toLowerCase();
    const matches: SearchMatch[] = [];

    for (let p = 1; p <= totalPages; p++) {
      try {
        const page = await pdfDocRef.current.getPage(p);
        const textContent = await page.getTextContent();
        const fullPageText = textContent.items
          .map((item: any) => item.str || '')
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        let startIndex = 0;
        while ((startIndex = fullPageText.indexOf(query, startIndex)) !== -1) {
          const startSnippet = Math.max(0, startIndex - 25);
          const endSnippet = Math.min(fullPageText.length, startIndex + query.length + 35);
          const snippet = fullPageText.slice(startSnippet, endSnippet);
          matches.push({
            page: p,
            snippet,
            index: matches.length,
          });
          startIndex += query.length;
        }
      } catch {
        // Continue scanning remaining slides
      }
    }

    setSearchResults(matches);
    setIsSearching(false);
    if (matches.length > 0) {
      setCurrentMatchIndex(0);
      scrollToSlide(matches[0].page);
    }
  };

  const nextMatch = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchResults.length;
    setCurrentMatchIndex(nextIdx);
    scrollToSlide(searchResults[nextIdx].page);
  };

  const prevMatch = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentMatchIndex(prevIdx);
    scrollToSlide(searchResults[prevIdx].page);
  };

  // Safe Same-Origin / Blob Open in New Tab
  const handleOpenInNewTab = () => {
    if (!pdfUrl) return;

    // 1. Direct same-origin or absolute URL with .pdf: Opens Chrome native PDF viewer tab directly
    if (
      pdfUrl.startsWith('/') ||
      pdfUrl.startsWith(window.location.origin) ||
      (pdfUrl.startsWith('http') && pdfUrl.toLowerCase().endsWith('.pdf'))
    ) {
      window.open(pdfUrl, '_blank');
      return;
    }

    // 2. Blob or external URL without .pdf: Top-level navigation to blob is blocked by Chrome,
    // which triggers an automatic download of the raw UUID.
    // Instead, open an HTML wrapper in the new tab with an iframe embedding the PDF!
    const safeTitle = (title || 'Lecture_Slides')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim();

    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safeTitle || 'Lecture Slides'}</title>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #0f172a; }
    iframe { border: none; width: 100%; height: 100%; }
  </style>
</head>
<body>
  <iframe src="${pdfUrl}#toolbar=1" width="100%" height="100%"></iframe>
</body>
</html>`);
      newTab.document.close();
    } else {
      window.open(pdfUrl, '_blank');
    }
  };

  // Safe Named File Download
  const handleDownloadPdf = () => {
    if (!pdfUrl) return;

    const safeTitle = (title || 'Lecture_Slides')
      .replace(/[^a-zA-Z0-9_\-\s]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    const filename = safeTitle.toLowerCase().endsWith('.pdf') ? safeTitle : `${safeTitle}.pdf`;

    // 1. Same-Origin or Blob: Execute synchronously within the active user gesture
    // Chrome strictly requires synchronous user activation + same-origin URL for a.download to apply!
    if (pdfUrl.startsWith('/') || pdfUrl.startsWith(window.location.origin) || pdfUrl.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    // 2. Cross-Origin Fallback: fetch blob and download
    fetch(pdfUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const blobUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      })
      .catch((err) => {
        console.warn('[PDFViewer] Programmatic download fallback:', err);
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      });
  };

  // Global Keyboard Navigation (Screen Flow 5.1 & 5.2)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing inside an input field
      const target = e.target as HTMLElement;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        if (showShortcutsModal) {
          setShowShortcutsModal(false);
        } else if (searchOpen) {
          setSearchOpen(false);
        } else {
          onClose();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setIsHeaderCollapsed(false);
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
        return;
      }

      if (isInput) return;

      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
          e.preventDefault();
          if (currentPage < totalPages) scrollToSlide(currentPage + 1);
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          if (currentPage > 1) scrollToSlide(currentPage - 1);
          break;
        case 'Home':
          e.preventDefault();
          scrollToSlide(1);
          break;
        case 'End':
          e.preventDefault();
          scrollToSlide(totalPages);
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          handleZoomOut();
          break;
        case '0':
          e.preventDefault();
          handleResetZoom();
          break;
        case 'w':
        case 'W':
          e.preventDefault();
          handleFitWidth();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          handleFitPage();
          break;
        case 't':
        case 'T':
          e.preventDefault();
          setShowThumbnails((prev) => !prev);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          setViewMode((v) => (v === 'continuous' ? 'single' : 'continuous'));
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          setIsHeaderCollapsed((prev) => !prev);
          break;
        case '?':
          e.preventDefault();
          setShowShortcutsModal((prev) => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    currentPage,
    totalPages,
    searchOpen,
    showShortcutsModal,
    onClose,
    scrollToSlide,
    handleZoomIn,
    handleZoomOut,
  ]);

  if (!isOpen) return null;

  const activeMatch = searchResults[currentMatchIndex] || null;

  return createPortal(
    <div
      ref={rootContainerRef}
      className="fixed inset-0 z-[99999] bg-slate-950 text-white flex flex-col select-none overflow-hidden font-sans dark theme-dark"
    >
      {/* ============================================================== */}
      {/* FLOATING PULL-DOWN HANDLE WHEN TOPBAR IS HIDDEN (RIGHT SIDE)   */}
      {/* ============================================================== */}
      {isHeaderCollapsed && (
        <div className="fixed top-0 right-6 sm:right-8 z-50 flex flex-col items-end animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsHeaderCollapsed(false)}
            className="group px-4 py-1.5 rounded-b-2xl bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-cyan-300 border-x border-b border-cyan-500/50 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all duration-200 hover:pt-2.5 active:scale-95 ring-1 ring-cyan-500/20"
            title="Pull back Topbar (Click or Press H)"
          >
            <ChevronDown className="w-4 h-4 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
            <span className="font-medium tracking-wide">Show Topbar</span>
            <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400 font-mono">
              H
            </kbd>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* TOP VIEWER CONTROLS HUD (Screen Flow 5.1 Architecture)          */}
      {/* ============================================================== */}
      <header
        className={`h-16 bg-slate-900/95 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 shadow-lg backdrop-blur-md z-30 relative transition-all duration-300 ease-in-out ${
          isHeaderCollapsed ? '-mt-16 opacity-0 pointer-events-none' : 'mt-0 opacity-100 pointer-events-auto'
        }`}
      >
        {/* Right-aligned Pull Tab on Bottom Edge of Topbar */}
        <div className="absolute -bottom-3.5 right-6 sm:right-8 z-40 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              setIsHeaderCollapsed(true);
              setSearchOpen(false);
            }}
            className="group px-3.5 py-0.5 rounded-b-xl bg-slate-900/95 hover:bg-slate-800 border-x border-b border-slate-700 hover:border-cyan-500/60 text-slate-400 hover:text-cyan-300 text-[10px] font-mono flex items-center gap-1 shadow-lg cursor-pointer transition-all hover:pt-1.5 active:scale-95"
            title="Hide Topbar for distraction-free reading (Click or Press H)"
          >
            <ChevronUp className="w-3 h-3 text-cyan-400 group-hover:-translate-y-0.5 transition-transform" />
            <span className="text-[10px] tracking-wider font-semibold">HIDE BAR</span>
          </button>
        </div>
        {/* Left: Back Button, Metadata & Thumbnail Toggle */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-100 hover:text-white transition cursor-pointer border border-slate-700 hover:border-cyan-500/50 shadow-sm shrink-0"
            title="Return to Lecture Overview (Esc)"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Back to Lecture</span>
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Lecture & Curriculum Breadcrumbs */}
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {title}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
              {moduleName && <span>{moduleName}</span>}
              {subjectName && <span>• {subjectName}</span>}
              {weekNumber !== undefined && <span>• Week {weekNumber}</span>}
              {!moduleName && <span>Stateless Canvas Reader</span>}
            </div>
          </div>

          {/* Toggle Slide Thumbnails Drawer Button */}
          <button
            type="button"
            onClick={() => setShowThumbnails((prev) => !prev)}
            className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
              showThumbnails
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Toggle Slide Thumbnails (T)"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden xl:inline">Slides ({totalPages})</span>
          </button>
        </div>

        {/* Center: Slide Navigator & Mode Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Slide Navigator Controls */}
          <div className="flex items-center bg-slate-800/90 rounded-xl border border-slate-700/60 p-1 shadow-inner">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => scrollToSlide(currentPage - 1)}
              className="p-1 rounded-lg hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer text-slate-300 hover:text-white"
              title="Previous Slide (← / PageUp)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Jump Input */}
            <form onSubmit={handleJumpSubmit} className="flex items-center px-2 gap-1 text-xs font-mono font-bold">
              <input
                type="text"
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                onBlur={handleJumpSubmit}
                className="w-10 text-center bg-slate-900 border border-slate-700 rounded-md py-0.5 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
              />
              <span className="text-slate-500">/</span>
              <span className="text-slate-400">{totalPages}</span>
            </form>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => scrollToSlide(currentPage + 1)}
              className="p-1 rounded-lg hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer text-slate-300 hover:text-white"
              title="Next Slide (→ / PageDown / Space)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Toggle: Continuous vs Single Slide */}
          <div className="hidden lg:flex items-center bg-slate-800/90 rounded-xl border border-slate-700/60 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('continuous')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'continuous'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Continuous Vertical Scroll (M)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Scroll</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'single'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Single Slide Presentation Mode (M)"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Slide</span>
            </button>
          </div>
        </div>

        {/* Right: Zoom Controls, Search, Fullscreen, External & Close */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Group */}
          <div className="hidden sm:flex items-center bg-slate-800/90 rounded-xl border border-slate-700/60 p-1">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 text-[11px] font-mono text-slate-300 hover:text-cyan-400 font-bold cursor-pointer"
              title="Reset Zoom to 100% (0)"
            >
              {Math.round(scale * 100)}%
            </button>

            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Fit Presets */}
          <div className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={handleFitWidth}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold border border-slate-700/60 transition cursor-pointer"
              title="Fit to Window Width (W)"
            >
              Fit Width
            </button>
            <button
              type="button"
              onClick={handleFitPage}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold border border-slate-700/60 transition cursor-pointer"
              title="Fit Slide to Screen Height (P)"
            >
              Fit Page
            </button>
          </div>

          {/* In-Document Search Toggle */}
          <button
            type="button"
            onClick={() => {
              setSearchOpen(!searchOpen);
              if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
            }}
            className={`p-2 rounded-xl transition cursor-pointer relative ${
              searchOpen
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
            title="Find in PDF (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
            {searchResults.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-slate-900" />
            )}
          </button>

          {/* Keyboard Shortcuts Helper */}
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition cursor-pointer hidden lg:flex"
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Direct PDF Download / External View */}
          {pdfUrl && (
            <>
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer hidden sm:flex"
                title="Open PDF in new browser tab"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer hidden sm:flex"
                title="Download Slide Deck (.pdf)"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}




        </div>
      </header>

      {/* ============================================================== */}
      {/* IN-DOCUMENT SEARCH DOCK (Screen Flow 5.2 Floating Dock)         */}
      {/* ============================================================== */}
      {searchOpen && (
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between gap-4 animate-in slide-in-from-top-2 z-20 shadow-xl">
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <Search className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (searchResults.length > 0) {
                    if (e.shiftKey) prevMatch();
                    else nextMatch();
                  } else {
                    handlePerformSearch();
                  }
                }
              }}
              placeholder="Find in lecture slides (e.g. oncotic, albumin, hemoglobin)..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
              autoFocus
            />
            <button
              type="button"
              disabled={isSearching}
              onClick={handlePerformSearch}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 cursor-pointer transition shadow-sm disabled:opacity-50"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {searchResults.length > 0 ? (
              <div className="flex items-center gap-2 font-mono">
                <span className="text-amber-400 font-bold">
                  Match {currentMatchIndex + 1} of {searchResults.length}
                </span>
                <button
                  type="button"
                  onClick={prevMatch}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Previous Match (Shift+Enter)"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMatch}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Next Match (Enter)"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            ) : (
              searchQuery.trim() && (
                <span className="text-slate-500 font-mono">No matches found in text layer</span>
              )
            )}
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* BODY CONTENT: THUMBNAILS DRAWER + CANVAS SCROLLER VIEWPORT     */}
      {/* ============================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Collapsible Thumbnails Drawer */}
        {showThumbnails && (
          <aside className="w-64 sm:w-72 border-r border-slate-800 bg-slate-900/95 flex flex-col shrink-0 z-10 backdrop-blur-md animate-in slide-in-from-left duration-200">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Slide Deck ({totalPages})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowThumbnails(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <ThumbnailCard
                  key={pageNum}
                  pageNum={pageNum}
                  pdfDoc={pdfDocRef.current}
                  isActive={currentPage === pageNum}
                  onClick={() => scrollToSlide(pageNum)}
                />
              ))}
            </div>
          </aside>
        )}

        {/* Central Viewport */}
        <main
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-950 flex flex-col items-center py-8 px-4 relative select-none"
        >
          {/* Initial Loading Screen */}
          {isLoading && (
            <div className="my-auto flex flex-col items-center gap-4 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold text-white">Initializing High-Performance Canvas Engine</h4>
                <p className="text-xs text-slate-500 font-mono">
                  Loading slide deck into virtualized GPU pipeline...
                </p>
              </div>
            </div>
          )}

          {/* Loading Error Notice */}
          {loadError && (
            <div className="my-auto max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Direct Canvas Render Notice</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Direct cross-origin client rendering was intercepted. You can view or download the slides
                  securely using native viewing options:
                </p>
              </div>
              {pdfUrl && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleOpenInNewTab}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Browser Viewer</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode 1: Continuous Vertical Scroller (TRD 5.1 & 5.3 Virtualized Scroller) */}
          {!isLoading && !loadError && viewMode === 'continuous' && (
            <div className="w-full flex flex-col items-center gap-8 pb-20">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                // TRD 5.3 Virtualization Buffer Window: current ± 1 slides
                const isBuffered = Math.abs(pageNum - currentPage) <= 1;
                const matchesForThisPage = searchResults.filter((m) => m.page === pageNum);

                return (
                  <VirtualizedSlide
                    key={pageNum}
                    pageNum={pageNum}
                    pdfDoc={pdfDocRef.current}
                    scale={scale}
                    isActive={currentPage === pageNum}
                    isBuffered={isBuffered}
                    width={slideDimensions.width}
                    height={slideDimensions.height}
                    searchMatchesForPage={matchesForThisPage}
                    activeMatch={activeMatch}
                    onInView={(visiblePage) => {
                      setCurrentPage(visiblePage);
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Mode 2: Single Slide Presentation Mode */}
          {!isLoading && !loadError && viewMode === 'single' && (
            <div className="my-auto relative flex items-center justify-center">
              {/* Previous Slide Floating Hover Arrow */}
              {currentPage > 1 && (
                <button
                  type="button"
                  onClick={() => scrollToSlide(currentPage - 1)}
                  className="absolute left-[-56px] top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-slate-900/80 hover:bg-cyan-600 text-slate-300 hover:text-white border border-slate-800 shadow-xl transition cursor-pointer backdrop-blur-md"
                  title="Previous Slide"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              <VirtualizedSlide
                pageNum={currentPage}
                pdfDoc={pdfDocRef.current}
                scale={scale}
                isActive={true}
                isBuffered={true}
                width={slideDimensions.width}
                height={slideDimensions.height}
                searchMatchesForPage={searchResults.filter((m) => m.page === currentPage)}
                activeMatch={activeMatch}
                onInView={() => {}}
              />

              {/* Next Slide Floating Hover Arrow */}
              {currentPage < totalPages && (
                <button
                  type="button"
                  onClick={() => scrollToSlide(currentPage + 1)}
                  className="absolute right-[-56px] top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-slate-900/80 hover:bg-cyan-600 text-slate-300 hover:text-white border border-slate-800 shadow-xl transition cursor-pointer backdrop-blur-md"
                  title="Next Slide"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* FLOATING BOTTOM HUD STATUS PILL & QUICK RETURN BUTTON          */}
      {/* ============================================================== */}
      {!isLoading && !loadError && (
        <>


          {/* Floating Slide Counter Pill (Bottom-Right) */}
          <footer className="absolute bottom-5 right-6 z-20 pointer-events-auto flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono font-bold text-slate-300 backdrop-blur-md shadow-2xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>
                Slide {currentPage} of {totalPages}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              className="p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white backdrop-blur-md shadow-2xl transition cursor-pointer"
              title="Keyboard Shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </footer>
        </>
      )}

      {/* ============================================================== */}
      {/* KEYBOARD SHORTCUTS REFERENCE MODAL                             */}
      {/* ============================================================== */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Slide Reader Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Next Slide</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">→ / Space / PgDn</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Previous Slide</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">← / PgUp</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">First / Last Slide</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">Home / End</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Zoom In / Out</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">+ / -</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Fit Width / Fit Page</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">W / P</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">In-Document Search</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">Ctrl + F / ⌘F</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Toggle Thumbnails</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">T</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Toggle View Mode</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">M</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Hide / Show Topbar</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">H</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Close Viewer</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-white font-bold">Esc</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
