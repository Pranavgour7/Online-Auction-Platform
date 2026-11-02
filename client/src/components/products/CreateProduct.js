import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

const CreateProduct = ({ showAlert }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Electronics',
    condition: 'New',
    startingPrice: '',
    imageUrlInput: ''
  });
  
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    document.title = 'Add Product | Auction Platform';
  }, []);
  
  const { name, description, category, condition, startingPrice, imageUrlInput } = formData;
  
  const categories = [
    { value: 'Electronics', label: 'Electronics & Computing' },
    { value: 'Jewelry', label: 'Jewelry & Luxury Watches' },
    { value: 'Collectibles', label: 'Collectibles & Fine Art' },
    { value: 'Fashion', label: 'Fashion & Sneakers' },
    { value: 'Vehicles', label: 'Vehicles & Automotive' },
    { value: 'Other', label: 'Other Items' }
  ];
  
  const conditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleFileChange = e => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
      showAlert('Maximum 5 images allowed per product', 'warning');
      return;
    }
    
    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);
    
    const previews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    if (imageUrls.length + imageFiles.length >= 5) {
      showAlert('Maximum 5 images allowed', 'warning');
      return;
    }
    setImageUrls([...imageUrls, imageUrlInput.trim()]);
    setFormData({ ...formData, imageUrlInput: '' });
  };

  const removeFile = (index) => {
    const updated = [...imageFiles];
    updated.splice(index, 1);
    setImageFiles(updated);
    setImagePreviews(updated.map(f => URL.createObjectURL(f)));
  };

  const removeUrl = (index) => {
    const updated = [...imageUrls];
    updated.splice(index, 1);
    setImageUrls(updated);
  };
  
  const uploadFiles = async () => {
    if (imageFiles.length === 0) return [];

    const uploadData = new FormData();
    imageFiles.forEach(file => {
      uploadData.append('images', file);
    });

    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_BASE_URL}/api/uploads`, uploadData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        setUploadProgress(progress);
      }
    });

    return response.data.imageUrls || [];
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    if (parseFloat(startingPrice) <= 0) {
      showAlert('Starting base price must be greater than 0', 'danger');
      return;
    }
    
    if (imageFiles.length === 0 && imageUrls.length === 0) {
      showAlert('Please add at least one product photo or image URL', 'warning');
      return;
    }
    
    setSubmitting(true);
    
    try {
      let finalImages = [...imageUrls];
      
      if (imageFiles.length > 0) {
        const uploaded = await uploadFiles();
        finalImages = [...finalImages, ...uploaded];
      }
      
      const payload = {
        name,
        description,
        category,
        condition,
        images: finalImages,
        startingPrice: parseFloat(startingPrice)
      };

      const res = await axios.post(`${API_BASE_URL}/api/products`, payload);
      showAlert('Product created successfully! Now set up the auction.', 'success');
      navigate(`/create-auction/${res.data._id}`);
    } catch (err) {
      console.error('Error creating product:', err);
      showAlert(err.response?.data?.message || 'Error creating product', 'danger');
      setSubmitting(false);
    }
  };
  
  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="fw-bold mb-1">Add Product for Auction</h1>
          <p className="text-muted mb-0">Provide product specifications, high-resolution photos, and starting price.</p>
        </div>
        <Link to="/dashboard" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-1"></i> Dashboard
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <form onSubmit={onSubmit}>
              <div className="mb-4">
                <label className="form-label fw-bold">Product Title*</label>
                <input
                  type="text"
                  name="name"
                  className="form-control form-control-lg"
                  placeholder="e.g. Vintage 1968 Omega Speedmaster Chronograph"
                  value={name}
                  onChange={onChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">Full Description*</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="5"
                  placeholder="Describe condition, history, included accessories, dimensions, serial numbers, and highlights..."
                  value={description}
                  onChange={onChange}
                  required
                ></textarea>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Category*</label>
                  <select
                    name="category"
                    className="form-select"
                    value={category}
                    onChange={onChange}
                    required
                  >
                    {categories.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold">Condition*</label>
                  <select
                    name="condition"
                    className="form-select"
                    value={condition}
                    onChange={onChange}
                    required
                  >
                    {conditions.map(cond => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold">Starting Base Price ($)*</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="number"
                    name="startingPrice"
                    className="form-control"
                    placeholder="0.00"
                    value={startingPrice}
                    onChange={onChange}
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
                <small className="form-text text-muted">Initial reserve or opening bid price for the auction.</small>
              </div>

              {/* Image Upload / URL Section */}
              <div className="mb-4">
                <label className="form-label fw-bold">Product Photos (Max 5)</label>
                
                {/* File upload */}
                <div className="border border-2 border-dashed rounded-3 p-4 text-center mb-3 bg-light">
                  <i className="fas fa-cloud-upload-alt fa-2x text-primary mb-2 d-block"></i>
                  <p className="mb-2 fw-semibold">Upload Local Image Files</p>
                  <input
                    type="file"
                    className="form-control w-75 mx-auto"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                  />
                  <small className="text-muted d-block mt-2">Supports JPG, PNG, WEBP, GIF up to 10MB</small>
                </div>

                {/* Or Image URL */}
                <div className="input-group mb-3">
                  <input
                    type="url"
                    name="imageUrlInput"
                    className="form-control"
                    placeholder="Or paste an image web link (Unsplash, Imgur, CDN)..."
                    value={imageUrlInput}
                    onChange={onChange}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleAddImageUrl}
                  >
                    Add URL
                  </button>
                </div>

                {/* Previews */}
                {(imagePreviews.length > 0 || imageUrls.length > 0) && (
                  <div className="d-flex flex-wrap gap-2 pt-2">
                    {imageUrls.map((url, i) => (
                      <div key={`url-${i}`} className="position-relative">
                        <img
                          src={url}
                          alt="preview"
                          className="rounded-3 border"
                          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 px-1"
                          onClick={() => removeUrl(i)}
                          style={{ fontSize: '10px' }}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                    {imagePreviews.map((src, i) => (
                      <div key={`file-${i}`} className="position-relative">
                        <img
                          src={src}
                          alt="preview"
                          className="rounded-3 border"
                          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 px-1"
                          onClick={() => removeFile(i)}
                          style={{ fontSize: '10px' }}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="progress mb-4">
                  <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${uploadProgress}%` }}>
                    {uploadProgress}%
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating Product...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle me-2"></i> Save & Continue to Auction Setup
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-light">
            <h5 className="fw-bold mb-3">
              <i className="fas fa-lightbulb text-warning me-2"></i>Seller Advice
            </h5>
            <ul className="small text-muted ps-3 mb-0">
              <li className="mb-2">Clean, well-lit photos directly increase auction engagement by over 300%.</li>
              <li className="mb-2">Include visible markings, original packaging, and provenance details.</li>
              <li className="mb-2">Once created, you will be redirected to schedule the starting time and auction duration.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;
