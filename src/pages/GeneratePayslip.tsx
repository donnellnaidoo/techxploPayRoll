import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calculator, Download, Send } from 'lucide-react'
import { supabase, Employee, CompanySettings } from '../lib/supabase'
import { generatePayslipPDF } from '../utils/pdfGenerator'
import toast from 'react-hot-toast'

const GeneratePayslip: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(false)

  const [payslipData, setPayslipData] = useState({
    basic_salary: '',
    allowances: {
      housing: '',
      transport: '',
      medical: ''
    },
    deductions: {
      insurance: '',
      loan: ''
    },
    overtime_hours: '',
    overtime_rate: '',
    bonuses: {
      performance: ''
    },
    tax_percentage: '',
    payment_date: new Date().toISOString().split('T')[0]
  })

  const [calculatedAmounts, setCalculatedAmounts] = useState({
    gross_pay: 0,
    total_deductions: 0,
    net_pay: 0
  })

  useEffect(() => {
    fetchEmployees()
    fetchCompanySettings()
  }, [])

  useEffect(() => {
    if (selectedEmployee) {
      setPayslipData(prev => ({
        ...prev,
        basic_salary: selectedEmployee.basic_salary.toString(),
        tax_percentage: companySettings?.default_tax_rate.toString() || '25'
      }))
    }
  }, [selectedEmployee, companySettings])

  useEffect(() => {
    calculateAmounts()
  }, [payslipData])

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name')

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error('Failed to fetch employees')
    }
  }

  const fetchCompanySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single()

      if (error) throw error
      setCompanySettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const calculateAmounts = () => {
    const basicSalary = parseFloat(payslipData.basic_salary) || 0
    const overtimeAmount = (parseFloat(payslipData.overtime_hours) || 0) * (parseFloat(payslipData.overtime_rate) || 0)
    
    const totalAllowances = Object.values(payslipData.allowances).reduce(
      (sum, allowance) => sum + (parseFloat(allowance) || 0), 0
    )
    
    const totalBonuses = Object.values(payslipData.bonuses).reduce(
      (sum, bonus) => sum + (parseFloat(bonus) || 0), 0
    )

    const grossPay = basicSalary + overtimeAmount + totalAllowances + totalBonuses

    const totalDeductions = Object.values(payslipData.deductions).reduce(
      (sum, deduction) => sum + (parseFloat(deduction) || 0), 0
    )

    const taxAmount = (grossPay * (parseFloat(payslipData.tax_percentage) || 0)) / 100
    const totalDeductionsWithTax = totalDeductions + taxAmount

    const netPay = grossPay - totalDeductionsWithTax

    setCalculatedAmounts({
      gross_pay: grossPay,
      total_deductions: totalDeductionsWithTax,
      net_pay: netPay
    })
  }

  const handleGeneratePayslip = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee')
      return
    }

    if (!companySettings) {
      toast.error('Company settings not found')
      return
    }

    setLoading(true)

    try {
      // Create payslip record
      const payslipRecord = {
        employee_id: selectedEmployee.id,
        basic_salary: parseFloat(payslipData.basic_salary),
        allowances: Object.fromEntries(
          Object.entries(payslipData.allowances).filter(([_, v]) => v !== '').map(([k, v]) => [k, parseFloat(v)])
        ),
        deductions: Object.fromEntries(
          Object.entries(payslipData.deductions).filter(([_, v]) => v !== '').map(([k, v]) => [k, parseFloat(v)])
        ),
        overtime_hours: parseFloat(payslipData.overtime_hours) || 0,
        overtime_rate: parseFloat(payslipData.overtime_rate) || 0,
        bonuses: Object.fromEntries(
          Object.entries(payslipData.bonuses).filter(([_, v]) => v !== '').map(([k, v]) => [k, parseFloat(v)])
        ),
        tax_percentage: parseFloat(payslipData.tax_percentage) || 0,
        gross_pay: calculatedAmounts.gross_pay,
        total_deductions: calculatedAmounts.total_deductions,
        net_pay: calculatedAmounts.net_pay,
        payment_date: payslipData.payment_date,
        qr_code: `${window.location.origin}/payslip/view/`
      }

      const { data: payslip, error } = await supabase
        .from('payslips')
        .insert([payslipRecord])
        .select(`
          *,
          employees (*)
        `)
        .single()

      if (error) throw error

      // Generate PDF
      const pdfBlob = await generatePayslipPDF(payslip as any, companySettings)
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `payslip-${selectedEmployee.employee_id}-${payslipData.payment_date}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success('Payslip generated successfully!')
      
      // Reset form
      setSelectedEmployee(null)
      setPayslipData({
        basic_salary: '',
        allowances: { housing: '', transport: '', medical: '' },
        deductions: { insurance: '', loan: '' },
        overtime_hours: '',
        overtime_rate: '',
        bonuses: { performance: '' },
        tax_percentage: '',
        payment_date: new Date().toISOString().split('T')[0]
      })

    } catch (error: any) {
      toast.error(error.message || 'Failed to generate payslip')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Generate Payslip</h2>
          <p className="text-gray-600 dark:text-gray-400">Create professional payslips</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employee Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Employee</h3>
            <select
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                const employee = employees.find(emp => emp.id === e.target.value)
                setSelectedEmployee(employee || null)
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Choose an employee</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name} - {employee.employee_id}
                </option>
              ))}
            </select>
          </div>

          {selectedEmployee && (
            <>
              {/* Basic Information */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Salary Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Basic Salary
                    </label>
                    <input
                      type="number"
                      value={payslipData.basic_salary}
                      onChange={(e) => setPayslipData({ ...payslipData, basic_salary: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={payslipData.payment_date}
                      onChange={(e) => setPayslipData({ ...payslipData, payment_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Allowances */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Allowances</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(payslipData.allowances).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                        {key} Allowance
                      </label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setPayslipData({
                          ...payslipData,
                          allowances: { ...payslipData.allowances, [key]: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Overtime & Bonuses */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overtime & Bonuses</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Overtime Hours
                    </label>
                    <input
                      type="number"
                      value={payslipData.overtime_hours}
                      onChange={(e) => setPayslipData({ ...payslipData, overtime_hours: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Overtime Rate
                    </label>
                    <input
                      type="number"
                      value={payslipData.overtime_rate}
                      onChange={(e) => setPayslipData({ ...payslipData, overtime_rate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Performance Bonus
                    </label>
                    <input
                      type="number"
                      value={payslipData.bonuses.performance}
                      onChange={(e) => setPayslipData({
                        ...payslipData,
                        bonuses: { ...payslipData.bonuses, performance: e.target.value }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deductions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(payslipData.deductions).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                        {key}
                      </label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setPayslipData({
                          ...payslipData,
                          deductions: { ...payslipData.deductions, [key]: e.target.value }
                        })}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tax Percentage
                    </label>
                    <input
                      type="number"
                      value={payslipData.tax_percentage}
                      onChange={(e) => setPayslipData({ ...payslipData, tax_percentage: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Summary */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Payslip Summary</h3>
            
            {selectedEmployee ? (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Gross Pay</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      ${calculatedAmounts.gross_pay.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Total Deductions</span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      -${calculatedAmounts.total_deductions.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-700">
                    <span className="font-bold text-gray-900 dark:text-white">Net Pay</span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${calculatedAmounts.net_pay.toLocaleString()}
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGeneratePayslip}
                  disabled={loading}
                  className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Generate Payslip</span>
                    </>
                  )}
                </motion.button>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Select an employee to see payslip summary
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeneratePayslip