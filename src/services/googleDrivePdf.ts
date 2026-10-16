/**
 * Google Drive PDF Link Preview & Download Engine
 *
 * Resolves any Google Drive link format into:
 * 1. Clean File ID
 * 2. In-App Embed Preview URL (/file/d/{ID}/preview)
 * 3. View URL (/file/d/{ID}/view)
 * 4. Direct Download URL (/uc?export=download&id={ID})
 */

export function extractGoogleDriveFileId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Pattern 1: /file/d/{FILE_ID}/...
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return fileDMatch[1];
  }

  // Pattern 2: id={FILE_ID} in query string (open?id=, uc?id=, etc.)
  const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1];
  }

  // Pattern 3: drive.google.com/open?id={FILE_ID}
  const openMatch = trimmed.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch && openMatch[1]) {
    return openMatch[1];
  }

  // Pattern 4: Standalone Google Drive file ID (25 to 45 alphanumeric / dashes / underscores without slashes or dots)
  if (/^[a-zA-Z0-9_-]{25,45}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function isGoogleDriveUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    return !!extractGoogleDriveFileId(trimmed);
  }
  return /^[a-zA-Z0-9_-]{25,45}$/.test(trimmed);
}

export function getGoogleDriveEmbedPreviewUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function getGoogleDriveViewUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function getGoogleDriveDownloadUrl(url: string): string {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
