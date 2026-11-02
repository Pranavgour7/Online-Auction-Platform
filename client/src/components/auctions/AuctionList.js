import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, formatImageUrl } from '../../config/api';

const AuctionList = ({ isAuthenticated, showAlert }) => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [filters, setFilters] = useState({
    status: 'active',
    category: '',
    search: ''
  });

  useEffect(() => {
    document.title = 'Live Auctions | AuctionHub Real-Time Marketplace';
    
    const fetchAuctions = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('page', currentPage);
        queryParams.append('limit', 9);
        
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.search) queryParams.append('search', filters.search);
        
        const res = await axios.get(`${API_BASE_URL}/api/auctions?${queryParams.toString()}`);
        
        if (res.data) {
          setAuctions(res.data.auctions || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalCount(res.data.total || (res.data.auctions ? res.data.auctions.length : 0));
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching auctions:', err);
        showAlert && showAlert('Error loading auctions', 'danger');
        setLoading(false);
      }
    };
    
    fetchAuctions();
  }, [currentPage, filters, showAlert]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleStatusTab = (status) => {
    setFilters(prev => ({ ...prev, status }));
    setCurrentPage(1);
  };
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const formatTimeLeft = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m remaining`;
  };

  return (
    <div className="container py-4">
      {/* Editorial Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 pb-3 border-bottom">
        <div>
          <div className="metric-label text-primary">Live Marketplace</div>
          <h1 className="fw-extrabold mb-1 fs-2">Auctions Catalog</h1>
          <p className="text-muted small mb-0">
            {totalCount} {totalCount === 1 ? 'auction' : 'auctions'} verified and active for real-time bidding.
          </p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-2">
          {isAuthenticated ? (
            <Link to="/create-product" className="btn btn-primary btn-sm">
              <i className="fas fa-plus"></i>
              <span>Create Auction</span>
            </Link>
          ) : (
            <Link to="/login" className="btn btn-outline-custom btn-sm">
              <i className="fas fa-sign-in-alt"></i>
              <span>Sign In to Bid</span>
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        {/* Status Pills */}
        <div className="d-flex flex-wrap gap-2 mb-3 pb-3 border-bottom">
          <button
            type="button"
            className={`btn btn-sm ${filters.status === '' ? 'btn-primary' : 'btn-outline-custom'}`}
            onClick={() => handleStatusTab('')}
          >
            All Auctions
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filters.status === 'active' ? 'btn-primary' : 'btn-outline-custom'}`}
            onClick={() => handleStatusTab('active')}
          >
            <span className="pulse-dot"></span>
            Live Now
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filters.status === 'pending' ? 'btn-primary' : 'btn-outline-custom'}`}
            onClick={() => handleStatusTab('pending')}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`btn btn-sm ${filters.status === 'completed' ? 'btn-primary' : 'btn-outline-custom'}`}
            onClick={() => handleStatusTab('completed')}
          >
            Past / Completed
          </button>
        </div>

        {/* Input Controls */}
        <div className="row g-3">
          <div className="col-md-7">
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                name="search"
                className="form-control"
                placeholder="Search auctions by title, model, brand or keywords..."
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          <div className="col-md-5">
            <select
              name="category"
              className="form-select"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics & Computing</option>
              <option value="Collectibles">Rare Collectibles & Art</option>
              <option value="Fashion">Designer Fashion & Footwear</option>
              <option value="Jewelry">Horology & Jewelry</option>
              <option value="Vehicles">Automotive & Memorabilia</option>
              <option value="Other">Other Curated Items</option>
            </select>
          </div>
        </div>
      </div>

      {/* Auction Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status"></div>
          <p className="text-muted small mt-2">Loading marketplace auctions...</p>
        </div>
      ) : auctions.length > 0 ? (
        <div className="row g-4">
          {auctions.map((auction) => (
            <div className="col-md-6 col-lg-4" key={auction._id}>
              <div className="card-custom h-100 d-flex flex-column">
                <div className="auction-img-container">
                  <img
                    src={formatImageUrl(auction.product?.images?.[0])}
                    alt={auction.product?.name || 'Auction Item'}
                  />
                  <div className="position-absolute top-0 end-0 m-2">
                    {auction.status === 'active' && (
                      <span className="live-pill">
                        <span className="pulse-dot"></span>
                        Live
                      </span>
                    )}
                    {auction.status === 'pending' && (
                      <span className="pending-pill">
                        Upcoming
                      </span>
                    )}
                    {auction.status === 'completed' && (
                      <span className="ended-pill">
                        Ended
                      </span>
                    )}
                  </div>
                  <div className="position-absolute bottom-0 start-0 m-2">
                    <span className="category-badge">
                      {auction.product?.category || 'Curated'}
                    </span>
                  </div>
                </div>

                <div className="p-4 d-flex flex-column flex-grow-1">
                  <h5 className="fw-bold text-dark text-truncate mb-1">
                    {auction.product?.name || 'Curated Lot'}
                  </h5>
                  <p className="text-muted small text-truncate-2 mb-3">
                    {auction.product?.description || 'Authentic lot verified by platform standards.'}
                  </p>

                  <div className="mt-auto pt-3 border-top">
                    <div className="d-flex justify-content-between align-items-end mb-3">
                      <div>
                        <div className="metric-label">Current Bid</div>
                        <div className="metric-value">
                          ${(auction.currentBid || auction.startingBid || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="metric-label">Time Remaining</div>
                        <div className="fw-semibold text-dark small">
                          {auction.status === 'active' ? formatTimeLeft(auction.endTime) : 
                           auction.status === 'pending' ? `Starts ${new Date(auction.startTime).toLocaleDateString()}` : 'Completed'}
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3 text-muted small">
                      <span><i className="fas fa-gavel me-1"></i>{auction.totalBids || 0} bids placed</span>
                      <span><i className="far fa-eye me-1"></i>{auction.views || 0} watching</span>
                    </div>

                    <Link to={`/auctions/${auction._id}`} className="btn btn-primary w-100">
                      {auction.status === 'active' ? 'Enter Bidding Room' : 'View Lot Details'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 bg-white border rounded-3 p-4">
          <i className="fas fa-search fs-2 text-muted mb-3 d-block"></i>
          <h5 className="fw-bold mb-1">No matching auctions found</h5>
          <p className="text-muted small mb-3">Adjust your status filter or search keywords to view other available lots.</p>
          <button
            type="button"
            className="btn btn-outline-custom btn-sm me-2"
            onClick={() => setFilters({ status: '', category: '', search: '' })}
          >
            Clear Filters
          </button>
          <Link to="/create-product" className="btn btn-primary btn-sm">
            Create an Auction
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-5">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                Previous
              </button>
            </li>
            {[...Array(totalPages).keys()].map(page => (
              <li key={page + 1} className={`page-item ${currentPage === page + 1 ? 'active' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(page + 1)}>
                  {page + 1}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default AuctionList;
