import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Announcements from './pages/Announcements'
import NoticeBoard from './pages/NoticeBoard'
import MaintenanceRequests from './pages/MaintenanceRequests'
import Complaints from './pages/Complaints'
import Suggestions from './pages/Suggestions'
import Units from './pages/Units'
import UnitDetails from './pages/UnitDetails'
import Settings from './pages/Settings'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/notice-board" element={<NoticeBoard />} />
              <Route path="/maintenance/request" element={<MaintenanceRequests />} />
              <Route path="/complaints" element={<Complaints />} />
              <Route path="/suggestions" element={<Suggestions />} />
              <Route
                path="/units"
                element={
                  <ProtectedRoute allowedRoles={['caretaker', 'chairperson', 'landlady']}>
                    <Units />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/units/:id"
                element={
                  <ProtectedRoute allowedRoles={['caretaker', 'chairperson', 'landlady']}>
                    <UnitDetails />
                  </ProtectedRoute>
                }
              />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
