import React, { useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Alert from './components/layout/Alert';

// Page Components
import Home from './components/pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Profile from './components/profile/Profile';
import AuctionList from './components/auctions/AuctionList';
import AuctionDetail from './components/auctions/AuctionDetail';
import CreateAuction from './components/auctions/CreateAuction';
import ProductList from './components/products/ProductList';
import ProductDetail from './components/products/ProductDetail';
import CreateProduct from './components/products/CreateProduct';
import NotFound from './components/pages/NotFound';
import PrivateRoute from './components/routing/PrivateRoute';

function App() {
  const [alert, setAlert] = useState(null);

  // Show alert with stable callback reference so child useEffect hooks do not re-trigger
  const showAlert = useCallback((msg, type, timeout = 5000) => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), timeout);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <div className="App d-flex flex-column min-vh-100">
            <Navbar />
            <Alert alert={alert} />
            <main className="flex-grow-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login showAlert={showAlert} />} />
                <Route path="/register" element={<Register showAlert={showAlert} />} />
                
                {/* Auction Routes */}
                <Route path="/auctions" element={<AuctionList showAlert={showAlert} />} />
                <Route path="/auctions/:id" element={<AuctionDetail showAlert={showAlert} />} />
                
                {/* Product Routes */}
                <Route path="/products" element={<ProductList showAlert={showAlert} />} />
                <Route path="/products/:id" element={<ProductDetail showAlert={showAlert} />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={
                  <PrivateRoute>
                    <Dashboard showAlert={showAlert} />
                  </PrivateRoute>
                } />
                <Route path="/profile" element={
                  <PrivateRoute>
                    <Profile showAlert={showAlert} />
                  </PrivateRoute>
                } />
                <Route path="/create-product" element={
                  <PrivateRoute>
                    <CreateProduct showAlert={showAlert} />
                  </PrivateRoute>
                } />
                <Route path="/create-auction" element={
                  <PrivateRoute>
                    <CreateAuction showAlert={showAlert} />
                  </PrivateRoute>
                } />
                <Route path="/create-auction/:productId" element={
                  <PrivateRoute>
                    <CreateAuction showAlert={showAlert} />
                  </PrivateRoute>
                } />
                
                {/* 404 Route */}
                <Route path="/not-found" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/not-found" />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
