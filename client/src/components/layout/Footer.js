import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="footer-custom">
      <div className="container">
        <div className="row g-4 mb-4">
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center mb-3">
              <div className="brand-icon-box" style={{ width: '30px', height: '30px', fontSize: '0.85rem' }}>
                <i className="fas fa-gavel"></i>
              </div>
              <span className="fw-bold fs-5 text-dark">Auction<span style={{ color: 'var(--brand-blue)' }}>Hub</span></span>
            </div>
            <p className="text-muted small mb-3" style={{ maxWidth: '320px' }}>
              A real-time auction marketplace engineered on the MERN stack with bidirectional Socket.IO sync, JWT authentication, and automated status lifecycle monitors.
            </p>
            <div className="d-flex flex-wrap gap-1">
              <span className="badge bg-light text-dark border">MongoDB Atlas</span>
              <span className="badge bg-light text-dark border">Express</span>
              <span className="badge bg-light text-dark border">React 19</span>
              <span className="badge bg-light text-dark border">Node.js</span>
              <span className="badge bg-light text-dark border">Socket.IO</span>
            </div>
          </div>

          <div className="col-lg-2 col-md-6 col-6">
            <h6>Marketplace</h6>
            <Link className="footer-link" to="/">Overview</Link>
            <Link className="footer-link" to="/auctions">Live Auctions</Link>
            <Link className="footer-link" to="/products">Catalog</Link>
            <Link className="footer-link" to="/create-product">List Item</Link>
          </div>

          <div className="col-lg-2 col-md-6 col-6">
            <h6>Account</h6>
            <Link className="footer-link" to="/login">Sign In</Link>
            <Link className="footer-link" to="/register">Create Account</Link>
            <Link className="footer-link" to="/dashboard">Dashboard</Link>
            <Link className="footer-link" to="/profile">Profile</Link>
          </div>

          <div className="col-lg-4 col-md-6">
            <h6>Engineering Highlights</h6>
            <p className="text-muted small mb-2">
              Engineered with sub-50ms live bid broadcasts, optimistic UI updates, responsive mobile layouts, and strict transaction safety.
            </p>
            <div className="small text-muted">
              <div><i className="fas fa-check text-primary me-2"></i>Automated Lifecycle Scheduler Active</div>
              <div><i className="fas fa-check text-primary me-2"></i>WebSocket Connection Pooling</div>
              <div><i className="fas fa-check text-primary me-2"></i>Production Architecture Ready</div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-top d-flex flex-wrap justify-content-between align-items-center small text-muted">
          <div>
            &copy; {new Date().getFullYear()} AuctionHub Marketplace. All rights reserved.
          </div>
          <div>
            Built with modern MERN + WebSockets architecture.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
