import React from 'react'
import { motion } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Receipt, 
  Settings, 
  LogOut,
  Building2
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { hasPermission } from '../../lib/supabase'

const Sidebar: React.FC = () => {
  const { userRole, signOut } = useAuth()
  const location = useLocation()

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/dashboard',
      roles: ['admin', 'payroll_officer', 'employee']
    },
    {
      icon: Users,
      label: 'Employees',
      path: '/employees',
      roles: ['admin', 'payroll_officer']
    },
    {
      icon: FileText,
      label: 'Generate Payslip',
      path: '/payslips/generate',
      roles: ['admin', 'payroll_officer']
    },
    {
      icon: Receipt,
      label: 'Payslip Records',
      path: '/payslips',
      roles: ['admin', 'payroll_officer', 'employee']
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
      roles: ['admin']
    }
  ]

  const filteredMenuItems = menuItems.filter(item => 
    hasPermission(userRole, item.roles as any)
  )

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      className="w-70 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col"
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">TechXplo</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Payslip System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={signOut}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </motion.button>
      </div>
    </motion.div>
  )
}

export default Sidebar