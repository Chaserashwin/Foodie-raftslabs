import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { AdminOrdersPage } from './pages/AdminOrdersPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmed/:orderId" element={<OrderConfirmationPage />} />
            <Route path="/track" element={<OrderTrackingPage />} />
            <Route path="/track/:orderId" element={<OrderTrackingPage />} />
            <Route path="/admin" element={<AdminOrdersPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <CartDrawer />
        <Footer />
      </div>
    </CartProvider>
  );
};

export default App;
