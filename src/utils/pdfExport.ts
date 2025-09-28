import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Employee } from '../types'

interface ScheduleData {
  [employeeId: string]: {
    [dayKey: string]: {
      startTime: string
      endTime: string
    }
  }
}

interface ExportScheduleOptions {
  employees: Employee[]
  scheduleData: ScheduleData
  weekDays: Date[]
  weekRange: string
  businessName?: string
  logoUrl?: string
  isRtl?: boolean
  operatingDays?: number[]
}

export const exportScheduleToPDF = async (options: ExportScheduleOptions) => {
  const { employees, scheduleData, weekDays, weekRange, businessName = 'Food Truck Manager', logoUrl, isRtl = false, operatingDays = [0, 1, 2, 3, 4, 5, 6] } = options
  
  // weekDays already filtered by operating days from getWeekDaysForDisplay
  const displayWeekDays = weekDays

  const pdf = new jsPDF('l', 'mm', 'a4') // Landscape orientation
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  
  // Colors and styling
  const primaryColor = '#1976d2'
  const secondaryColor = '#f5f5f5'
  const textColor = '#333333'
  const borderColor = '#e0e0e0'
  
  // Header
  pdf.setFillColor(primaryColor)
  pdf.rect(0, 0, pageWidth, 25, 'F')
  
  // Business name
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(18)
  pdf.setFont(undefined, 'bold')
  pdf.text(businessName, 20, 16)
  
  // Week range
  pdf.setFontSize(12)
  pdf.setFont(undefined, 'normal')
  pdf.text(`Weekly Schedule - ${weekRange}`, pageWidth - 20, 16, { align: 'right' })
  
  // Generated date
  pdf.setFontSize(8)
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth - 20, 20, { align: 'right' })
  
  // Table setup
  const startY = 35
  const tableWidth = pageWidth - 40
  const employeeColWidth = 60
  const numOperatingDays = displayWeekDays.length
  const dayColWidth = (tableWidth - employeeColWidth) / numOperatingDays
  const rowHeight = 25
  
  // Day headers
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayNamesHebrew = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
  const currentDayNames = isRtl ? dayNamesHebrew : dayNames
  
  // Table header background
  pdf.setFillColor(secondaryColor)
  pdf.rect(20, startY, tableWidth, rowHeight, 'F')
  
  // Table header border
  pdf.setDrawColor(borderColor)
  pdf.setLineWidth(0.5)
  pdf.rect(20, startY, tableWidth, rowHeight)
  
  // Employee header
  pdf.setTextColor(textColor)
  pdf.setFontSize(12)
  pdf.setFont(undefined, 'bold')
  const employeeHeaderText = isRtl ? 'עובד' : 'Employee'
  const employeeHeaderX = isRtl ? 20 + employeeColWidth - 5 : 25
  pdf.text(employeeHeaderText, employeeHeaderX, startY + 16, { align: isRtl ? 'right' : 'left' })
  
  // Day headers
  displayWeekDays.forEach((day, index) => {
    const x = 20 + employeeColWidth + (index * dayColWidth)
    const dayName = currentDayNames[day.getDay()]
    const dayDate = `${day.getMonth() + 1}/${day.getDate()}`
    
    // Vertical divider
    pdf.line(x, startY, x, startY + rowHeight)
    
    // Day name
    pdf.setFontSize(11)
    pdf.text(dayName, x + dayColWidth/2, startY + 10, { align: 'center' })
    
    // Date
    pdf.setFontSize(9)
    pdf.setFont(undefined, 'normal')
    pdf.text(dayDate, x + dayColWidth/2, startY + 18, { align: 'center' })
  })
  
  // Helper function to get display name for employees
  const getDisplayName = (employee: Employee, allEmployees: Employee[]) => {
    const activeEmployees = allEmployees.filter(emp => emp.isActive && !emp.id.startsWith('temp-'))
    const sameFirstName = activeEmployees.filter(emp => 
      emp.firstName.toLowerCase() === employee.firstName.toLowerCase() && emp.id !== employee.id
    )
    
    if (sameFirstName.length > 0) {
      return `${employee.firstName} ${employee.lastName.charAt(0).toUpperCase()}.`
    }
    
    return employee.firstName
  }

  // Employee rows
  let currentY = startY + rowHeight
  const activeEmployees = employees.filter(emp => emp.isActive && !emp.id.startsWith('temp-'))
  
  activeEmployees.forEach((employee, empIndex) => {
    const employeeSchedule = scheduleData[employee.id] || {}
    
    // Alternate row background
    if (empIndex % 2 === 1) {
      pdf.setFillColor(250, 250, 250)
      pdf.rect(20, currentY, tableWidth, rowHeight, 'F')
    }
    
    // Row border
    pdf.setDrawColor(borderColor)
    pdf.rect(20, currentY, tableWidth, rowHeight)
    
    // Employee name
    pdf.setTextColor(textColor)
    pdf.setFontSize(11)
    pdf.setFont(undefined, 'bold')
    const employeeName = getDisplayName(employee, employees)
    const employeeNameX = isRtl ? 20 + employeeColWidth - 5 : 25
    pdf.text(employeeName, employeeNameX, currentY + 12, { align: isRtl ? 'right' : 'left' })
    
    // Position
    pdf.setFontSize(9)
    pdf.setFont(undefined, 'normal')
    pdf.setTextColor(100, 100, 100)
    const positionX = isRtl ? 20 + employeeColWidth - 5 : 25
    pdf.text(employee.position, positionX, currentY + 19, { align: isRtl ? 'right' : 'left' })
    
    // Schedule for each day
    displayWeekDays.forEach((day, dayIndex) => {
      const x = 20 + employeeColWidth + (dayIndex * dayColWidth)
      const dayKey = day.toISOString().split('T')[0]
      const daySchedule = employeeSchedule[dayKey]
      
      // Vertical divider
      pdf.setDrawColor(borderColor)
      pdf.line(x, currentY, x, currentY + rowHeight)
      
      if (daySchedule && daySchedule.startTime && daySchedule.endTime) {
        // Time slot background
        pdf.setFillColor(240, 248, 255)
        pdf.rect(x + 2, currentY + 4, dayColWidth - 4, 17, 'F')
        
        // Time text
        pdf.setTextColor(primaryColor)
        pdf.setFontSize(9)
        pdf.setFont(undefined, 'bold')
        pdf.text(daySchedule.startTime, x + dayColWidth/2, currentY + 11, { align: 'center' })
        pdf.text('-', x + dayColWidth/2, currentY + 15, { align: 'center' })
        pdf.text(daySchedule.endTime, x + dayColWidth/2, currentY + 19, { align: 'center' })
      } else {
        // Off day
        pdf.setTextColor(180, 180, 180)
        pdf.setFontSize(10)
        pdf.setFont(undefined, 'normal')
        pdf.text('OFF', x + dayColWidth/2, currentY + 15, { align: 'center' })
      }
    })
    
    currentY += rowHeight
    
    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - 20) {
      pdf.addPage()
      currentY = 20
    }
  })
  
  // Footer
  const footerY = pageHeight - 15
  pdf.setDrawColor(borderColor)
  pdf.line(20, footerY - 5, pageWidth - 20, footerY - 5)
  
  pdf.setTextColor(100, 100, 100)
  pdf.setFontSize(8)
  pdf.text('Food Truck Manager - Schedule Report', 20, footerY)
  pdf.text(`Page 1 of 1`, pageWidth - 20, footerY, { align: 'right' })
  
  // Summary statistics
  const totalEmployees = activeEmployees.length
  const scheduledEmployees = activeEmployees.filter(emp => 
    Object.values(scheduleData[emp.id] || {}).some(schedule => schedule.startTime && schedule.endTime)
  ).length
  
  pdf.setFontSize(9)
  pdf.setTextColor(textColor)
  pdf.text(`Total Employees: ${totalEmployees} | Scheduled: ${scheduledEmployees}`, pageWidth/2, footerY, { align: 'center' })
  
  // Save the PDF
  const fileName = `weekly-schedule-${weekRange.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
  pdf.save(fileName)
}

export const exportScheduleToImage = async (elementId: string, fileName: string) => {
  const element = document.getElementById(elementId)
  if (!element) {
    throw new Error('Schedule element not found')
  }
  
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  })
  
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF('l', 'mm', 'a4')
  
  const imgWidth = 277 // A4 landscape width minus margins
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  
  pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight)
  pdf.save(fileName)
}