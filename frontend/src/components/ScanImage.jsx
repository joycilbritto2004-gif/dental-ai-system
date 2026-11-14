import { useEffect, useState } from 'react';
import { fetchScanImageUrl, hasScanImage, isDirectImageUrl } from '../utils/scanImage';

// Renders an uploaded dental image through the authenticated scan-image endpoint.
// Calls onError once if the image cannot be loaded, so callers can show their own fallback.
const ScanImage = ({ imagePath, alt = 'Dental scan', fallback = null, onError, ...imgProps }) => {
  const [objectUrl, setObjectUrl] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    if (!hasScanImage(imagePath)) {
      setObjectUrl(null);
      return undefined;
    }

    let cancelled = false;
    let created = null;

    fetchScanImageUrl(imagePath)
      .then((url) => {
        if (cancelled) {
          if (url && !isDirectImageUrl(imagePath)) URL.revokeObjectURL(url);
          return;
        }
        if (!isDirectImageUrl(imagePath)) created = url;
        setObjectUrl(url);
      })
      .catch((err) => {
        console.error('Failed to load scan image:', err.message);
        if (!cancelled) {
          setHasError(true);
          if (onError) onError(err);
        }
      });

    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
    // onError is intentionally omitted: callers often pass an inline function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagePath]);

  if (hasError && fallback) return fallback;
  if (!objectUrl) return fallback;

  return <img src={objectUrl} alt={alt} {...imgProps} />;
};

export default ScanImage;
