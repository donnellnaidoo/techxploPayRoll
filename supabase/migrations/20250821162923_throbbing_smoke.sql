/*
  # Create initial admin user and setup

  1. Initial Setup
    - Creates a function to handle new user registration
    - Sets up trigger to automatically create employee records
    - Creates initial company settings if none exist
  
  2. Security
    - Ensures proper role assignment
    - Creates employee records for new users
*/

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create employee record for new user
  INSERT INTO employees (
    employee_id,
    name,
    email,
    department,
    designation,
    basic_salary,
    user_id,
    date_joined
  ) VALUES (
    'EMP' || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 10, '0'),
    COALESCE(NEW.raw_user_meta_data->>'name', 'New Employee'),
    NEW.email,
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'Administration'
      WHEN NEW.raw_user_meta_data->>'role' = 'payroll_officer' THEN 'Human Resources'
      ELSE 'General'
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'Administrator'
      WHEN NEW.raw_user_meta_data->>'role' = 'payroll_officer' THEN 'Payroll Officer'
      ELSE 'Employee'
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 80000
      WHEN NEW.raw_user_meta_data->>'role' = 'payroll_officer' THEN 60000
      ELSE 45000
    END,
    NEW.id,
    CURRENT_DATE
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure company settings exist
INSERT INTO company_settings (
  company_name, 
  company_address, 
  default_tax_rate, 
  currency
) 
SELECT 
  'TechXplo Systems', 
  '123 Tech Street, Silicon Valley, CA 94000', 
  25.00, 
  'USD'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);