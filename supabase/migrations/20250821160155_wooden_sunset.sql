/*
  # Create payslips table

  1. New Tables
    - `payslips`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, foreign key)
      - `basic_salary` (numeric)
      - `allowances` (jsonb)
      - `deductions` (jsonb)
      - `overtime_hours` (numeric)
      - `overtime_rate` (numeric)
      - `bonuses` (jsonb)
      - `tax_percentage` (numeric)
      - `gross_pay` (numeric)
      - `total_deductions` (numeric)
      - `net_pay` (numeric)
      - `payment_date` (date)
      - `pdf_url` (text)
      - `qr_code` (text)
      - `status` (text)
      - `created_by` (uuid)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `payslips` table
    - Add policies for role-based access
*/

CREATE TABLE IF NOT EXISTS payslips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  basic_salary numeric(12,2) NOT NULL,
  allowances jsonb DEFAULT '{}',
  deductions jsonb DEFAULT '{}',
  overtime_hours numeric(8,2) DEFAULT 0,
  overtime_rate numeric(8,2) DEFAULT 0,
  bonuses jsonb DEFAULT '{}',
  tax_percentage numeric(5,2) DEFAULT 0,
  gross_pay numeric(12,2) NOT NULL,
  total_deductions numeric(12,2) NOT NULL,
  net_pay numeric(12,2) NOT NULL,
  payment_date date NOT NULL,
  pdf_url text,
  qr_code text,
  status text DEFAULT 'generated',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

-- Allow admins and payroll officers to read all payslips
CREATE POLICY "Admins and payroll officers can read payslips"
  ON payslips
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin' OR
        auth.users.raw_user_meta_data->>'role' = 'payroll_officer'
      )
    )
  );

-- Allow employees to read their own payslips
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

-- Allow admins and payroll officers to manage payslips
CREATE POLICY "Admins and payroll officers can manage payslips"
  ON payslips
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data->>'role' = 'admin' OR
        auth.users.raw_user_meta_data->>'role' = 'payroll_officer'
      )
    )
  );