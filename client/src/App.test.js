import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

test('renders AuctionHub platform header and navigation without crashing', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  
  // Brand should be visible
  expect(screen.getByText(/Auction/i)).toBeInTheDocument();
  // Main nav items should exist
  expect(screen.getByText(/Overview/i)).toBeInTheDocument();
  expect(screen.getByText(/Live Auctions/i)).toBeInTheDocument();
  expect(screen.getByText(/Catalog/i)).toBeInTheDocument();
});
