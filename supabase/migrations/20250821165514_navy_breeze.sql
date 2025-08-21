/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - Current policies create circular references between tables
    - Policies on profiles table reference other tables that reference profiles back
    - This causes infinite recursion when querying data

  2. Solution
    - Simplify policies to avoid circular references
    - Use direct auth.uid() checks where possible
    - Remove complex subqueries that cause recursion
    - Use user_metadata for role checking instead of profiles table joins

  3. Changes
    - Drop all existing problematic policies
    - Create simplified policies that avoid recursion
    - Use auth.jwt() for role-based access control
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Employees can read own data" ON employees;
DROP POLICY IF EXISTS "Admins and payroll officers can manage employees" ON employees;
DROP POLICY IF EXISTS "Employees can read own payslips" ON payslips;
DROP POLICY IF EXISTS "Admins and payroll officers can manage payslips" ON payslips;
DROP POLICY IF EXISTS "Authenticated users can read company settings" ON company_settings;
DROP POLICY IF EXISTS "Only admins can manage company settings" ON company_settings;
DROP POLICY IF EXISTS "Only admins can manage settings" ON company_settings;

-- Profiles policies (simplified to avoid recursion)
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin');

-- Employees policies (using direct user_id check)
CREATE POLICY "Employees can read own data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins and payroll officers can manage employees"
  ON employees
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'payroll_officer')
  );

-- Payslips policies (using direct relationship)
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

CREATE POLICY "Admins and payroll officers can manage payslips"
  ON payslips
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' IN ('admin', 'payroll_officer')
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
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );

-- Audit logs policies
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Only admins can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
  );