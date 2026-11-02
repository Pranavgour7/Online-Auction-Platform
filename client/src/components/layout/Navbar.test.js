import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';
import AuthContext from '../../context/AuthContext';

describe('Navbar Component Unit Tests', () => {
  const renderNavbar = (authValue) => {
    return render(
      <AuthContext.Provider value={authValue}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );
  };

  test('renders brand name and public navigation links', () => {
    const authState = { isAuthenticated: false, user: null, logout: jest.fn() };
    renderNavbar(authState);

    expect(screen.getByText(/Auction/i)).toBeInTheDocument();
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Auctions/i)).toBeInTheDocument();
    expect(screen.getByText(/Products/i)).toBeInTheDocument();
  });

  test('displays login and register links when not authenticated', () => {
    const authState = { isAuthenticated: false, user: null, logout: jest.fn() };
    renderNavbar(authState);

    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    expect(screen.getByText(/Get Started Free/i)).toBeInTheDocument();
  });

  test('displays dashboard, username and logout when authenticated', () => {
    const authState = {
      isAuthenticated: true,
      user: { username: 'test_bidder', email: 'test@example.com' },
      logout: jest.fn()
    };
    renderNavbar(authState);

    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/@test_bidder/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });
});

