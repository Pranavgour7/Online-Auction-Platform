import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageWithFallback from './ImageWithFallback';

describe('ImageWithFallback Unit Tests', () => {
  test('renders image with primary source', () => {
    render(
      <ImageWithFallback
        src="https://images.unsplash.com/photo-1522335789203"
        alt="Vintage Watch"
      />
    );
    
    const img = screen.getByAltText('Vintage Watch');
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('unsplash.com');
  });

  test('switches to fallback SVG when image fails to load', () => {
    render(
      <ImageWithFallback
        src="https://invalid-broken-domain-999.xyz/broken.jpg"
        fallbackSrc="data:image/svg+xml;utf8,<svg></svg>"
        alt="Fallback Test"
      />
    );
    
    const img = screen.getByAltText('Fallback Test');
    fireEvent.error(img);
    expect(img.src).toContain('data:image/svg+xml');
  });
});

