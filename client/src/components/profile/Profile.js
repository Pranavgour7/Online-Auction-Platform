import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import ImageWithFallback from '../common/ImageWithFallback';

const Profile = ({ showAlert }) => {
  const { user, updateProfile, changePassword } = useContext(AuthContext);
  
  // Profile form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    }
  });
  
  // Password change form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // State to track active tab
  const [activeTab, setActiveTab] = useState('profile');
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Fill form with user data when available
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zip: user.address?.zip || '',
          country: user.address?.country || ''
        }
      });
    }
  }, [user]);
  
  const { firstName, lastName, phoneNumber, address } = formData;
  const { currentPassword, newPassword, confirmPassword } = passwordData;
  
  const onChange = e => {
    if (e.target.name.startsWith('address.')) {
      const addressField = e.target.name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: e.target.value
        }
      });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };
  
  const onPasswordChange = e => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    
    const result = await updateProfile(formData);
    
    setLoading(false);
    
    if (result.success) {
      showAlert('Profile updated successfully', 'success');
    } else {
      showAlert(result.error, 'danger');
    }
  };
  
  const onPasswordSubmit = async e => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showAlert('New passwords do not match', 'danger');
      return;
    }
    
    setPasswordLoading(true);
    
    const result = await changePassword(currentPassword, newPassword);
    
    setPasswordLoading(false);
    
    if (result.success) {
      showAlert('Password changed successfully', 'success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      showAlert(result.error, 'danger');
    }
  };
  
  if (!user) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Calculate display name
  const displayName = `${firstName || ''} ${lastName || ''}`.trim() || user.username;
  
  // Generate avatar from name
  const generateAvatar = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=256`;
  };
  
  return (
    <div className="container py-5">
      <div className="row">
        {/* Left Sidebar - User Info */}
        <div className="col-lg-3 mb-4">
          <div className="card-custom overflow-hidden mb-4">
            <div className="p-4 text-center text-white" style={{ backgroundColor: 'var(--slate-900)' }}>
              <div className="mb-3">
                <ImageWithFallback
                  src={user.avatar}
                  fallbackSrc={generateAvatar(displayName)}
                  alt={displayName}
                  className="rounded-circle img-fluid mx-auto d-block border border-2 border-white shadow-sm"
                  style={{ width: "96px", height: "96px", objectFit: "cover" }}
                />
              </div>
              <h4 className="text-white mb-1 fw-bold">{displayName}</h4>
              <p className="mb-0 small fw-medium" style={{ color: '#cbd5e1' }}>@{user.username}</p>
            </div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex align-items-center py-3">
                  <i className="fas fa-envelope text-primary me-3"></i>
                  <div>
                    <small className="metric-label d-block text-muted">Email</small>
                    <span className="text-dark fw-medium">{user.email}</span>
                  </div>
                </li>
                <li className="list-group-item d-flex align-items-center py-3">
                  <i className="fas fa-phone text-primary me-3"></i>
                  <div>
                    <small className="metric-label d-block text-muted">Phone</small>
                    <span className="text-dark fw-medium">{phoneNumber || 'Not provided'}</span>
                  </div>
                </li>
                <li className="list-group-item d-flex align-items-center py-3">
                  <i className="fas fa-map-marker-alt text-primary me-3"></i>
                  <div>
                    <small className="metric-label d-block text-muted">Location</small>
                    <span className="text-dark fw-medium">{address.city && address.country ? `${address.city}, ${address.country}` : 'Not provided'}</span>
                  </div>
                </li>
                <li className="list-group-item d-flex align-items-center py-3">
                  <i className="fas fa-user-shield text-primary me-3"></i>
                  <div>
                    <small className="metric-label d-block text-muted">Account Type</small>
                    <span className="badge bg-light text-dark border fw-semibold mt-1">
                      {user.role === 'admin' ? 'Administrator' : 'Verified Bidder'}
                    </span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="card-footer bg-light p-3 border-top">
              <div className="d-grid gap-2">
                <Link to="/dashboard" className="btn btn-outline-custom btn-sm">
                  <i className="fas fa-tachometer-alt me-2"></i>Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Content Area - Forms */}
        <div className="col-lg-9">
          <div className="card-custom mb-4">
            <div className="card-header bg-white p-3 border-bottom">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <i className="fas fa-user me-2"></i>Profile Details
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                  >
                    <i className="fas fa-lock me-2"></i>Security
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'activity' ? 'active' : ''}`}
                    onClick={() => setActiveTab('activity')}
                  >
                    <i className="fas fa-chart-line me-2"></i>Activity
                  </button>
                </li>
              </ul>
            </div>
            
            <div className="card-body p-4">
              {/* Profile Details Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={onSubmit}>
                  <h5 className="mb-4">Personal Information</h5>
                  
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control"
                          id="firstName"
                          name="firstName"
                          placeholder="First Name"
                          value={firstName}
                          onChange={onChange}
                        />
                        <label htmlFor="firstName">First Name</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control"
                          id="lastName"
                          name="lastName"
                          placeholder="Last Name"
                          value={lastName}
                          onChange={onChange}
                        />
                        <label htmlFor="lastName">Last Name</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-floating mb-4">
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      placeholder="Username"
                      value={user.username}
                      disabled
                    />
                    <label htmlFor="username">Username (cannot be changed)</label>
                  </div>
                  
                  <div className="form-floating mb-4">
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      placeholder="Email"
                      value={user.email}
                      disabled
                    />
                    <label htmlFor="email">Email (cannot be changed)</label>
                  </div>
                  
                  <div className="form-floating mb-4">
                    <input
                      type="tel"
                      className="form-control"
                      id="phoneNumber"
                      name="phoneNumber"
                      placeholder="Phone Number"
                      value={phoneNumber}
                      onChange={onChange}
                    />
                    <label htmlFor="phoneNumber">Phone Number</label>
                  </div>
                  
                  <h5 className="mt-5 mb-4">Address Information</h5>
                  
                  <div className="form-floating mb-4">
                    <input
                      type="text"
                      className="form-control"
                      id="street"
                      name="address.street"
                      placeholder="Street Address"
                      value={address.street}
                      onChange={onChange}
                    />
                    <label htmlFor="street">Street Address</label>
                  </div>
                  
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control"
                          id="city"
                          name="address.city"
                          placeholder="City"
                          value={address.city}
                          onChange={onChange}
                        />
                        <label htmlFor="city">City</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control"
                          id="state"
                          name="address.state"
                          placeholder="State/Province"
                          value={address.state}
                          onChange={onChange}
                        />
                        <label htmlFor="state">State/Province</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control"
                          id="zip"
                          name="address.zip"
                          placeholder="ZIP/Postal Code"
                          value={address.zip}
                          onChange={onChange}
                        />
                        <label htmlFor="zip">ZIP/Postal Code</label>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-floating">
                        <input
                          type="text"
                          className="form-control"
                          id="country"
                          name="address.country"
                          placeholder="Country"
                          value={address.country}
                          onChange={onChange}
                        />
                        <label htmlFor="country">Country</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i>Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
              
              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h5 className="mb-4">Change Password</h5>
                  
                  <form onSubmit={onPasswordSubmit}>
                    <div className="form-floating mb-4">
                      <input
                        type="password"
                        className="form-control"
                        id="currentPassword"
                        name="currentPassword"
                        placeholder="Current Password"
                        value={currentPassword}
                        onChange={onPasswordChange}
                        required
                      />
                      <label htmlFor="currentPassword">Current Password</label>
                    </div>
                    
                    <div className="form-floating mb-4">
                      <input
                        type="password"
                        className="form-control"
                        id="newPassword"
                        name="newPassword"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={onPasswordChange}
                        required
                        minLength="6"
                      />
                      <label htmlFor="newPassword">New Password</label>
                      <div className="form-text">Password must be at least 6 characters long</div>
                    </div>
                    
                    <div className="form-floating mb-4">
                      <input
                        type="password"
                        className="form-control"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={onPasswordChange}
                        required
                      />
                      <label htmlFor="confirmPassword">Confirm New Password</label>
                    </div>
                    
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={passwordLoading}
                      >
                        {passwordLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Updating...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-key me-2"></i>Change Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                  
                  <hr className="my-5" />
                  
                  <h5 className="mb-4">Account Security</h5>
                  
                  <div className="list-group mb-4">
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">Two-Factor Authentication</h6>
                        <p className="text-muted mb-0 small">Add an extra layer of security to your account</p>
                      </div>
                      <span className="badge bg-danger rounded-pill">Disabled</span>
                    </div>
                    <div className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">Login Notifications</h6>
                        <p className="text-muted mb-0 small">Get notified when someone logs into your account</p>
                      </div>
                      <span className="badge bg-success rounded-pill">Enabled</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">Recent Activity</h5>
                    <div className="dropdown">
                      <button className="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="activityFilterDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        Filter
                      </button>
                      <ul className="dropdown-menu" aria-labelledby="activityFilterDropdown">
                        <li><a className="dropdown-item" href="#!">All Activity</a></li>
                        <li><a className="dropdown-item" href="#!">Auctions</a></li>
                        <li><a className="dropdown-item" href="#!">Bids</a></li>
                        <li><a className="dropdown-item" href="#!">Account</a></li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="timeline">
                    <div className="timeline-item">
                      <div className="timeline-marker bg-primary">
                        <i className="fas fa-gavel text-white"></i>
                      </div>
                      <div className="timeline-content">
                        <div className="d-flex justify-content-between mb-1">
                          <h6 className="fw-bold mb-0">Placed a bid</h6>
                          <small className="text-muted">2 hours ago</small>
                        </div>
                        <p className="mb-2">You placed a bid of $120 on "Vintage Camera Collection"</p>
                        <a href="#!" className="btn btn-sm btn-outline-primary">View Auction</a>
                      </div>
                    </div>
                    
                    <div className="timeline-item">
                      <div className="timeline-marker bg-success">
                        <i className="fas fa-trophy text-white"></i>
                      </div>
                      <div className="timeline-content">
                        <div className="d-flex justify-content-between mb-1">
                          <h6 className="fw-bold mb-0">Won an auction</h6>
                          <small className="text-muted">Yesterday</small>
                        </div>
                        <p className="mb-2">You won the auction for "Antique Wooden Chair" with a bid of $250</p>
                        <a href="#!" className="btn btn-sm btn-outline-success">Complete Purchase</a>
                      </div>
                    </div>
                    
                    <div className="timeline-item">
                      <div className="timeline-marker bg-info">
                        <i className="fas fa-tag text-white"></i>
                      </div>
                      <div className="timeline-content">
                        <div className="d-flex justify-content-between mb-1">
                          <h6 className="fw-bold mb-0">Created an auction</h6>
                          <small className="text-muted">3 days ago</small>
                        </div>
                        <p className="mb-2">You created an auction for "Handcrafted Pottery Set"</p>
                        <a href="#!" className="btn btn-sm btn-outline-info">View Auction</a>
                      </div>
                    </div>
                    
                    <div className="timeline-item">
                      <div className="timeline-marker bg-warning">
                        <i className="fas fa-user text-white"></i>
                      </div>
                      <div className="timeline-content">
                        <div className="d-flex justify-content-between mb-1">
                          <h6 className="fw-bold mb-0">Updated profile</h6>
                          <small className="text-muted">1 week ago</small>
                        </div>
                        <p className="mb-0">You updated your profile information</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="d-grid mt-4">
                    <button className="btn btn-outline-primary btn-sm">
                      <i className="fas fa-history me-2"></i>View All Activity
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 