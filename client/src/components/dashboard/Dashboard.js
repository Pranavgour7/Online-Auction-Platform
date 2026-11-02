import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { API_BASE_URL, formatImageUrl } from '../../config/api';

const Dashboard = ({ showAlert }) => {
  const { user } = useContext(AuthContext);
  
  const [myProducts, setMyProducts] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  
  useEffect(() => {
    document.title = 'My Dashboard | Auction Platform';

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [productsRes, auctionsRes, bidsRes, wonRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/products/user/me`),
          axios.get(`${API_BASE_URL}/api/auctions/user/me`),
          axios.get(`${API_BASE_URL}/api/bids/user/me`),
          axios.get(`${API_BASE_URL}/api/bids/won`)
        ]);

        setMyProducts(productsRes.data || []);
        setMyAuctions(auctionsRes.data || []);
        setMyBids(bidsRes.data || []);
        setWonAuctions(wonRes.data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        showAlert('Error loading dashboard data', 'danger');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [showAlert]);
  
  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/products/${id}`);
        setMyProducts(prev => prev.filter(p => p._id !== id));
        showAlert('Product deleted successfully', 'success');
      } catch (err) {
        showAlert(err.response?.data?.message || 'Error deleting product', 'danger');
      }
    }
  };
  
  const handleCancelAuction = async (id) => {
    if (window.confirm('Are you sure you want to cancel this auction?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/auctions/${id}`);
        setMyAuctions(prev => prev.map(a => a._id === id ? { ...a, status: 'cancelled' } : a));
        showAlert('Auction cancelled successfully', 'success');
      } catch (err) {
        showAlert(err.response?.data?.message || 'Error cancelling auction', 'danger');
      }
    }
  };
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5 py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1">User Dashboard</h1>
          <p className="text-muted mb-0">Welcome back, <strong>{user?.username}</strong>! Manage your products, bids, and auctions.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Link to="/create-product" className="btn btn-primary fw-bold shadow-sm">
            <i className="fas fa-plus me-1"></i> Add Product
          </Link>
          <Link to="/auctions" className="btn btn-outline-secondary">
            <i className="fas fa-gavel me-1"></i> Browse Auctions
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card-custom p-4">
            <div className="d-flex align-items-center">
              <div className="brand-icon-box flex-shrink-0 me-3">
                <i className="fas fa-box"></i>
              </div>
              <div>
                <div className="metric-label">My Listings</div>
                <div className="metric-value fs-3">{myProducts.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card-custom p-4">
            <div className="d-flex align-items-center">
              <div className="brand-icon-box flex-shrink-0 me-3">
                <i className="fas fa-gavel"></i>
              </div>
              <div>
                <div className="metric-label">Active Auctions</div>
                <div className="metric-value fs-3">{myAuctions.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card-custom p-4">
            <div className="d-flex align-items-center">
              <div className="brand-icon-box flex-shrink-0 me-3">
                <i className="fas fa-chart-line"></i>
              </div>
              <div>
                <div className="metric-label">Bids Placed</div>
                <div className="metric-value fs-3">{myBids.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="card-custom p-4">
            <div className="d-flex align-items-center">
              <div className="brand-icon-box flex-shrink-0 me-3" style={{ backgroundColor: 'var(--brand-emerald)' }}>
                <i className="fas fa-trophy"></i>
              </div>
              <div>
                <div className="metric-label">Auctions Won</div>
                <div className="metric-value fs-3" style={{ color: 'var(--brand-emerald)' }}>{wonAuctions.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="card-custom mb-4">
        <div className="p-3 border-bottom bg-light">
          <div className="d-flex flex-wrap gap-2">
            <button 
              className={`btn btn-sm ${activeTab === 'products' ? 'btn-primary' : 'btn-outline-custom'}`}
              onClick={() => setActiveTab('products')}
            >
              <i className="fas fa-box"></i> Listings ({myProducts.length})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'auctions' ? 'btn-primary' : 'btn-outline-custom'}`}
              onClick={() => setActiveTab('auctions')}
            >
              <i className="fas fa-gavel"></i> Auctions ({myAuctions.length})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'bids' ? 'btn-primary' : 'btn-outline-custom'}`}
              onClick={() => setActiveTab('bids')}
            >
              <i className="fas fa-history"></i> Bid History ({myBids.length})
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'won' ? 'btn-primary' : 'btn-outline-custom'}`}
              onClick={() => setActiveTab('won')}
            >
              <i className="fas fa-trophy"></i> Won ({wonAuctions.length})
            </button>
          </div>
        </div>

        <div className="card-body p-4">
          {/* Products Tab */}
          {activeTab === 'products' && (
            myProducts.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Condition</th>
                      <th>Base Price</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myProducts.map(p => (
                      <tr key={p._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={formatImageUrl(p.images?.[0])}
                              alt={p.name}
                              className="rounded-3 me-3"
                              style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                            />
                            <div>
                              <Link to={`/products/${p._id}`} className="fw-bold text-dark text-decoration-none">
                                {p.name}
                              </Link>
                              <small className="text-muted d-block">{new Date(p.createdAt).toLocaleDateString()}</small>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge bg-light text-dark border">{p.category}</span></td>
                        <td>{p.condition}</td>
                        <td className="fw-bold">${p.startingPrice?.toLocaleString()}</td>
                        <td className="text-end">
                          <Link to={`/create-auction/${p._id}`} className="btn btn-sm btn-primary me-2">
                            Launch Auction
                          </Link>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteProduct(p._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-box fa-3x text-muted mb-3 d-block"></i>
                <h5>No Products Listed Yet</h5>
                <p className="text-muted mb-3">Add your first item to begin auctioning on the platform.</p>
                <Link to="/create-product" className="btn btn-primary">
                  <i className="fas fa-plus me-1"></i> Add New Product
                </Link>
              </div>
            )
          )}

          {/* Auctions Tab */}
          {activeTab === 'auctions' && (
            myAuctions.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Item</th>
                      <th>Current Bid</th>
                      <th>Total Bids</th>
                      <th>End Time</th>
                      <th>Status</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAuctions.map(a => (
                      <tr key={a._id}>
                        <td>
                          <Link to={`/auctions/${a._id}`} className="fw-bold text-dark text-decoration-none">
                            {a.product?.name || 'Item'}
                          </Link>
                        </td>
                        <td className="fw-bold text-success">${a.currentBid?.toLocaleString()}</td>
                        <td>{a.totalBids || 0}</td>
                        <td>{new Date(a.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td>
                          <span className={
                            a.status === 'active' ? 'live-pill' :
                            a.status === 'pending' ? 'pending-pill' : 'ended-pill'
                          }>
                            {a.status === 'active' && <span className="pulse-dot"></span>}
                            {a.status?.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-end">
                          <Link to={`/auctions/${a._id}`} className="btn btn-sm btn-outline-primary me-2">
                            View Room
                          </Link>
                          {a.status === 'pending' && (
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleCancelAuction(a._id)}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-gavel fa-3x text-muted mb-3 d-block"></i>
                <h5>No Auctions Created Yet</h5>
                <p className="text-muted mb-3">Choose one of your products to set up a live auction.</p>
                <Link to="/create-product" className="btn btn-primary">
                  Add Product & Start Auction
                </Link>
              </div>
            )
          )}

          {/* My Bids Tab */}
          {activeTab === 'bids' && (
            myBids.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Auction Item</th>
                      <th>My Bid</th>
                      <th>Status</th>
                      <th>Timestamp</th>
                      <th className="text-end">Room</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myBids.map(b => (
                      <tr key={b._id}>
                        <td>
                          <Link to={`/auctions/${b.auction?._id}`} className="fw-bold text-dark text-decoration-none">
                            {b.auction?.product?.name || 'Auction Listing'}
                          </Link>
                        </td>
                        <td className="fw-bold">${b.amount?.toLocaleString()}</td>
                        <td>
                          <span className={
                            b.status === 'active' ? 'live-pill' :
                            b.status === 'outbid' ? 'badge bg-danger-subtle text-danger border border-danger-subtle fw-semibold px-2 py-1' :
                            b.status === 'won' ? 'badge bg-success-subtle text-success border border-success-subtle fw-semibold px-2 py-1' : 'ended-pill'
                          }>
                            {b.status === 'active' && <span className="pulse-dot"></span>}
                            {b.status?.toUpperCase()}
                          </span>
                        </td>
                        <td>{new Date(b.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="text-end">
                          <Link to={`/auctions/${b.auction?._id}`} className="btn btn-sm btn-outline-primary">
                            Enter Room
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-hand-holding-usd fa-3x text-muted mb-3 d-block"></i>
                <h5>No Bids Placed Yet</h5>
                <p className="text-muted mb-3">Explore active auctions and place your first competitive bid.</p>
                <Link to="/auctions" className="btn btn-primary">
                  Explore Live Auctions
                </Link>
              </div>
            )
          )}

          {/* Won Auctions Tab */}
          {activeTab === 'won' && (
            wonAuctions.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Winning Item</th>
                      <th>Final Hammer Price</th>
                      <th>Completed On</th>
                      <th>Seller</th>
                      <th className="text-end">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wonAuctions.map(a => (
                      <tr key={a._id}>
                        <td className="fw-bold">{a.product?.name}</td>
                        <td className="fw-bold text-success">${a.currentBid?.toLocaleString()}</td>
                        <td>{new Date(a.endTime).toLocaleDateString()}</td>
                        <td>@{a.createdBy?.username || 'seller'}</td>
                        <td className="text-end">
                          <Link to={`/auctions/${a._id}`} className="btn btn-sm btn-success">
                            View Receipt & Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-trophy fa-3x text-muted mb-3 d-block"></i>
                <h5>No Won Auctions Yet</h5>
                <p className="text-muted mb-3">Keep bidding on active listings to win exclusive items!</p>
                <Link to="/auctions" className="btn btn-primary">
                  Browse Active Auctions
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
