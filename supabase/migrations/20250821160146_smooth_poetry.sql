/*
  # Create employees table

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `employee_id` (text, unique)
      - `name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `department` (text)
      - `designation` (text)
      - `bank_name` (text)
      - `bank_account` (text)
      - `tax_number` (text)
      - `date_joined` (date)
      - `profile_photo_url` (text)
      - `basic_salary` (numeric)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `employees` table
    - Add policies for role-based access
*/

CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text UNIQUE NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  department text NOT NULL,
  designation text NOT NULL,
  bank_name text,
  bank_account text,
  tax_number text,
  date_joined date NOT NULL DEFAULT CURRENT_DATE,
  profile_photo_url text,
  basic_salary numeric(12,2) DEFAULT 0,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Allow admins and payroll officers to read all employees
CREATE POLICY "Admins and payroll officers can read employees"
  ON employees
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

-- Allow employees to read their own data
CREATE POLICY "Employees can read own data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow admins and payroll officers to insert/update employees
CREATE POLICY "Admins and payroll officers can manage employees"
  ON employees
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