import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { Employee, Payslip, CompanySettings } from '../lib/supabase'

interface PayslipData extends Payslip {
  employees: Employee
}

export const generatePayslipPDF = async (
  payslip: PayslipData,
  company: CompanySettings
): Promise<Blob> => {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.width
  const pageHeight = pdf.internal.pageSize.height

  // Generate QR code
  const qrCodeDataURL = await QRCode.toDataURL(
    `${window.location.origin}/payslip/${payslip.id}`,
    { width: 100, margin: 1 }
  )

  // Header
  pdf.setFillColor(31, 41, 55) // gray-800
  pdf.rect(0, 0, pageWidth, 40, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text(company.company_name, 20, 25)

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text(company.company_address, 20, 32)

  // Add QR Code
  const qrSize = 30
  pdf.addImage(qrCodeDataURL, 'PNG', pageWidth - qrSize - 20, 5, qrSize, qrSize)

  // Payslip Title
  pdf.setTextColor(31, 41, 55)
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('PAYSLIP', 20, 60)

  // Payment Date
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Payment Date: ${new Date(payslip.payment_date).toLocaleDateString()}`, 20, 70)

  // Employee Information
  pdf.setFillColor(249, 250, 251) // gray-50
  pdf.rect(20, 80, pageWidth - 40, 60, 'F')

  pdf.setTextColor(31, 41, 55)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Employee Information', 25, 95)

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')

  const employeeInfo = [
    `Name: ${payslip.employees.name}`,
    `Employee ID: ${payslip.employees.employee_id}`,
    `Department: ${payslip.employees.department}`,
    `Designation: ${payslip.employees.designation}`,
    `Email: ${payslip.employees.email}`,
  ]

  let yPos = 105
  employeeInfo.forEach(info => {
    pdf.text(info, 25, yPos)
    yPos += 8
  })

  // Bank Details (right side)
  if (payslip.employees.bank_name || payslip.employees.bank_account) {
    const bankInfo = []
    if (payslip.employees.bank_name) bankInfo.push(`Bank: ${payslip.employees.bank_name}`)
    if (payslip.employees.bank_account) bankInfo.push(`Account: ${payslip.employees.bank_account}`)
    if (payslip.employees.tax_number) bankInfo.push(`Tax Number: ${payslip.employees.tax_number}`)

    let bankYPos = 105
    bankInfo.forEach(info => {
      pdf.text(info, pageWidth / 2 + 10, bankYPos)
      bankYPos += 8
    })
  }

  // Salary Breakdown Table
  const tableStartY = 160
  pdf.setFillColor(59, 130, 246) // blue-500
  pdf.rect(20, tableStartY, pageWidth - 40, 15, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Salary Breakdown', 25, tableStartY + 10)

  // Table rows
  let currentY = tableStartY + 25
  pdf.setTextColor(31, 41, 55)
  pdf.setFontSize(10)

  const salaryItems = [
    { label: 'Basic Salary', amount: payslip.basic_salary },
    { label: 'Overtime', amount: payslip.overtime_hours * payslip.overtime_rate },
  ]

  // Add allowances
  Object.entries(payslip.allowances).forEach(([key, value]) => {
    salaryItems.push({ label: `${key} Allowance`, amount: value })
  })

  // Add bonuses
  Object.entries(payslip.bonuses).forEach(([key, value]) => {
    salaryItems.push({ label: `${key} Bonus`, amount: value })
  })

  // Gross Pay
  pdf.setFont('helvetica', 'bold')
  pdf.text('Gross Pay', 25, currentY)
  pdf.text(`$${payslip.gross_pay.toLocaleString()}`, pageWidth - 60, currentY)
  currentY += 15

  // Deductions
  pdf.setFont('helvetica', 'normal')
  pdf.text('Deductions:', 25, currentY)
  currentY += 10

  Object.entries(payslip.deductions).forEach(([key, value]) => {
    pdf.text(`  ${key}`, 30, currentY)
    pdf.text(`-$${value.toLocaleString()}`, pageWidth - 60, currentY)
    currentY += 8
  })

  // Tax
  const taxAmount = (payslip.gross_pay * payslip.tax_percentage) / 100
  pdf.text(`  Tax (${payslip.tax_percentage}%)`, 30, currentY)
  pdf.text(`-$${taxAmount.toLocaleString()}`, pageWidth - 60, currentY)
  currentY += 15

  // Net Pay
  pdf.setFillColor(34, 197, 94) // green-500
  pdf.rect(20, currentY - 5, pageWidth - 40, 15, 'F')

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Net Pay', 25, currentY + 5)
  pdf.text(`$${payslip.net_pay.toLocaleString()}`, pageWidth - 80, currentY + 5)

  // Footer
  const footerY = pageHeight - 40
  pdf.setTextColor(107, 114, 128)
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.text('This is a computer-generated payslip. No signature is required.', 20, footerY)
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 20, footerY + 8)
  pdf.text('TechXplo Payslip System - Confidential', 20, footerY + 16)

  return pdf.output('blob')
}