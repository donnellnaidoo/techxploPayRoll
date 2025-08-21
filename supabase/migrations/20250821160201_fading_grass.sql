/*
  # Create settings table

  1. New Tables
    - `company_settings`
      - `id` (uuid, primary key)
      - `company_name` (text)
      - `company_address` (text)
      - `company_logo_url` (text)
      - `default_tax_rate` (numeric)
      - `currency` (text)
      - `payslip_template` (jsonb)
      - `updated_by` (uuid)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `company_settings` table
    - Add policies for admin access only
*/

CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text DEFAULT 'TechXplo Systems',
  company_address text DEFAULT '',
  company_logo_url text,
  default_tax_rate numeric(5,2) DEFAULT 25.00,
  currency text DEFAULT 'USD',
  payslip_template jsonb DEFAULT '{"headerColor": "#1f2937", "accentColor": "#3b82f6"}',
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read and update settings
CREATE POLICY "Only admins can manage settings"
  ON company_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Insert default settings
INSERT INTO company_settings (company_name, company_address, default_tax_rate, currency)
VALUES ('TechXplo Systems', '123 Tech Street, Silicon Valley, CA 94000', 25.00, 'USD');