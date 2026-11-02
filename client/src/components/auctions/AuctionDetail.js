import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { API_BASE_URL, formatImageUrl } from '../../config/api';

const AuctionDetail = ({ showAlert }) => {
  const { id } = useParams();
  const { isAuthenticated, user } = useContext(AuthContext);
  const socketContext = useSocket();
  const navigate = useNavigate();
  
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [bidLoading, setBidLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const timerRef = useRef(null);
  const bidListRef = useRef(null);
  
  // Fetch auction details and bids
  useEffect(() => {
    let isMounted = true;
    const fetchAuctionData = async () => {
      try {
        setLoading(true);
        const [auctionRes, bidsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/auctions/${id}`),
          axios.get(`${API_BASE_URL}/api/bids/auction/${id}`)
        ]);

        if (!isMounted) return;
        const auctionData = auctionRes.data;
        setAuction(auctionData);
        setBids(bidsRes.data);
        
        // Calculate recommended next bid amount
        const nextMin = (auctionData.totalBids === 0 || !auctionData.currentHighestBidder)
          ? auctionData.startingBid
          : auctionData.currentBid + auctionData.minBidIncrement;
        setBidAmount(nextMin);
        
        document.title = `${auctionData.product?.name || 'Auction'} | Auction Platform`;
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching auction data:', err);
        showAlert('Error loading auction data', 'danger');
        setLoading(false);
        navigate('/auctions');
      }
    };
    
    fetchAuctionData();
    return () => { isMounted = false; };
  }, [id]);
  
  // Join auction room on component mount
  useEffect(() => {
    if (socketContext?.socket && id) {
      socketContext.joinAuction(id);
    }
    
    return () => {
      if (socketContext?.socket && id) {
        socketContext.leaveAuction(id);
      }
    };
  }, [id, socketContext]);
  
  // Listen for real-time bids
  useEffect(() => {
    if (socketContext?.socket) {
      const handleBidPlaced = (newBid) => {
        setBids(prev => {
          const exists = prev.some(b => b._id === newBid._id);
          return exists ? prev : [newBid, ...prev];
        });
        
        setAuction(prev => {
          if (!prev) return prev;
          const nextBidIncrement = prev.minBidIncrement || 1;
          setBidAmount(newBid.amount + nextBidIncrement);
          return {
            ...prev,
            currentBid: newBid.amount,
            currentHighestBidder: newBid.bidder,
            totalBids: (prev.totalBids || 0) + 1
          };
        });
      };
      
      const handleAuctionUpdated = (updated) => {
        if (updated._id === id) {
          setAuction(updated);
        }
      };
      
      socketContext.socket.on('bidPlaced', handleBidPlaced);
      socketContext.socket.on('auctionUpdated', handleAuctionUpdated);
      
      return () => {
        socketContext.socket.off('bidPlaced', handleBidPlaced);
        socketContext.socket.off('auctionUpdated', handleAuctionUpdated);
      };
    }
  }, [socketContext, id]);
  
  // Update time countdown
  useEffect(() => {
    const updateCountdown = () => {
      if (!auction) return;
      
      const now = new Date();
      const endTime = new Date(auction.endTime);
      const remainingTime = endTime - now;
      
      if (remainingTime <= 0) {
        setTimeRemaining('Auction Ended');
        setAuction(prev => (prev ? { ...prev, status: 'completed' } : prev));
        clearInterval(timerRef.current);
        return;
      }
      
      const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
      
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };
    
    updateCountdown();
    timerRef.current = setInterval(updateCountdown, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [auction?.endTime, auction?.status]);
  
  // Handle bid submit
  const handleBidSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!isAuthenticated) {
      showAlert('Please log in to place a bid', 'warning');
      navigate('/login');
      return;
    }
    
    if (!auction) return;
    
    if (auction.status !== 'active') {
      showAlert('Cannot place bid on inactive auction', 'warning');
      return;
    }
    
    if (auction.createdBy?._id === user?.id) {
      showAlert('You cannot bid on your own auction', 'warning');
      return;
    }
    
    const amountNum = parseFloat(bidAmount);
    const minRequired = (auction.totalBids === 0 || !auction.currentHighestBidder)
      ? auction.startingBid
      : auction.currentBid + auction.minBidIncrement;

    if (isNaN(amountNum) || amountNum < minRequired) {
      showAlert(`Minimum required bid is $${minRequired.toFixed(2)}`, 'warning');
      return;
    }
    
    setBidLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_BASE_URL}/api/bids`,
        {
          auction: id,
          amount: amountNum
        },
        {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'x-auth-token': token
          } : {}
        }
      );
      
      if (res.data?.auction) {
        setAuction(res.data.auction);
        const nextMin = res.data.auction.currentBid + (res.data.auction.minBidIncrement || 1);
        setBidAmount(nextMin);
      }
      if (res.data?.bid) {
        setBids(prev => {
          const exists = prev.some(b => b._id === res.data.bid._id);
          return exists ? prev : [res.data.bid, ...prev];
        });
      }
      showAlert(`Success! Your bid of $${amountNum.toFixed(2)} is now highest.`, 'success');
      setBidLoading(false);
    } catch (err) {
      console.error('Error placing bid:', err);
      showAlert(err.response?.data?.message || 'Error placing bid', 'danger');
      setBidLoading(false);
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
  
  if (!auction) {
    return (
      <div className="container my-5 text-center">
        <div className="alert alert-danger">Auction not found or has been removed.</div>
        <Link to="/auctions" className="btn btn-primary">Back to Auctions</Link>
      </div>
    );
  }
  
  const isOwner = isAuthenticated && user && auction.createdBy?._id === user?.id;
  const isHighestBidder = isAuthenticated && user && auction.currentHighestBidder?._id === user?.id;
  const productImages = auction.product?.images || [];
  const currentImage = productImages[selectedImage] || productImages[0];
  
  return (
    <div className="container py-4">
      {/* Breadcrumb / Top Bar */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item"><Link to="/">Home</Link></li>
              <li className="breadcrumb-item"><Link to="/auctions">Auctions</Link></li>
              <li className="breadcrumb-item active" aria-current="page">{auction.product?.name}</li>
            </ol>
          </nav>
          <h2 className="fw-bold mb-0">{auction.product?.name}</h2>
        </div>
        <Link to="/auctions" className="btn btn-outline-secondary btn-sm">
          <i className="fas fa-arrow-left me-1"></i> All Auctions
        </Link>
      </div>
      
      <div className="row g-4">
        {/* Left Column: Media & Description */}
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
            <div className="position-relative bg-light text-center p-3">
              <img
                src={formatImageUrl(currentImage)}
                alt={auction.product?.name}
                className="img-fluid rounded-3"
                style={{ maxHeight: '420px', objectFit: 'contain', width: '100%' }}
              />
              <span className={`position-absolute top-0 end-0 m-3 badge ${
                auction.status === 'active' ? 'bg-success' : 
                auction.status === 'pending' ? 'bg-warning text-dark' : 'bg-secondary'
              } px-3 py-2 shadow-sm fs-6`}>
                {auction.status?.toUpperCase()}
              </span>
            </div>

            {/* Thumbnail Carousel */}
            {productImages.length > 1 && (
              <div className="p-3 border-top d-flex gap-2 overflow-auto">
                {productImages.map((img, idx) => (
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
                {auction.product?.description}
              </p>

              <h6 className="fw-bold mb-3">Item Specifications</h6>
              <div className="row g-2">
                <div className="col-6 col-md-4">
                  <div className="p-3 rounded-2 border bg-white shadow-xs">
                    <small className="metric-label d-block text-muted">Category</small>
                    <strong className="text-dark">{auction.product?.category}</strong>
                  </div>
                </div>
                <div className="col-6 col-md-4">
                  <div className="p-3 rounded-2 border bg-white shadow-xs">
                    <small className="metric-label d-block text-muted">Condition</small>
                    <strong className="text-dark">{auction.product?.condition}</strong>
                  </div>
                </div>
                <div className="col-6 col-md-4">
                  <div className="p-3 rounded-2 border bg-white shadow-xs">
                    <small className="metric-label d-block text-muted">Seller</small>
                    <strong className="text-dark">{auction.createdBy?.username || 'Verified Seller'}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bidding Console */}
        <div className="col-lg-5">
          {/* Status & Timer Card */}
          <div className="card-custom p-4 mb-4 text-white" style={{ backgroundColor: 'var(--slate-900)', border: '1px solid var(--slate-800)' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="live-pill">
                <span className="pulse-dot"></span>
                Socket Live
              </span>
              <span className="small fw-semibold" style={{ color: '#94a3b8' }}>
                LOT #{auction._id?.slice(-6).toUpperCase()}
              </span>
            </div>
            
            <div className="row g-2 align-items-end mt-1">
              <div className="col-7">
                <div className="metric-label" style={{ color: '#cbd5e1' }}>Current Highest Bid</div>
                <div className="metric-value text-white fs-2">
                  ${auction.currentBid?.toLocaleString() || auction.startingBid?.toLocaleString()}
                </div>
              </div>
              <div className="col-5 text-end">
                <div className="metric-label" style={{ color: '#cbd5e1' }}>Time Remaining</div>
                <div className="fw-bold fs-5 text-white">
                  {auction.status === 'active' ? timeRemaining : auction.status?.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-top small d-flex justify-content-between" style={{ borderColor: 'var(--slate-800)', color: '#cbd5e1' }}>
              <span>Opening Bid: <strong className="text-white">${auction.startingBid}</strong></span>
              <span>Min Step: <strong className="text-white">+${auction.minBidIncrement}</strong></span>
            </div>
          </div>

          {/* Place Bid Form */}
          <div className="card-custom p-4 mb-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <i className="fas fa-gavel text-primary"></i>
              <span>Place Your Bid</span>
            </h5>

            {auction.status === 'active' ? (
              isOwner ? (
                <div className="alert alert-warning mb-0 small">
                  <i className="fas fa-shield-alt me-2"></i>
                  You created this auction. Platform regulations prohibit bidding on your own listing.
                </div>
              ) : isAuthenticated ? (
                <form onSubmit={handleBidSubmit}>
                  {isHighestBidder && (
                    <div className="alert alert-success d-flex align-items-center py-2 mb-3 small">
                      <i className="fas fa-check-circle me-2"></i>
                      <span>You currently hold the highest bid on this lot.</span>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-muted">Bid Amount (USD)</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        className="form-control"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        min={auction.currentBid + auction.minBidIncrement}
                        step="0.01"
                        required
                      />
                    </div>
                    <small className="form-text text-muted">
                      Suggested minimum: ${(auction.currentBid + auction.minBidIncrement).toFixed(2)}
                    </small>
                  </div>

                  {/* Quick increment buttons */}
                  <div className="d-flex gap-2 mb-3">
                    {[10, 25, 50, 100].map(inc => (
                      <button
                        key={inc}
                        type="button"
                        className="btn btn-outline-custom btn-sm flex-grow-1"
                        onClick={() => setBidAmount((parseFloat(auction.currentBid) + inc).toFixed(2))}
                      >
                        +${inc}
                      </button>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-accent w-100 py-2 fw-bold"
                    disabled={bidLoading}
                  >
                    {bidLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Broadcasting Bid...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-gavel"></i> Confirm & Place Bid
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="bg-light p-4 rounded-3 text-center border">
                  <p className="text-muted small mb-3">Please sign in to place live bids and access buyer protections.</p>
                  <Link to="/login" className="btn btn-primary btn-sm px-4">
                    Sign In to Bid
                  </Link>
                </div>
              )
            ) : (
              <div className="alert alert-secondary mb-0 small">
                This auction is currently <strong>{auction.status}</strong>. Bidding is closed.
              </div>
            )}
          </div>

          {/* Real-Time Bid History */}
          <div className="card-custom">
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
              <h6 className="fw-bold mb-0 text-dark small text-uppercase">
                <i className="fas fa-history text-muted me-2"></i>Live Bid Ledger
              </h6>
              <span className="badge bg-dark rounded-pill">{bids.length}</span>
            </div>
            
            <div
              className="p-0"
              style={{ maxHeight: '300px', overflowY: 'auto' }}
              ref={bidListRef}
            >
              {bids.length > 0 ? (
                <ul className="list-group list-group-flush small">
                  {bids.map((b, idx) => (
                    <li
                      key={b._id || idx}
                      className={`list-group-item px-3 py-2 d-flex justify-content-between align-items-center ${
                        idx === 0 ? 'bg-light fw-bold border-start border-3 border-success' : ''
                      }`}
                    >
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fs-6 text-dark">${b.amount?.toLocaleString()}</span>
                          {idx === 0 && (
                            <span className="live-pill" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>Leading</span>
                          )}
                        </div>
                        <span className="text-muted" style={{ fontSize: '12px' }}>
                          {b.bidder?.username || 'Verified Bidder'}
                          {b.bidder?._id === user?.id && ' (You)'}
                        </span>
                      </div>
                      <div className="text-end text-muted" style={{ fontSize: '11px' }}>
                        <div>{new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-muted">
                  <i className="fas fa-hand-holding-usd fa-2x mb-2 text-secondary"></i>
                  <p className="mb-0 small">No bids placed yet. Be the first to place an opening bid!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;
