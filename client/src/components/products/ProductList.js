import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, formatImageUrl } from '../../config/api';

const ProductList = ({ showAlert }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    category: '',
    condition: '',
    search: ''
  });

  useEffect(() => {
    document.title = 'Product Catalog | AuctionHub Marketplace';
  }, []);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams();
        queryParams.append('page', currentPage);
        queryParams.append('limit', 9);
        
        if (filters.category) queryParams.append('category', filters.category);
        if (filters.condition) queryParams.append('condition', filters.condition);
        if (filters.search) queryParams.append('search', filters.search);
        
        const res = await axios.get(`${API_BASE_URL}/api/products?${queryParams.toString()}`);
        
        setProducts(res.data.products || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || (res.data.products ? res.data.products.length : 0));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        showAlert && showAlert('Error loading products', 'danger');
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [currentPage, filters, showAlert]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 pb-3 border-bottom">
        <div>
          <div className="metric-label text-primary">Inventory</div>
          <h1 className="fw-extrabold mb-1 fs-2">Product Catalog</h1>
          <p className="text-muted small mb-0">Browse items available for upcoming and live auctions. ({totalCount} lots found)</p>
        </div>
        <Link to="/create-product" className="btn btn-primary btn-sm mt-3 mt-md-0">
          <i className="fas fa-plus"></i>
          <span>Add New Product</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="row g-3">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                name="search"
                className="form-control"
                placeholder="Search products by title, model, condition..."
                value={filters.search}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="col-md-4">
            <select
              name="category"
              className="form-select"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics & Computing</option>
              <option value="Jewelry">Horology & Jewelry</option>
              <option value="Collectibles">Rare Collectibles & Art</option>
              <option value="Fashion">Fashion & Apparel</option>
              <option value="Vehicles">Automotive & Memorabilia</option>
              <option value="Other">Other Curated Items</option>
            </select>
          </div>

          <div className="col-md-3">
            <select
              name="condition"
              className="form-select"
              value={filters.condition}
              onChange={handleFilterChange}
            >
              <option value="">All Conditions</option>
              <option value="New">New / Sealed</option>
              <option value="Like New">Like New (Mint)</option>
              <option value="Good">Good (Minor Wear)</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Salvage / Parts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status"></div>
          <p className="mt-2 text-muted small">Loading catalog items...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="row g-4">
          {products.map(product => (
            <div className="col-md-6 col-lg-4" key={product._id}>
              <div className="card-custom h-100 d-flex flex-column">
                <div className="auction-img-container">
                  <img
                    src={formatImageUrl(product.images?.[0])}
                    alt={product.name}
                  />
                  <span className="position-absolute bottom-0 start-0 m-2 category-badge">
                    {product.category}
                  </span>
                  <span className="position-absolute top-0 end-0 m-2 badge bg-white text-dark border shadow-xs fw-semibold px-2 py-1">
                    {product.condition}
                  </span>
                </div>

                <div className="p-4 d-flex flex-column flex-grow-1">
                  <h5 className="fw-bold text-dark text-truncate mb-1">{product.name}</h5>
                  <p className="text-muted small text-truncate-2 mb-3">{product.description}</p>
                  
                  <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-end mb-3">
                    <div>
                      <div className="metric-label">Base Price</div>
                      <div className="metric-value">${product.startingPrice?.toLocaleString()}</div>
                    </div>
                    <small className="text-muted text-truncate" style={{ maxWidth: '120px' }}>
                      By @{product.seller?.username || 'seller'}
                    </small>
                  </div>

                  <div className="d-flex gap-2">
                    <Link to={`/products/${product._id}`} className="btn btn-outline-custom flex-grow-1 btn-sm">
                      Inspect
                    </Link>
                    <Link to={`/create-auction/${product._id}`} className="btn btn-primary flex-grow-1 btn-sm">
                      Auction
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 bg-white border rounded-3 p-4">
          <i className="fas fa-box-open fs-2 text-muted mb-3 d-block"></i>
          <h5 className="fw-bold mb-1">No products found</h5>
          <p className="text-muted small mb-3">No products match your current criteria. Create a new listing or adjust filters.</p>
          <Link to="/create-product" className="btn btn-primary btn-sm">
            Add First Product
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

export default ProductList;
