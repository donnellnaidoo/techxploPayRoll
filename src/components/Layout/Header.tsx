import React from 'react'
import { motion } from 'framer-motion'
import { Bell, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'

const Header: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const { user, userRole } = useAuth()

  const themeOptions = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' }
  ]

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {userRole?.replace('_', ' ')} Dashboard
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Selector */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {themeOptions.map((option) => {
              const Icon = option.icon
              return (
                <motion.button
                  key={option.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme(option.value as any)}
                  className={`p-2 rounded-md transition-colors ${
                    theme === option.value
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                  title={option.label}
                >
                  <Icon className="w-4 h-4" />
                </motion.button>
              )
            })}
          </div>

          {/* Notifications */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Bell className="w-5 h-5" />
          </motion.button>

          {/* User Avatar */}
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header