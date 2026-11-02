import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, formatImageUrl } from '../../config/api';
import { useSocket } from '../../context/SocketContext';

const Home = () => {
  const [featuredAuctions, setFeaturedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketContext = useSocket();

  useEffect(() => {
    document.title = 'AuctionHub | Real-Time Marketplace for Verified Collectibles';
    
    const fetchFeaturedAuctions = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auctions/active`);
        setFeaturedAuctions(Array.isArray(res.data) ? res.data.slice(0, 4) : []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching featured auctions:', err);
        setLoading(false);
      }
    };

    fetchFeaturedAuctions();
  }, []);

  // Listen for real-time bid/auction updates
  useEffect(() => {
    if (socketContext?.socket) {
      const handleUpdate = (updatedAuction) => {
        setFeaturedAuctions(prev => 
          prev.map(a => a._id === updatedAuction._id ? updatedAuction : a)
        );
      };

      socketContext.socket.on('auctionStatusChanged', handleUpdate);
      socketContext.socket.on('bidPlaced', (data) => {
        if (data && data.auctionId) {
          setFeaturedAuctions(prev => prev.map(a => {
            if (a._id === data.auctionId) {
              return { ...a, currentBid: data.amount, totalBids: (a.totalBids || 0) + 1 };
            }
            return a;
          }));
        }
      });

      return () => {
        socketContext.socket.off('auctionStatusChanged', handleUpdate);
        socketContext.socket.off('bidPlaced');
      };
    }
  }, [socketContext]);

  return (
    <div className="home-page">
      {/* Editorial Hero Section */}
      <section className="hero-editorial">
        <div className="container">
          <div className="row align-items-center g-4 g-lg-5">
            <div className="col-lg-7">
              <div className="hero-tag">
                <span className="pulse-dot"></span>
                <span>Live Marketplace Platform</span>
              </div>
              <h1 className="hero-heading">
                Real-Time Auctions for Curated Items.
              </h1>
              <p className="hero-subheading">
                Discover rare timepieces, photography equipment, luxury electronics, and authentic collectibles.
                Every bid executes with sub-50ms WebSocket latency, backed by authenticated sellers.
              </p>
              
              <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
                <Link to="/auctions" className="btn btn-primary btn-lg">
                  <span>Explore Live Auctions</span>
                  <i className="fas fa-arrow-right ms-1 fs-6"></i>
                </Link>
                <Link to="/create-product" className="btn btn-outline-custom btn-lg">
                  <span>List an Item</span>
                </Link>
              </div>

              {/* Clean Metric Counters */}
              <div className="row pt-3 pt-md-4 border-top g-3 g-md-4">
                <div className="col-4">
                  <div className="metric-value fs-3">$140K+</div>
                  <div className="metric-label">Volume Traded</div>
                </div>
                <div className="col-4">
                  <div className="metric-value fs-3">&lt; 40ms</div>
                  <div className="metric-label">Bid Latency</div>
                </div>
                <div className="col-4">
                  <div className="metric-value fs-3">100%</div>
                  <div className="metric-label">Verified Escrow</div>
                </div>
              </div>
            </div>

            <div className="col-lg-5 d-none d-lg-block">
              <div className="card-custom">
                <div className="position-relative">
                  <img
                    src="https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80"
                    alt="Vintage 1968 Omega Speedmaster Chronograph"
                    className="w-100"
                    style={{ height: '300px', objectFit: 'cover' }}
                  />
                  <div className="position-absolute top-0 start-0 m-3">
                    <span className="live-pill">
                      <span className="pulse-dot"></span>
                      Live Now
                    </span>
                  </div>
                  <div className="position-absolute bottom-0 start-0 m-3">
                    <span className="category-badge">Horology & Jewelry</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="fw-bold text-dark mb-1">Vintage 1968 Omega Speedmaster</h5>
                      <span className="text-muted small">Original step dial, cal. 861 movement</span>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-end mt-3 pt-3 border-top">
                    <div>
                      <div className="metric-label">Current Bid</div>
                      <div className="metric-value fs-4">$3,500</div>
                    </div>
                    <Link to="/auctions" className="btn btn-outline-custom btn-sm">
                      Enter Room
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Live Auctions */}
      <section className="py-5">
        <div className="container py-3">
          <div className="d-flex flex-wrap justify-content-between align-items-end mb-4">
            <div>
              <div className="metric-label text-primary">Live Bidding</div>
              <h2 className="fw-bold mb-1">Featured Active Auctions</h2>
              <p className="text-muted mb-0 small">Bids update in real-time across all connected clients.</p>
            </div>
            <Link to="/auctions" className="btn btn-outline-custom btn-sm mt-3 mt-sm-0">
              <span>View All Auctions</span>
              <i className="fas fa-chevron-right fs-6"></i>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-secondary" role="status"></div>
              <p className="text-muted small mt-2">Connecting to live feed...</p>
            </div>
          ) : featuredAuctions.length > 0 ? (
            <div className="row g-4">
              {featuredAuctions.map((auction) => (
                <div className="col-md-6 col-lg-3" key={auction._id}>
                  <div className="card-custom h-100 d-flex flex-column">
                    <div className="auction-img-container">
                      <img
                        src={formatImageUrl(auction.product?.images?.[0])}
                        alt={auction.product?.name || 'Auction Item'}
                      />
                      <div className="position-absolute top-0 end-0 m-2">
                        <span className="live-pill">
                          <span className="pulse-dot"></span>
                          Live
                        </span>
                      </div>
                      <div className="position-absolute bottom-0 start-0 m-2">
                        <span className="category-badge">
                          {auction.product?.category || 'Curated'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 d-flex flex-column flex-grow-1">
                      <h6 className="fw-bold text-dark text-truncate mb-1">
                        {auction.product?.name || 'Auction Item'}
                      </h6>
                      <p className="text-muted small text-truncate-2 mb-3">
                        {auction.product?.description || 'Authentic inspected item.'}
                      </p>

                      <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-end">
                        <div>
                          <div className="metric-label">Current Bid</div>
                          <div className="metric-value">
                            ${(auction.currentBid || auction.startingBid || 0).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-end">
                          <span className="text-muted small d-block">
                            {auction.totalBids || 0} bids
                          </span>
                          <Link to={`/auctions/${auction._id}`} className="btn btn-primary btn-sm px-3 mt-1">
                            <span>Bid Now</span>
                            <i className="fas fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5 border rounded-3 bg-white">
              <p className="text-muted mb-3">No active auctions at the moment.</p>
              <Link to="/create-product" className="btn btn-primary btn-sm">
                Create First Auction
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Trust & Architecture Section */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container py-2">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="d-flex align-items-start gap-3">
                <div className="brand-icon-box flex-shrink-0">
                  <i className="fas fa-bolt"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Sub-Second WebSocket Updates</h6>
                  <p className="text-muted small mb-0">
                    Bids and state transitions propagate instantly to all participants without polling or latency.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-start gap-3">
                <div className="brand-icon-box flex-shrink-0">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Anti-Sniping Protection</h6>
                  <p className="text-muted small mb-0">
                    Bids placed in the final 60 seconds automatically extend auction timers, ensuring transparent fairness.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="d-flex align-items-start gap-3">
                <div className="brand-icon-box flex-shrink-0">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div>
                  <h6 className="fw-bold mb-1">Authenticated Sellers</h6>
                  <p className="text-muted small mb-0">
                    Every listing is verified with clear provenance, condition grading, and high-resolution media.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
