import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import AuditPage from './pages/AuditPage';
import IntegrityPage from './pages/IntegrityPage';
import NetworkPage from './pages/NetworkPage';
import PasswordPage from './pages/PasswordPage';
import LogsPage from './pages/LogsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/integrity" element={<IntegrityPage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/password" element={<PasswordPage />} />
        <Route path="/logs" element={<LogsPage />} />
      </Route>
    </Routes>
  );
}
