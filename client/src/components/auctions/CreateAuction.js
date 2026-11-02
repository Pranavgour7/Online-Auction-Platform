import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { API_BASE_URL, formatImageUrl } from '../../config/api';

const CreateAuction = ({ showAlert }) => {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [userProducts, setUserProducts] = useState([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [formData, setFormData] = useState({
    product: productId || '',
    startTime: new Date(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 1 day
    startingBid: '',
    minBidIncrement: 10
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Create Auction | Auction Platform';
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const userProductsRes = await axios.get(`${API_BASE_URL}/api/products/user/me`);
        
        if (!userProductsRes.data || userProductsRes.data.length === 0) {
          showAlert('Please list a product first before scheduling an auction.', 'info');
          navigate('/create-product');
          return;
        }
        
        setUserProducts(userProductsRes.data);
        
        let targetProduct = null;
        if (productId) {
          targetProduct = userProductsRes.data.find(p => p._id === productId);
          if (!targetProduct) {
            const res = await axios.get(`${API_BASE_URL}/api/products/${productId}`);
            targetProduct = res.data;
          }
        } else {
          targetProduct = userProductsRes.data[0];
        }

        if (targetProduct) {
          setProduct(targetProduct);
          setFormData(prev => ({
            ...prev,
            product: targetProduct._id,
            startingBid: targetProduct.startingPrice || 10
          }));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        showAlert('Error loading products for auction', 'danger');
        setLoading(false);
        navigate('/dashboard');
      }
    };
    
    fetchData();
  }, [productId, navigate, showAlert]);
  
  const { product: selectedProductId, startTime, endTime, startingBid, minBidIncrement } = formData;
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleProductChange = (e) => {
    const newProductId = e.target.value;
    const selected = userProducts.find(p => p._id === newProductId);
    if (selected) {
      setProduct(selected);
      setFormData(prev => ({
        ...prev,
        product: selected._id,
        startingBid: selected.startingPrice || 10
      }));
    }
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    if (!selectedProductId) {
      showAlert('Please select a product to auction', 'danger');
      return;
    }
    
    const start = isScheduled ? new Date(startTime) : new Date();
    const end = new Date(endTime);
    
    if (end <= start) {
      showAlert('End time must be after the start time', 'danger');
      return;
    }
    
    if (parseFloat(startingBid) <= 0) {
      showAlert('Starting bid must be greater than zero', 'danger');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const payload = {
        product: selectedProductId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        startingBid: parseFloat(startingBid),
        minBidIncrement: parseFloat(minBidIncrement || 1)
      };
      
      const res = await axios.post(`${API_BASE_URL}/api/auctions`, payload);
      showAlert('Auction launched successfully!', 'success');
      navigate(`/auctions/${res.data._id}`);
    } catch (err) {
      console.error('Error creating auction:', err);
      showAlert(err.response?.data?.message || 'Error creating auction', 'danger');
      setSubmitting(false);
    }
  };

  const setDurationHours = (hours) => {
    const base = isScheduled ? new Date(startTime) : new Date();
    setFormData(prev => ({
      ...prev,
      endTime: new Date(base.getTime() + hours * 60 * 60 * 1000)
    }));
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1">Launch Auction</h1>
          <p className="text-muted mb-0">Set duration, reserve starting price, and live bidding parameters.</p>
        </div>
        <Link to="/dashboard" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-1"></i> Dashboard
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <form onSubmit={onSubmit}>
              {/* Product selector */}
              <div className="mb-4">
                <label className="form-label fw-bold">Select Product to Auction*</label>
                <select
                  className="form-select form-select-lg"
                  name="product"
                  value={selectedProductId}
                  onChange={handleProductChange}
                  required
                >
                  {userProducts.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Base Price: ${p.startingPrice})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Product Preview */}
              {product && (
                <div className="card bg-light border-0 rounded-3 p-3 mb-4 d-flex flex-row align-items-center gap-3">
                  <img
                    src={formatImageUrl(product.images?.[0])}
                    alt={product.name}
                    className="rounded-3"
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                  />
                  <div>
                    <h6 className="fw-bold mb-1">{product.name}</h6>
                    <span className="badge bg-secondary me-2">{product.category}</span>
                    <span className="badge bg-info">{product.condition}</span>
                  </div>
                </div>
              )}

              {/* Schedule Toggle */}
              <div className="form-check form-switch mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="scheduleToggle"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                />
                <label className="form-check-label fw-semibold" htmlFor="scheduleToggle">
                  Schedule auction for a future date/time (default is start immediately)
                </label>
              </div>

              {/* Start & End Times */}
              <div className="row g-3 mb-4">
                {isScheduled && (
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Start Time*</label>
                    <DatePicker
                      selected={startTime}
                      onChange={(date) => setFormData(prev => ({ ...prev, startTime: date }))}
                      showTimeSelect
                      dateFormat="MMM d, yyyy h:mm aa"
                      className="form-control"
                      minDate={new Date()}
                      required
                    />
                  </div>
                )}
                <div className={isScheduled ? 'col-md-6' : 'col-12'}>
                  <label className="form-label fw-bold">End Time*</label>
                  <DatePicker
                    selected={endTime}
                    onChange={(date) => setFormData(prev => ({ ...prev, endTime: date }))}
                    showTimeSelect
                    dateFormat="MMM d, yyyy h:mm aa"
                    className="form-control"
                    minDate={isScheduled ? startTime : new Date()}
                    required
                  />
                </div>
              </div>

              {/* Preset Durations */}
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted d-block">Quick Duration Presets:</label>
                <div className="d-flex flex-wrap gap-2">
                  {[
                    { label: '6 Hours', hours: 6 },
                    { label: '24 Hours (1 Day)', hours: 24 },
                    { label: '3 Days', hours: 72 },
                    { label: '7 Days', hours: 168 }
                  ].map(p => (
                    <button
                      key={p.hours}
                      type="button"
                      className="btn btn-outline-custom btn-sm"
                      onClick={() => setDurationHours(p.hours)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Starting Bid ($)*</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      name="startingBid"
                      className="form-control"
                      value={startingBid}
                      onChange={onChange}
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Minimum Increment ($)*</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      name="minBidIncrement"
                      className="form-control"
                      value={minBidIncrement}
                      onChange={onChange}
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating Auction...
                  </>
                ) : (
                  <>
                    <i className="fas fa-rocket me-2"></i> Launch Auction Now
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar Guidelines */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-light">
            <h5 className="fw-bold mb-3">
              <i className="fas fa-info-circle text-primary me-2"></i>Best Practices
            </h5>
            <ul className="small text-muted ps-3 mb-0">
              <li className="mb-2">A realistic starting bid encourages competitive bidding wars.</li>
              <li className="mb-2">Auctions between 24 and 72 hours typically yield the highest closing bids.</li>
              <li className="mb-2">Once an auction receives active bids, it cannot be deleted to protect bidder integrity.</li>
              <li className="mb-2">Live bidders are automatically notified via WebSocket upon every bid increment.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAuction;
