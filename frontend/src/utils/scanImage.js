import { API_BASE } from '../config';

// Uploaded dental images are no longer served statically. They come from
// GET /api/scans/image/:filename, which checks that the viewer owns the scan
// (or is the assigned doctor, or an admin) before streaming the file.
//
// An <img src> cannot carry an Authorization header, so the image is fetched as a
// blob and rendered from an object URL. Blob URLs are same-origin, so html2canvas
// can still rasterise them for the PDF reports.

export const PLACEHOLDER_PATHS = ['uploaded_image'];

export const hasScanImage = (imagePath) =>
  Boolean(imagePath) && !PLACEHOLDER_PATHS.includes(imagePath);

export const isDirectImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== 'string') return false;
  return (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('blob:')
  );
};

const toEndpoint = (imagePath) => {
  if (isDirectImageUrl(imagePath)) return imagePath;
  const normalized = imagePath.replace(/\\/g, '/');
  const filename = normalized.split('/').pop();
  return `${API_BASE}/api/scans/image/${encodeURIComponent(filename)}`;
};

// Resolves to an object URL the caller must revoke when done, or null.
export const fetchScanImageUrl = async (imagePath) => {
  if (!hasScanImage(imagePath)) return null;
  if (isDirectImageUrl(imagePath)) return imagePath;

  const token = localStorage.getItem('dentaai_token');
  const response = await fetch(toEndpoint(imagePath), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`Image request failed with status ${response.status}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
