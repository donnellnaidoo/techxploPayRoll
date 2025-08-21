import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, FileText, TrendingUp } from 'lucide-react'
import StatsCard from '../components/Dashboard/StatsCard'
import PayrollChart from '../components/Dashboard/PayrollChart'
import { supabase } from '../lib/supabase'
import { useTheme } from '../contexts/ThemeContext'

const Dashboard: React.FC = () => {
  const { isDark } = useTheme()
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPayroll: 0,
    payslipsGenerated: 0,
    averageSalary: 0
  })

  const [chartData, setChartData] = useState([
    { month: 'Jan', amount: 45000 },
    { month: 'Feb', amount: 48000 },
    { month: 'Mar', amount: 52000 },
    { month: 'Apr', amount: 49000 },
    { month: 'May', amount: 55000 },
    { month: 'Jun', amount: 58000 }
  ])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Get total employees
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })

      // Get total payslips
      const { count: payslipCount } = await supabase
        .from('payslips')
        .select('*', { count: 'exact', head: true })

      // Get payroll data
      const { data: payrollData } = await supabase
        .from('payslips')
        .select('net_pay')

      const totalPayroll = payrollData?.reduce((sum, p) => sum + p.net_pay, 0) || 0
      const averageSalary = payrollData?.length ? totalPayroll / payrollData.length : 0

      setStats({
        totalEmployees: employeeCount || 0,
        totalPayroll,
        payslipsGenerated: payslipCount || 0,
        averageSalary
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Employees"
          value={stats.totalEmployees}
          change="+12% from last month"
          changeType="positive"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Total Payroll"
          value={`$${stats.totalPayroll.toLocaleString()}`}
          change="+8% from last month"
          changeType="positive"
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Payslips Generated"
          value={stats.payslipsGenerated}
          change="+15% from last month"
          changeType="positive"
          icon={FileText}
          color="purple"
        />
        <StatsCard
          title="Average Salary"
          value={`$${stats.averageSalary.toLocaleString()}`}
          change="+5% from last month"
          changeType="positive"
          icon={TrendingUp}
          color="orange"
        />
      </motion.div>

      {/* Charts */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PayrollChart data={chartData} isDark={isDark} />
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">Payslip generated for John Doe</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">New employee added</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">Settings updated</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">6 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Dashboard