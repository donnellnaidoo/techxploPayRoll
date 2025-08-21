import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useAuth } from './contexts/AuthContext'
import AuthForm from './components/Auth/AuthForm'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import GeneratePayslip from './pages/GeneratePayslip'
import PayslipRecords from './pages/PayslipRecords'
import Settings from './pages/Settings'
import { hasPermission } from './lib/supabase'

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode
  requiredRoles?: string[]
}> = ({ children, requiredRoles = [] }) => {
  const { user, userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (requiredRoles.length > 0 && !hasPermission(userRole, requiredRoles as any)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/employees" element={
          <ProtectedRoute requiredRoles={['admin', 'payroll_officer']}>
            <Employees />
          </ProtectedRoute>
        } />
        
        <Route path="/payslips/generate" element={
          <ProtectedRoute requiredRoles={['admin', 'payroll_officer']}>
            <GeneratePayslip />
          </ProtectedRoute>
        } />
        
        <Route path="/payslips" element={
          <ProtectedRoute>
            <PayslipRecords />
          </ProtectedRoute>
        } />
        
        <Route path="/settings" element={
          <ProtectedRoute requiredRoles={['admin']}>
            <Settings />
          </ProtectedRoute>
        } />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                borderRadius: '12px',
              }
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App