import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, Eye, Filter, Search } from 'lucide-react'
import { supabase, Payslip, hasPermission } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const PayslipRecords: React.FC = () => {
  const { userRole } = useAuth()
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [filteredPayslips, setFilteredPayslips] = useState<Payslip[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayslips()
  }, [])

  useEffect(() => {
    const filtered = payslips.filter(payslip =>
      payslip.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payslip.employees?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payslip.employees?.department?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredPayslips(filtered)
  }, [payslips, searchTerm])

  const fetchPayslips = async () => {
    try {
      let query = supabase
        .from('payslips')
        .select(`
          *,
          employees (
            name,
            employee_id,
            department,
            email
          )
        `)
        .order('created_at', { ascending: false })

      // If employee role, only show their own payslips
      if (userRole === 'employee') {
        const { data: { user } } = await supabase.auth.getUser()
        query = query.eq('employees.user_id', user?.id)
      }

      const { data, error } = await query

      if (error) throw error
      setPayslips(data || [])
    } catch (error) {
      console.error('Error fetching payslips:', error)
      toast.error('Failed to fetch payslips')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Payslip Records</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {hasPermission(userRole, ['admin', 'payroll_officer']) 
              ? 'Manage all payslip records' 
              : 'View your payslip history'
            }
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search payslips..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </motion.button>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredPayslips.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No payslips found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {hasPermission(userRole, ['admin', 'payroll_officer'])
                ? 'Start by generating payslips for your employees'
                : 'Your payslips will appear here once generated'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Gross Pay
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPayslips.map((payslip) => (
                  <motion.tr
                    key={payslip.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {payslip.employees?.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          #{payslip.employees?.employee_id} • {payslip.employees?.department}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(payslip.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${payslip.gross_pay.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        ${payslip.net_pay.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        payslip.status === 'generated' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {payslip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default PayslipRecords