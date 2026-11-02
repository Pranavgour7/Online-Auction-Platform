import React, { useState } from 'react';
import { formatImageUrl } from '../../config/api';

/**
 * Modern SVG placeholder data URI for reliable fallback rendering
 */
const DEFAULT_FALLBACK_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Cpath d='M160 130a20 20 0 1 0 40 0 20 20 0 0 0-40 0zm-30 65l35-45 25 30 35-45 45 60H130z' fill='%23cbd5e1'/%3E%3Ctext x='50%25' y='82%25' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%2394a3b8'%3EAuction Item%3C/text%3E%3C/svg%3E";

const ImageWithFallback = ({ src, fallbackSrc = DEFAULT_FALLBACK_SVG, alt = 'Item image', className, style, ...props }) => {
  const [imgSrc, setImgSrc] = useState(() => (src ? formatImageUrl(src) : fallbackSrc));
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      onError={handleError}
      className={className}
      style={style}
      loading="lazy"
      {...props}
    />
  );
};

export default ImageWithFallback;
