import React, { useState, useEffect } from 'react'
import { Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Avatar, Tab, Tabs, IconButton, Grid, Snackbar, Alert, useTheme, FormGroup, FormControlLabel, Checkbox } from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Schedule as ScheduleIcon, Person as PersonIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Today as TodayIcon, Download as PdfIcon, FileDownload as DownloadIcon, Settings as SettingsIcon } from '@mui/icons-material'
import { Employee, Shift } from '../types'
import { employeesService, shiftsService, subscriptions } from '../services/supabaseService'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../utils/currency'
import { exportScheduleToPDF, exportScheduleToImage } from '../utils/pdfExport'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function Employees() {
  const theme = useTheme()
  const isRtl = theme.direction === 'rtl'
  const { t, i18n } = useTranslation()
  const [tabValue, setTabValue] = useState(() => {
    const savedTab = localStorage.getItem('employeesTabValue')
    return savedTab ? parseInt(savedTab, 10) : 0
  })
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false)
  const [openShiftDialog, setOpenShiftDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [selectedWeek, setSelectedWeek] = useState(new Date()) // Week to display in payroll
  const [scheduleWeek, setScheduleWeek] = useState(new Date()) // Week to display in schedule
  const [weeklySchedule, setWeeklySchedule] = useState<{
    [employeeId: string]: {
      [dayKey: string]: {
        startTime: string
        endTime: string
      }
    }
  }>({}) // Weekly schedule state

  // Operating days configuration (0=Sunday, 1=Monday, ..., 6=Saturday)
  const [operatingDays, setOperatingDays] = useState<number[]>(() => {
    const saved = localStorage.getItem('operatingDays')
    return saved ? JSON.parse(saved) : [4, 5, 6] // Thursday, Friday, Saturday by default
  })
  const [openDaysDialog, setOpenDaysDialog] = useState(false)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])

  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    hourlyRate: 0,
    hireDate: new Date(),
    isActive: true
  })

  const [newShift, setNewShift] = useState<Partial<Shift>>({
    employeeId: '',
    date: new Date(),
    startTime: '',
    endTime: '',
    hoursWorked: 0,
    role: '',
    location: 'Main Location' // Default location since business operates from one place
  })

  // Load data on component mount
  useEffect(() => {
    loadAllData()
  }, [])

  // Load schedule when schedule week changes
  useEffect(() => {
    loadScheduleForWeek(scheduleWeek)
  }, [scheduleWeek])

  // Load schedule when shifts are initially loaded
  useEffect(() => {
    if (shifts.length > 0) {
      loadScheduleForWeek(scheduleWeek)
    }
  }, [shifts.length])

  // Set up real-time subscriptions
  useEffect(() => {
    const employeesSubscription = subscriptions.employees(() => {
      loadEmployees()
    })

    const shiftsSubscription = subscriptions.shifts(() => {
      loadShifts()
    })

    return () => {
      employeesSubscription.unsubscribe()
      shiftsSubscription.unsubscribe()
    }
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadEmployees(), loadShifts()])
    } catch (error) {
      setSnackbar({ open: true, message: t('failed_to_load_employee_data'), severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const data = await employeesService.getAll()
      setEmployees(data)
    } catch (error) {
      console.error('Failed to load employees:', error)
    }
  }

  const loadShifts = async () => {
    try {
      const data = await shiftsService.getAll()
      setShifts(data)
    } catch (error) {
      console.error('Failed to load shifts:', error)
    }
  }

  const loadScheduleForWeek = async (weekDate: Date) => {
    try {
      const data = await shiftsService.getAll()
      const weekStart = new Date(weekDate)
      weekStart.setDate(weekDate.getDate() - weekDate.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      // Filter shifts for the current week
      const weekShifts = data.filter(shift => {
        const shiftDate = new Date(shift.date)
        return shiftDate >= weekStart && shiftDate <= weekEnd
      })

      // Convert shifts to schedule format
      const newSchedule: typeof weeklySchedule = {}
      weekShifts.forEach(shift => {
        const dayKey = formatDayKey(new Date(shift.date))
        if (!newSchedule[shift.employeeId]) {
          newSchedule[shift.employeeId] = {}
        }
        newSchedule[shift.employeeId][dayKey] = {
          startTime: shift.startTime,
          endTime: shift.endTime
        }
      })

      setWeeklySchedule(newSchedule)
    } catch (error) {
      console.error('Failed to load schedule for week:', error)
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    localStorage.setItem('employeesTabValue', newValue.toString())
  }

  const handleSaveEmployee = async () => {
    try {
      if (editingEmployee) {
        await employeesService.update(editingEmployee.id, newEmployee)
        setSnackbar({ open: true, message: t('employee_updated_success'), severity: 'success' })
      } else {
        await employeesService.create(newEmployee as Omit<Employee, 'id'>)
        setSnackbar({ open: true, message: t('employee_added_success'), severity: 'success' })
      }

      setNewEmployee({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        hourlyRate: 0,
        hireDate: new Date(),
        isActive: true
      })
      setEditingEmployee(null)
      setOpenEmployeeDialog(false)

      // Reload employees to get the latest data
      await loadEmployees()
    } catch (error) {
      setSnackbar({ open: true, message: t('failed_to_save_employee'), severity: 'error' })
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setNewEmployee(employee)
    setEditingEmployee(employee)
    setOpenEmployeeDialog(true)
  }

  const handleDeleteEmployee = async (id: string) => {
    try {
      await employeesService.delete(id)
      setSnackbar({ open: true, message: t('employee_deleted_success'), severity: 'success' })
      await loadEmployees()
    } catch (error) {
      setSnackbar({ open: true, message: t('failed_to_delete_employee'), severity: 'error' })
    }
  }

  const handleSaveShift = async () => {
    try {
      if (editingShift) {
        await shiftsService.update(editingShift.id, newShift)
        setSnackbar({ open: true, message: t('shift_updated_success'), severity: 'success' })
      } else {
        await shiftsService.create(newShift as Omit<Shift, 'id'>)
        setSnackbar({ open: true, message: t('shift_scheduled_success'), severity: 'success' })
      }

      setNewShift({
        employeeId: '',
        date: new Date(),
        startTime: '',
        endTime: '',
        hoursWorked: 0,
        role: '',
        location: 'Main Location'
      })
      setEditingShift(null)
      setOpenShiftDialog(false)

      // Reload shifts to get the latest data
      await loadShifts()
    } catch (error) {
      setSnackbar({ open: true, message: editingShift ? t('failed_to_update_shift') : t('failed_to_schedule_shift'), severity: 'error' })
    }
  }

  const handleEditShift = (shift: Shift) => {
    setNewShift({
      employeeId: shift.employeeId,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      hoursWorked: shift.hoursWorked,
      role: shift.role,
      location: shift.location
    })
    setEditingShift(shift)
    setOpenShiftDialog(true)
  }

  const handleDeleteShift = async (id: string) => {
    try {
      await shiftsService.delete(id)
      setSnackbar({ open: true, message: 'Shift deleted successfully', severity: 'success' })
      await loadShifts()
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete shift', severity: 'error' })
    }
  }

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId)
    return employee ? `${employee.firstName} ${employee.lastName}` : t('unknown')
  }

  // Helper function to calculate hours between two times
  const calculateHoursWorked = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0

    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)

    const startTotalMinutes = startHour * 60 + startMin
    let endTotalMinutes = endHour * 60 + endMin

    // Handle overnight shifts
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60
    }

    return (endTotalMinutes - startTotalMinutes) / 60
  }

  // Helper function to handle employee selection and auto-populate role
  const handleEmployeeSelection = (employeeId: string) => {
    const selectedEmployee = employees.find(emp => emp.id === employeeId)
    setNewShift({
      ...newShift,
      employeeId,
      role: selectedEmployee ? selectedEmployee.position : ''
    })
  }

  // Helper function to handle time changes and auto-calculate hours
  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const updatedShift = { ...newShift, [field]: value }

    // Auto-calculate hours if both times are set
    if (updatedShift.startTime && updatedShift.endTime) {
      updatedShift.hoursWorked = calculateHoursWorked(updatedShift.startTime, updatedShift.endTime)
    }

    setNewShift(updatedShift)
  }

  const calculateWeeklyHours = (employeeId: string, weekDate?: Date) => {
    const targetWeek = weekDate || new Date()
    const weekStart = new Date(targetWeek)
    weekStart.setDate(targetWeek.getDate() - targetWeek.getDay()) // Start of target week (Sunday)
    weekStart.setHours(0, 0, 0, 0) // Set to start of day

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // End of target week (Saturday)
    weekEnd.setHours(23, 59, 59, 999) // Set to end of day

    const employeeShifts = shifts.filter(shift => shift.employeeId === employeeId)
    const weekShifts = employeeShifts.filter(shift => {
      const shiftDate = new Date(shift.date)
      const dayOfWeek = shiftDate.getDay() // 0 = Sunday, 4 = Thursday, 5 = Friday, 6 = Saturday
      // Only count shifts on operating days (Thursday=4, Friday=5, Saturday=6)
      return shiftDate >= weekStart && shiftDate <= weekEnd && (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6)
    })

    return weekShifts.reduce((total, shift) => total + shift.hoursWorked, 0)
  }

  // Helper functions for week navigation
  const getWeekRange = (date: Date) => {
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // End of week (Saturday)

    return { weekStart, weekEnd }
  }

  const formatWeekRange = (date: Date) => {
    const { weekStart, weekEnd } = getWeekRange(date)
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    const locale = i18n.language === 'he' ? 'he-IL' : 'en-US'

    if (weekStart.getFullYear() !== weekEnd.getFullYear()) {
      return `${weekStart.toLocaleDateString(locale, { ...options, year: 'numeric' })} - ${weekEnd.toLocaleDateString(locale, { ...options, year: 'numeric' })}`
    } else if (weekStart.getMonth() !== weekEnd.getMonth()) {
      return `${weekStart.toLocaleDateString(locale, options)} - ${weekEnd.toLocaleDateString(locale, options)}, ${weekEnd.getFullYear()}`
    } else {
      return `${weekStart.toLocaleDateString(locale, { day: 'numeric' })} - ${weekEnd.toLocaleDateString(locale, options)}, ${weekEnd.getFullYear()}`
    }
  }

  const isCurrentWeek = (date: Date) => {
    const now = new Date()
    const { weekStart, weekEnd } = getWeekRange(date)
    return now >= weekStart && now <= weekEnd
  }

  const navigateWeek = (direction: 'prev' | 'next' | 'current') => {
    if (direction === 'current') {
      setSelectedWeek(new Date())
    } else {
      const newWeek = new Date(selectedWeek)
      const daysToAdd = direction === 'next' ? 7 : -7
      newWeek.setDate(selectedWeek.getDate() + daysToAdd)
      setSelectedWeek(newWeek)
    }
  }

  const calculateTotalHours = (employeeId: string, weekDate?: Date) => {
    const targetWeek = weekDate || new Date()
    const weekStart = new Date(targetWeek)
    weekStart.setDate(targetWeek.getDate() - targetWeek.getDay()) // Start of target week (Sunday)
    weekStart.setHours(0, 0, 0, 0) // Set to start of day

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // End of target week (Saturday)
    weekEnd.setHours(23, 59, 59, 999) // Set to end of day

    const employeeShifts = shifts.filter(shift => shift.employeeId === employeeId)
    const weekShifts = employeeShifts.filter(shift => {
      const shiftDate = new Date(shift.date)
      return shiftDate >= weekStart && shiftDate <= weekEnd
    })

    return weekShifts.reduce((total, shift) => total + shift.hoursWorked, 0)
  }

  // Schedule helper functions
  const navigateScheduleWeek = (direction: 'prev' | 'next' | 'current') => {
    let newWeek: Date
    if (direction === 'current') {
      newWeek = new Date()
    } else {
      newWeek = new Date(scheduleWeek)
      const daysToAdd = direction === 'next' ? 7 : -7
      newWeek.setDate(scheduleWeek.getDate() + daysToAdd)
    }
    setScheduleWeek(newWeek)
    loadScheduleForWeek(newWeek)
  }

  const getWeekDays = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return []
    }

    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)

    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      days.push(day)
    }

    return days
  }

  const getWeekDaysForDisplay = (date: Date) => {
    const days = getWeekDays(date)
    // Filter only operating days
    const operatingDaysOnly = days.filter(day => operatingDays.includes(day.getDay()))
    // Reverse days for RTL (Hebrew) in UI only
    return isRtl ? [...operatingDaysOnly].reverse() : operatingDaysOnly
  }

  const formatDayKey = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0] // Fallback to today
    }
    return date.toISOString().split('T')[0] // YYYY-MM-DD format
  }

  const updateEmployeeSchedule = async (employeeId: string, dayKey: string, field: 'startTime' | 'endTime', value: string) => {
    // Update local state first
    const newSchedule = {
      ...weeklySchedule,
      [employeeId]: {
        ...weeklySchedule[employeeId],
        [dayKey]: {
          startTime: weeklySchedule[employeeId]?.[dayKey]?.startTime || '',
          endTime: weeklySchedule[employeeId]?.[dayKey]?.endTime || '',
          [field]: value
        }
      }
    }
    setWeeklySchedule(newSchedule)

    // Get the complete time data for this day
    const daySchedule = newSchedule[employeeId][dayKey]
    const date = new Date(dayKey)

    try {
      // Find existing shift for this employee and day
      const existingShift = shifts.find(shift => shift.employeeId === employeeId && formatDayKey(new Date(shift.date)) === dayKey)

      if (daySchedule.startTime && daySchedule.endTime) {
        // Both times are set, create or update shift
        const employee = employees.find(emp => emp.id === employeeId)
        if (employee) {
          const hoursWorked = calculateHoursWorked(daySchedule.startTime, daySchedule.endTime)

          const shiftData = {
            employeeId,
            date,
            startTime: daySchedule.startTime,
            endTime: daySchedule.endTime,
            hoursWorked,
            role: employee.position,
            location: 'Main Location'
          }

          if (existingShift) {
            // Update existing shift
            await shiftsService.update(existingShift.id, shiftData)
          } else {
            // Create new shift
            await shiftsService.create(shiftData)
          }

          // Reload shifts to get updated data
          await loadShifts()
        }
      } else if (existingShift && (!daySchedule.startTime || !daySchedule.endTime)) {
        // One or both times are empty, delete the shift
        await shiftsService.delete(existingShift.id)
        await loadShifts()
      }
    } catch (error) {
      console.error('Failed to save schedule change:', error)
      // Optionally show error to user
      setSnackbar({ open: true, message: t('failed_to_save_schedule'), severity: 'error' })
    }
  }

  const addEmployeeToSchedule = () => {
    const newEmployeeId = `temp-${Date.now()}`
    setEmployees(prev => [
      ...prev,
      {
        id: newEmployeeId,
        businessId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        hourlyRate: 0,
        hireDate: new Date(),
        isActive: true
      }
    ])
  }

  const removeEmployeeFromSchedule = (employeeId: string) => {
    if (employeeId.startsWith('temp-')) {
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId))
      setWeeklySchedule(prev => {
        const { [employeeId]: removed, ...rest } = prev
        return rest
      })
    }
  }

  const handleExportToPDF = async () => {
    try {
      await exportScheduleToPDF({
        employees,
        scheduleData: weeklySchedule,
        weekDays: getWeekDaysForDisplay(scheduleWeek),
        weekRange: formatWeekRange(scheduleWeek),
        businessName: 'Food Truck Manager',
        isRtl,
        operatingDays
      })
      setSnackbar({ open: true, message: t('schedule_exported_successfully'), severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: t('failed_to_export_schedule'), severity: 'error' })
    }
  }

  const handleExportToImage = async () => {
    try {
      const fileName = `schedule-${formatWeekRange(scheduleWeek).replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
      await exportScheduleToImage('weekly-schedule-table', fileName)
      setSnackbar({ open: true, message: t('schedule_exported_successfully'), severity: 'success' })
    } catch (error) {
      setSnackbar({ open: true, message: t('failed_to_export_schedule'), severity: 'error' })
    }
  }

  // Helper function to get display name for employees
  const getDisplayName = (employee: Employee, allEmployees: Employee[]) => {
    const activeEmployees = allEmployees.filter(emp => emp.isActive)
    const sameFirstName = activeEmployees.filter(emp => emp.firstName.toLowerCase() === employee.firstName.toLowerCase() && emp.id !== employee.id)

    if (sameFirstName.length > 0) {
      return `${employee.firstName} ${employee.lastName.charAt(0).toUpperCase()}.`
    }

    return employee.firstName
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
        <Typography variant="h4" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
          {t('employee_management')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
          <Button variant="outlined" startIcon={<ScheduleIcon />} onClick={() => setOpenShiftDialog(true)} sx={{ marginInlineEnd: 1 }}>
            {t('add_shift')}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenEmployeeDialog(true)}>
            {t('add_employee')}
          </Button>
        </Box>
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={t('employees_tab')} />
          <Tab label={t('shifts_tab')} />
          <Tab label={t('payroll_tab')} />
          <Tab label={t('schedule_tab')} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            {employees.map(employee => (
              <Grid item xs={12} sm={6} md={4} key={employee.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                      <Avatar sx={{ marginInlineEnd: 2 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box sx={{ flexGrow: 1, textAlign: isRtl ? 'right' : 'left' }}>
                        <Typography variant="h6">
                          {employee.firstName} {employee.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {employee.position}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
                        <IconButton size="small" onClick={() => handleEditEmployee(employee)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteEmployee(employee.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {t('email')}: {employee.email}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {t('phone')}: {employee.phone}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {t('hourly_rate')}: {formatCurrency(employee.hourlyRate)}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {t('hours_this_week')}: {calculateWeeklyHours(employee.id, new Date()).toFixed(2)} {t('hours')}
                    </Typography>

                    <Chip label={employee.isActive ? t('active') : t('inactive')} color={employee.isActive ? 'success' : 'default'} size="small" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('employee')}</TableCell>
                  <TableCell>{t('date')}</TableCell>
                  <TableCell>{t('start_time')}</TableCell>
                  <TableCell>{t('end_time')}</TableCell>
                  <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{t('hours')}</TableCell>
                  <TableCell>{t('role')}</TableCell>
                  <TableCell>{t('location')}</TableCell>
                  <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.map(shift => (
                  <TableRow key={shift.id}>
                    <TableCell>{getEmployeeName(shift.employeeId)}</TableCell>
                    <TableCell>{shift.date.toLocaleDateString()}</TableCell>
                    <TableCell>{shift.startTime}</TableCell>
                    <TableCell>{shift.endTime}</TableCell>
                    <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{shift.hoursWorked}</TableCell>
                    <TableCell>{shift.role}</TableCell>
                    <TableCell>{shift.location}</TableCell>
                    <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>
                      <IconButton size="small" onClick={() => handleEditShift(shift)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteShift(shift.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <Typography variant="h6" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
              {t('payroll_summary')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <IconButton onClick={() => navigateWeek('prev')} size="small">
                {isRtl ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
              <Button onClick={() => navigateWeek('current')} startIcon={<TodayIcon />} variant={isCurrentWeek(selectedWeek) ? 'contained' : 'outlined'} size="small">
                {isCurrentWeek(selectedWeek) ? t('current_week') : t('go_to_current')}
              </Button>
              <IconButton onClick={() => navigateWeek('next')} size="small">
                {isRtl ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
            </Box>
          </Box>

          <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
            {t('week_of')} {formatWeekRange(selectedWeek)}
          </Typography>

          {employees.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t('no_employees_found')}
            </Alert>
          ) : shifts.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t('no_shifts_scheduled_yet')}
            </Alert>
          ) : (
            <TableContainer>
              <Table sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('employee')}</TableCell>
                    <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{t('hours_this_week')}</TableCell>
                    <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{t('all_hours_this_week')}</TableCell>
                    <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{t('hourly_rate')}</TableCell>
                    <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{t('weekly_pay')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map(employee => {
                    const weeklyHours = calculateWeeklyHours(employee.id, selectedWeek)
                    const totalHours = calculateTotalHours(employee.id, selectedWeek)
                    const weeklyPay = weeklyHours * employee.hourlyRate
                    return (
                      <TableRow key={employee.id} sx={{ opacity: weeklyHours === 0 ? 0.6 : 1 }}>
                        <TableCell>
                          {employee.firstName} {employee.lastName}
                          {weeklyHours === 0 && <Chip label={t('no_shifts')} size="small" variant="outlined" sx={{ marginInlineStart: 1 }} />}
                        </TableCell>
                        <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>
                          <Typography variant="body2" sx={{ fontWeight: weeklyHours > 0 ? 'bold' : 'normal' }}>
                            {weeklyHours.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{totalHours.toFixed(2)}</TableCell>
                        <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{formatCurrency(employee.hourlyRate)}</TableCell>
                        <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>
                          <Typography variant="body2" sx={{ fontWeight: weeklyPay > 0 ? 'bold' : 'normal' }}>
                            {formatCurrency(weeklyPay)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t('totals')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: isRtl ? 'start' : 'end' }}>{employees.reduce((total, emp) => total + calculateWeeklyHours(emp.id, selectedWeek), 0).toFixed(2)}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: isRtl ? 'start' : 'end' }}>{employees.reduce((total, emp) => total + calculateTotalHours(emp.id, selectedWeek), 0).toFixed(2)}</TableCell>
                    <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>-</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: isRtl ? 'start' : 'end' }}>
                      $
                      {employees
                        .reduce((total, emp) => {
                          const weeklyHours = calculateWeeklyHours(emp.id, selectedWeek)
                          return total + weeklyHours * emp.hourlyRate
                        }, 0)
                        .toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            <Typography variant="h6" sx={{ textAlign: isRtl ? 'right' : 'left' }}>
              {t('weekly_schedule')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: isRtl ? 'row-reverse' : 'row' }}>
              <Button variant="outlined" startIcon={<SettingsIcon />} onClick={() => setOpenDaysDialog(true)} size="small">
                {t('operating_days')}
              </Button>
              <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportToPDF} size="small" color="secondary">
                {t('export_pdf')}
              </Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportToImage} size="small" color="secondary">
                {t('export_image')}
              </Button>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={addEmployeeToSchedule} size="small">
                {t('add_employee')}
              </Button>
              <IconButton onClick={() => navigateScheduleWeek('prev')} size="small">
                {isRtl ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
              <Button onClick={() => navigateScheduleWeek('current')} startIcon={<TodayIcon />} variant={isCurrentWeek(scheduleWeek) ? 'contained' : 'outlined'} size="small">
                {isCurrentWeek(scheduleWeek) ? t('current_week') : t('go_to_current')}
              </Button>
              <IconButton onClick={() => navigateScheduleWeek('next')} size="small">
                {isRtl ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
            </Box>
          </Box>

          <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
            {t('week_of')} {formatWeekRange(scheduleWeek)}
          </Typography>

          <TableContainer component={Paper} sx={{ mb: 3 }} id="weekly-schedule-table">
            <Table sx={{ direction: isRtl ? 'rtl' : 'ltr' }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('employee')}</TableCell>
                  {(getWeekDaysForDisplay(scheduleWeek) || []).map(day => (
                    <TableCell key={formatDayKey(day)} align="center">
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {day.toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', { weekday: 'short' })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {day.toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', { month: 'numeric', day: 'numeric' })}
                        </Typography>
                      </Box>
                    </TableCell>
                  ))}
                  <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>{t('actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees
                  .filter(emp => emp.isActive)
                  .map(employee => {
                    const employeeSchedule = weeklySchedule[employee.id] || {}

                    return (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <Box>
                            {employee.id.startsWith('temp-') ? (
                              <TextField
                                size="small"
                                placeholder="Employee name"
                                value={`${employee.firstName} ${employee.lastName}`.trim()}
                                onChange={e => {
                                  const [firstName, ...lastNameParts] = e.target.value.split(' ')
                                  const lastName = lastNameParts.join(' ')
                                  setEmployees(prev => prev.map(emp => (emp.id === employee.id ? { ...emp, firstName: firstName || '', lastName: lastName || '' } : emp)))
                                }}
                                sx={{ width: 120 }}
                              />
                            ) : (
                              <>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                  {getDisplayName(employee, employees)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {employee.position}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </TableCell>
                        {(getWeekDaysForDisplay(scheduleWeek) || []).map(day => {
                          const dayKey = formatDayKey(day)
                          const daySchedule = employeeSchedule[dayKey] || { startTime: '', endTime: '' }

                          return (
                            <TableCell key={dayKey} align="center">
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                                <TextField size="small" type="time" value={daySchedule.startTime} onChange={e => updateEmployeeSchedule(employee.id, dayKey, 'startTime', e.target.value)} sx={{ width: 100 }} placeholder="Start" />
                                <TextField size="small" type="time" value={daySchedule.endTime} onChange={e => updateEmployeeSchedule(employee.id, dayKey, 'endTime', e.target.value)} sx={{ width: 100 }} placeholder="End" />
                              </Box>
                            </TableCell>
                          )
                        })}
                        <TableCell sx={{ textAlign: isRtl ? 'start' : 'end' }}>
                          {employee.id.startsWith('temp-') && (
                            <IconButton size="small" onClick={() => removeEmployeeFromSchedule(employee.id)}>
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Employee Dialog */}
      <Dialog open={openEmployeeDialog} onClose={() => setOpenEmployeeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEmployee ? t('edit_employee') : t('add_new_employee')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('first_name')} value={newEmployee.firstName} onChange={e => setNewEmployee({ ...newEmployee, firstName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('last_name')} value={newEmployee.lastName} onChange={e => setNewEmployee({ ...newEmployee, lastName: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={t('email')} type="email" value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={t('phone')} value={newEmployee.phone} onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('position')} value={newEmployee.position} onChange={e => setNewEmployee({ ...newEmployee, position: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('hourly_rate')} type="number" inputProps={{ step: '0.01' }} value={newEmployee.hourlyRate} onChange={e => setNewEmployee({ ...newEmployee, hourlyRate: parseFloat(e.target.value) })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmployeeDialog(false)}>{t('cancel')}</Button>
          <Button onClick={handleSaveEmployee} variant="contained">
            {editingEmployee ? t('update_employee') : t('add_employee')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shift Dialog */}
      <Dialog
        open={openShiftDialog}
        onClose={() => {
          setOpenShiftDialog(false)
          setEditingShift(null)
          setNewShift({
            employeeId: '',
            date: new Date(),
            startTime: '',
            endTime: '',
            hoursWorked: 0,
            role: '',
            location: 'Main Location'
          })
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingShift ? t('edit_shift') : t('schedule_new_shift')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth select label={t('employee')} value={newShift.employeeId} onChange={e => handleEmployeeSelection(e.target.value)} SelectProps={{ native: true }}>
                <option value="">{t('select_employee')}</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} - {employee.position}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={t('date')} type="date" value={newShift.date instanceof Date ? newShift.date.toISOString().split('T')[0] : newShift.date} onChange={e => setNewShift({ ...newShift, date: new Date(e.target.value) })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('start_time')} type="time" value={newShift.startTime} onChange={e => handleTimeChange('startTime', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('end_time')} type="time" value={newShift.endTime} onChange={e => handleTimeChange('endTime', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('hours_worked')} type="number" inputProps={{ step: '0.25', readOnly: true }} value={newShift.hoursWorked || 0} helperText={t('auto_calculated_from_times')} disabled />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t('role')} value={newShift.role} helperText={t('auto_populated_from_position')} InputProps={{ readOnly: true }} disabled />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShiftDialog(false)}>{t('cancel')}</Button>
          <Button onClick={handleSaveShift} variant="contained">
            {editingShift ? t('update_shift') : t('schedule_shift')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Operating Days Dialog */}
      <Dialog open={openDaysDialog} onClose={() => setOpenDaysDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('configure_operating_days')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            {t('select_days_business_operates')}
          </Typography>
          <FormGroup>
            {[
              { day: 0, label: t('sunday') },
              { day: 1, label: t('monday') },
              { day: 2, label: t('tuesday') },
              { day: 3, label: t('wednesday') },
              { day: 4, label: t('thursday') },
              { day: 5, label: t('friday') },
              { day: 6, label: t('saturday') }
            ].map(({ day, label }) => (
              <FormControlLabel
                key={day}
                control={
                  <Checkbox
                    checked={operatingDays.includes(day)}
                    onChange={e => {
                      let newDays: number[]
                      if (e.target.checked) {
                        newDays = [...operatingDays, day].sort()
                      } else {
                        newDays = operatingDays.filter(d => d !== day)
                      }
                      setOperatingDays(newDays)
                      localStorage.setItem('operatingDays', JSON.stringify(newDays))
                    }}
                  />
                }
                label={label}
              />
            ))}
          </FormGroup>
          {operatingDays.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {t('select_at_least_one_day')}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDaysDialog(false)}>{t('cancel')}</Button>
          <Button onClick={() => setOpenDaysDialog(false)} variant="contained" disabled={operatingDays.length === 0}>
            {t('save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
