import { lazy, Suspense, useCallback } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LoadingState from './components/LoadingState';
import { useApiData } from './hooks/useApiData';
import { getDashboardData } from './services/api';
import { mockDashboardData } from './data/mockData';
import type { DashboardData } from './types/api';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import PublicHome from './pages/PublicHome';
import Features from './pages/Features';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';

// Lazy-load pages for performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const WaterQuality = lazy(() => import('./pages/WaterQuality'));
const AnomalyDetection = lazy(() => import('./pages/AnomalyDetection'));
const RiskPrediction = lazy(() => import('./pages/RiskPrediction'));
const EarlyWarnings = lazy(() => import('./pages/EarlyWarnings'));
const SensorHealth = lazy(() => import('./pages/SensorHealth'));
const HistoricalData = lazy(() => import('./pages/HistoricalData'));
const Settings = lazy(() => import('./pages/Settings'));

function PageLoader() {
  return (
    <div className="p-6">
      <LoadingState type="card" count={3} />
    </div>
  );
}

function PrivateLayout() {
  const fetchFn = useCallback(() => getDashboardData(), []);
  const { loading, lastUpdated, isUsingMock, refetch } = useApiData<DashboardData>({
    fetchFn,
    mockData: mockDashboardData,
    refreshInterval: 0, // Pages manage their own refresh
  });

  const isConnected = !isUsingMock;
  return <MainLayout
    isConnected={isConnected}
    isUsingMock={isUsingMock}
    lastUpdated={lastUpdated}
    onRefresh={refetch}
    loading={loading}
  />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/about" element={<About />} />
      <Route path="/features" element={<Features />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/register" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<ProtectedRoute />}>
      <Route element={<PrivateLayout />}>
        <Route path="/private-dashboard" element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route path="/dashboard" element={<Navigate to="/private-dashboard" replace />} />
        <Route path="/water-quality" element={<Suspense fallback={<PageLoader />}><WaterQuality /></Suspense>} />
        <Route path="/anomaly-detection" element={<Suspense fallback={<PageLoader />}><AnomalyDetection /></Suspense>} />
        <Route path="/risk-prediction" element={<Suspense fallback={<PageLoader />}><RiskPrediction /></Suspense>} />
        <Route path="/early-warnings" element={<Suspense fallback={<PageLoader />}><EarlyWarnings /></Suspense>} />
        <Route path="/sensor-health" element={<Suspense fallback={<PageLoader />}><SensorHealth /></Suspense>} />
        <Route path="/historical-data" element={<Suspense fallback={<PageLoader />}><HistoricalData /></Suspense>} />
        <Route path="/history" element={<Navigate to="/historical-data" replace />} />
        <Route path="/settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
      </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
