import React from 'react';

const Alert = ({ alert }) => {
  if (!alert) return null;

  return (
    <div className="container pt-3">
      <div 
        className={`alert alert-${alert.type} alert-dismissible fade show d-flex align-items-center gap-2 mb-0`} 
        role="alert"
      >
        <i className={`fas ${
          alert.type === 'success' ? 'fa-check-circle text-success' :
          alert.type === 'danger' ? 'fa-exclamation-circle text-danger' :
          alert.type === 'warning' ? 'fa-exclamation-triangle text-warning' : 'fa-info-circle text-info'
        } fs-5 flex-shrink-0`}></i>
        <div className="flex-grow-1 fw-semibold">{alert.msg}</div>
        <button type="button" className="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    </div>
  );
};

export default Alert;
