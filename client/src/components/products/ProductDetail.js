import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { API_BASE_URL, formatImageUrl } from '../../config/api';

const ProductDetail = ({ showAlert }) => {
  const { id } = useParams();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [deleting, setDeleting] = useState(false);
  
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const [productRes, auctionsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/products/${id}`),
          axios.get(`${API_BASE_URL}/api/auctions?status=active`)
        ]);
        
        setProduct(productRes.data);
        document.title = `${productRes.data.name} | Auction Platform`;
        
        // Find auctions matching this product
        if (auctionsRes.data && auctionsRes.data.auctions) {
          const matching = auctionsRes.data.auctions.filter(
            a => a.product && (a.product._id === id || a.product === id)
          );
          setActiveAuctions(matching);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching product data:', err);
        showAlert('Error loading product details', 'danger');
        setLoading(false);
      }
    };
    
    fetchProductData();
  }, [id, showAlert]);

  const handleDeleteProduct = async () => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/products/${id}`);
      showAlert('Product deleted successfully', 'success');
      navigate('/dashboard');
    } catch (err) {
      showAlert(err.response?.data?.message || 'Error deleting product', 'danger');
      setDeleting(false);
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
  
  if (!product) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">Product not found.</div>
        <Link to="/products" className="btn btn-primary">Back to Products</Link>
      </div>
    );
  }
  
  const isOwner = isAuthenticated && user && (product.seller?._id === user.id || product.seller === user.id);
  const images = product.images || [];
  const currentImage = images[selectedImage] || images[0];
  
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
              <li className="breadcrumb-item active" aria-current="page">{product.name}</li>
            </ol>
          </nav>
          <h2 className="fw-bold mb-0">{product.name}</h2>
        </div>
        <Link to="/products" className="btn btn-outline-secondary btn-sm">
          <i className="fas fa-arrow-left me-1"></i> Catalog
        </Link>
      </div>
      
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
            <div className="bg-light text-center p-3">
              <img
                src={formatImageUrl(currentImage)}
                alt={product.name}
                className="img-fluid rounded-3"
                style={{ maxHeight: '420px', objectFit: 'contain', width: '100%' }}
              />
            </div>

            {images.length > 1 && (
              <div className="p-3 border-top d-flex gap-2 overflow-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`btn p-0 border rounded-3 overflow-hidden ${selectedImage === idx ? 'border-primary border-3' : 'opacity-75'}`}
                    onClick={() => setSelectedImage(idx)}
                    style={{ width: '70px', height: '70px' }}
                  >
                    <img
                      src={formatImageUrl(img)}
                      alt={`Thumb ${idx}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Product Description</h5>
              <p className="text-secondary leading-relaxed mb-4">
                {product.description}
              </p>

              <h6 className="fw-bold mb-3">Technical Specifications</h6>
              <div className="row g-2">
                <div className="col-md-4">
                  <div className="p-3 rounded-2 border bg-white shadow-xs">
                    <small className="metric-label d-block text-muted">Condition</small>
                    <strong className="fs-6 mt-1 d-block text-dark">{product.condition}</strong>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 rounded-2 border bg-white shadow-xs">
                    <small className="metric-label d-block text-muted">Category</small>
                    <strong className="fs-6 mt-1 d-block text-dark">{product.category}</strong>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 rounded-2 border bg-white shadow-xs">
                    <small className="metric-label d-block text-muted">Base Price</small>
                    <strong className="fs-6 mt-1 d-block metric-value">${product.startingPrice?.toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          {/* Auction Status Card */}
          <div className="card-custom p-4 mb-4">
            <h5 className="fw-bold mb-3">Auction Status</h5>
            {activeAuctions.length > 0 ? (
              <div className="alert alert-success border rounded-3 p-3 mb-0">
                <div className="d-flex align-items-center mb-2">
                  <span className="live-pill me-2">
                    <span className="pulse-dot"></span>
                    Live Now
                  </span>
                </div>
                <p className="small mb-3">
                  Current Highest Bid: <strong className="fs-5 d-block mt-1">${activeAuctions[0].currentBid?.toLocaleString()}</strong>
                </p>
                <Link to={`/auctions/${activeAuctions[0]._id}`} className="btn btn-accent w-100 fw-bold">
                  Enter Auction Room & Bid
                </Link>
              </div>
            ) : (
              <div className="p-3 border rounded-3 text-center mb-3 bg-light">
                <p className="text-muted small mb-2">This item does not currently have an active auction.</p>
                {isOwner && (
                  <Link to={`/create-auction/${product._id}`} className="btn btn-primary w-100 fw-semibold">
                    <i className="fas fa-gavel me-1"></i> Start Auction for this Item
                  </Link>
                )}
              </div>
            )}

            {isOwner && (
              <div className="pt-3 border-top d-grid gap-2">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleDeleteProduct}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Product Listing'}
                </button>
              </div>
            )}
          </div>

          {/* Seller Profile */}
          <div className="card-custom p-4">
            <h5 className="fw-bold mb-3">Seller Details</h5>
            <div className="d-flex align-items-center mb-3">
              <div className="brand-icon-box flex-shrink-0 me-3" style={{ width: '44px', height: '44px', fontSize: '1.1rem' }}>
                <i className="fas fa-user-check"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-0">@{product.seller?.username || 'seller'}</h6>
                <small className="text-muted">Verified Marketplace Seller</small>
              </div>
            </div>
            <p className="small text-muted mb-0">
              Member since {new Date(product.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
