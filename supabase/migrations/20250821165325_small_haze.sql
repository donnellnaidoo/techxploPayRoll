/*
  # Fix Row Level Security Policies

  1. Security Updates
    - Fix RLS policies for employees table
    - Fix RLS policies for payslips table
    - Ensure proper role-based access control
    - Fix permission denied errors

  2. Changes
    - Update employees table policies to use profiles table for role checking
    - Update payslips table policies to use profiles table for role checking
    - Ensure authenticated users can access data based on their roles
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins and payroll officers can manage employees" ON employees;
DROP POLICY IF EXISTS "Admins and payroll officers can read employees" ON employees;
DROP POLICY IF EXISTS "Employees can read own data" ON employees;
DROP POLICY IF EXISTS "Admins and payroll officers can manage payslips" ON payslips;
DROP POLICY IF EXISTS "Admins and payroll officers can read payslips" ON payslips;
DROP POLICY IF EXISTS "Employees can read own payslips" ON payslips;

-- Employees table policies
CREATE POLICY "Admins and payroll officers can manage employees"
  ON employees
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'payroll_officer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'payroll_officer')
    )
  );

CREATE POLICY "Employees can read own data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Payslips table policies
CREATE POLICY "Admins and payroll officers can manage payslips"
  ON payslips
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'payroll_officer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'payroll_officer')
    )
  );

CREATE POLICY "Employees can read own payslips"
  ON payslips
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = payslips.employee_id
      AND employees.user_id = auth.uid()
    )
  );

-- Company settings policies
CREATE POLICY "Authenticated users can read company settings"
  ON company_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage company settings"
  ON company_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );