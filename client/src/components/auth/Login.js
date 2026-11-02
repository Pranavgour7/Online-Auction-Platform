import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';

const Login = ({ showAlert }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Login | Auction Platform';
  }, []);
  
  const { email, password } = formData;
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(email, password);
    setLoading(false);
    
    if (result.success) {
      showAlert('Login successful! Welcome back.', 'success');
      navigate('/dashboard');
    } else {
      showAlert(result.error, 'danger');
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setFormData({ email: demoEmail, password: demoPassword });
    setLoading(true);
    const result = await login(demoEmail, demoPassword);
    setLoading(false);
    if (result.success) {
      showAlert(`Logged in as ${demoEmail}! Welcome.`, 'success');
      navigate('/dashboard');
    } else {
      showAlert(result.error, 'danger');
    }
  };
  
  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4">
              <h2 className="text-center mb-4">Login</h2>
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={email}
                    onChange={onChange}
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={password}
                    onChange={onChange}
                    placeholder="Enter password"
                    required
                    minLength="6"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Logging in...
                    </>
                  ) : 'Login'}
                </button>
              </form>

              <div className="mt-4 pt-3 border-top">
                <p className="text-muted small text-center mb-2">⚡ Quick 1-Click Demo Access:</p>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm flex-fill"
                    disabled={loading}
                    onClick={() => handleDemoLogin('demo@auction.com', 'password123')}
                  >
                    <i className="fa-solid fa-user me-1"></i> Demo User
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm flex-fill"
                    disabled={loading}
                    onClick={() => handleDemoLogin('admin@auction.com', 'password123')}
                  >
                    <i className="fa-solid fa-shield-halved me-1"></i> Admin User
                  </button>
                </div>
              </div>

              <div className="text-center mt-3">
                <p className="mb-0 text-muted">
                  Don't have an account? <Link to="/register">Register</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
