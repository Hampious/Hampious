import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';

import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import Wishlist from './pages/Wishlist';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import ContactUs from './pages/ContactUs';
import ReturnPolicy from './pages/ReturnPolicy';

import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProductsManagement from './pages/admin/ProductsManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import OrdersManagement from './pages/admin/OrdersManagement';
import UsersManagement from './pages/admin/UsersManagement';
import Shipments from './pages/admin/Shipments';

import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Routes>
              {/* Admin routes — own layout, no customer navbar/footer */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard"  element={<Dashboard />} />
                <Route path="products"   element={<ProductsManagement />} />
                <Route path="categories" element={<CategoryManagement />} />
                <Route path="orders"     element={<OrdersManagement />} />
                <Route path="customers"  element={<UsersManagement />} />
                <Route path="shipments"  element={<Shipments />} />
              </Route>

              {/* Customer site — wrapped in Layout (navbar + footer) */}
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetails />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsConditions />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/return-policy" element={<ReturnPolicy />} />

                <Route path="/cart"       element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                <Route path="/wishlist"   element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                <Route path="/checkout"   element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/my-orders"  element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
                <Route path="/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>

            <Toaster position="top-right" />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
