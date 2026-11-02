import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const { theme, isAuto, toggleTheme } = useTheme();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  const isActive = (path) => location.pathname === path;

  const toggleNavbar = () => setIsExpanded(!isExpanded);
  const closeNavbar = () => setIsExpanded(false);

  return (
    <nav className="navbar navbar-expand-lg navbar-custom sticky-top">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand-custom" to="/" onClick={closeNavbar}>
          <div className="brand-icon-box">
            <i className="fas fa-gavel"></i>
          </div>
          <span>Auction<span style={{ color: 'var(--brand-blue)' }}>Hub</span></span>
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler border-0 p-1"
          type="button"
          aria-controls="navbarMain"
          aria-expanded={isExpanded}
          aria-label="Toggle navigation"
          onClick={toggleNavbar}
        >
          <i className={`fas ${isExpanded ? 'fa-times' : 'fa-bars'} fs-5 text-dark`}></i>
        </button>

        {/* Navigation Items */}
        <div className={`collapse navbar-collapse ${isExpanded ? 'show' : ''}`} id="navbarMain">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
            <li className="nav-item">
              <Link className={`nav-link-custom ${isActive('/') ? 'active' : ''}`} to="/" onClick={closeNavbar}>
                Overview
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link-custom ${isActive('/auctions') ? 'active' : ''}`} to="/auctions" onClick={closeNavbar}>
                <span className="d-inline-flex align-items-center gap-2">
                  <span className="pulse-dot"></span>
                  Live Auctions
                </span>
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link-custom ${isActive('/products') ? 'active' : ''}`} to="/products" onClick={closeNavbar}>
                Catalog
              </Link>
            </li>
          </ul>

          <ul className="navbar-nav ms-auto align-items-lg-center gap-2">
            {/* Dark/Light Mode Switch with Timing indicator */}
            <li className="nav-item">
              <button
                className="btn btn-theme-toggle btn-sm d-flex align-items-center gap-2"
                onClick={toggleTheme}
                title={isAuto 
                  ? `Mode: ${theme === 'dark' ? 'Night (Dark)' : 'Day (Light)'} (Timing Auto-sync 7PM-6AM). Click to toggle manually.` 
                  : `Mode: ${theme === 'dark' ? 'Dark' : 'Light'} (Manual). Click to toggle.`}
                aria-label="Toggle dark and light theme"
              >
                <i className={`fas ${theme === 'dark' ? 'fa-moon text-warning' : 'fa-sun text-amber'}`}></i>
                <span className="theme-toggle-label d-none d-xl-inline">
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </span>
                {isAuto && <span className="theme-auto-badge">auto</span>}
              </button>
            </li>

            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="btn btn-outline-custom btn-sm" to="/create-product" onClick={closeNavbar}>
                    <i className="fas fa-plus"></i>
                    <span>List Item</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link-custom ${isActive('/dashboard') ? 'active' : ''}`} to="/dashboard" onClick={closeNavbar}>
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link-custom d-flex align-items-center gap-1 ${isActive('/profile') ? 'active' : ''}`} to="/profile" onClick={closeNavbar}>
                    <i className="far fa-user-circle fs-6"></i>
                    <span>@{user?.username}</span>
                  </Link>
                </li>
                <li className="nav-item ms-lg-1">
                  <button 
                    className="btn btn-outline-custom btn-sm text-secondary" 
                    onClick={() => { logout(); closeNavbar(); }}
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span className="d-lg-none ms-1">Sign Out</span>
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link-custom" to="/login" onClick={closeNavbar}>
                    Sign In
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-primary btn-sm" to="/register" onClick={closeNavbar}>
                    Create Account
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
