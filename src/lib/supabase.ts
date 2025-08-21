import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Employee = {
  id: string
  employee_id: string
  name: string
  email: string
  phone?: string
  department: string
  designation: string
  bank_name?: string
  bank_account?: string
  tax_number?: string
  date_joined: string
  profile_photo_url?: string
  basic_salary: number
  user_id?: string
  created_at: string
  updated_at: string
}

export type Payslip = {
  id: string
  employee_id: string
  basic_salary: number
  allowances: Record<string, number>
  deductions: Record<string, number>
  overtime_hours: number
  overtime_rate: number
  bonuses: Record<string, number>
  tax_percentage: number
  gross_pay: number
  total_deductions: number
  net_pay: number
  payment_date: string
  pdf_url?: string
  qr_code?: string
  status: string
  created_by: string
  created_at: string
  employees?: Employee
}

export type CompanySettings = {
  id: string
  company_name: string
  company_address: string
  company_logo_url?: string
  default_tax_rate: number
  currency: string
  payslip_template: Record<string, any>
  updated_by: string
  updated_at: string
}

export type UserRole = 'admin' | 'payroll_officer' | 'employee'

// Helper function to get current user role
export const getCurrentUserRole = async (): Promise<UserRole | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.user_metadata?.role || null
}

// Helper function to check if user has permission
export const hasPermission = (userRole: UserRole | null, requiredRoles: UserRole[]): boolean => {
  return userRole ? requiredRoles.includes(userRole) : false
}