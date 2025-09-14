import React, { useState, useEffect } from 'react'
import { Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Avatar, Tab, Tabs, IconButton, Grid, Snackbar, Alert } from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Schedule as ScheduleIcon, Person as PersonIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Today as TodayIcon } from '@mui/icons-material'
import { Employee, Shift } from '../types'
import { employeesService, shiftsService, subscriptions } from '../services/supabaseService'

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
  const [tabValue, setTabValue] = useState(0)
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false)
  const [openShiftDialog, setOpenShiftDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [selectedWeek, setSelectedWeek] = useState(new Date()) // Week to display in payroll

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
      setSnackbar({ open: true, message: 'Failed to load employee data', severity: 'error' })
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleSaveEmployee = async () => {
    try {
      if (editingEmployee) {
        await employeesService.update(editingEmployee.id, newEmployee)
        setSnackbar({ open: true, message: 'Employee updated successfully', severity: 'success' })
      } else {
        await employeesService.create(newEmployee as Omit<Employee, 'id'>)
        setSnackbar({ open: true, message: 'Employee added successfully', severity: 'success' })
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
      setSnackbar({ open: true, message: 'Failed to save employee', severity: 'error' })
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
      setSnackbar({ open: true, message: 'Employee deleted successfully', severity: 'success' })
      await loadEmployees()
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete employee', severity: 'error' })
    }
  }

  const handleSaveShift = async () => {
    try {
      if (editingShift) {
        await shiftsService.update(editingShift.id, newShift)
        setSnackbar({ open: true, message: 'Shift updated successfully', severity: 'success' })
      } else {
        await shiftsService.create(newShift as Omit<Shift, 'id'>)
        setSnackbar({ open: true, message: 'Shift scheduled successfully', severity: 'success' })
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
      setSnackbar({ open: true, message: editingShift ? 'Failed to update shift' : 'Failed to schedule shift', severity: 'error' })
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
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'
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
      return shiftDate >= weekStart && 
             shiftDate <= weekEnd && 
             (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6)
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
    
    if (weekStart.getFullYear() !== weekEnd.getFullYear()) {
      return `${weekStart.toLocaleDateString('en-US', { ...options, year: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { ...options, year: 'numeric' })}`
    } else if (weekStart.getMonth() !== weekEnd.getMonth()) {
      return `${weekStart.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString('en-US', options)}, ${weekEnd.getFullYear()}`
    } else {
      return `${weekStart.toLocaleDateString('en-US', { day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', options)}, ${weekEnd.getFullYear()}`
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

  const calculateTotalHours = (employeeId: string) => {
    return shifts
      .filter(shift => shift.employeeId === employeeId)
      .reduce((total, shift) => total + shift.hoursWorked, 0)
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Employee Management</Typography>
        <Box>
          <Button variant="outlined" startIcon={<ScheduleIcon />} onClick={() => setOpenShiftDialog(true)} sx={{ mr: 1 }}>
            Add Shift
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenEmployeeDialog(true)}>
            Add Employee
          </Button>
        </Box>
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Employees" />
          <Tab label="Shifts" />
          <Tab label="Payroll" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            {employees.map(employee => (
              <Grid item xs={12} sm={6} md={4} key={employee.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2 }}>
                        <PersonIcon />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">
                          {employee.firstName} {employee.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {employee.position}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => handleEditEmployee(employee)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteEmployee(employee.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Email: {employee.email}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Phone: {employee.phone}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Hourly Rate: ${employee.hourlyRate.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      This Week: {calculateWeeklyHours(employee.id, new Date()).toFixed(2)} hours
                    </Typography>

                    <Chip label={employee.isActive ? 'Active' : 'Inactive'} color={employee.isActive ? 'success' : 'default'} size="small" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Start Time</TableCell>
                  <TableCell>End Time</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.map(shift => (
                  <TableRow key={shift.id}>
                    <TableCell>{getEmployeeName(shift.employeeId)}</TableCell>
                    <TableCell>{shift.date.toLocaleDateString()}</TableCell>
                    <TableCell>{shift.startTime}</TableCell>
                    <TableCell>{shift.endTime}</TableCell>
                    <TableCell>{shift.hoursWorked}</TableCell>
                    <TableCell>{shift.role}</TableCell>
                    <TableCell>{shift.location}</TableCell>
                    <TableCell>
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Payroll Summary</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => navigateWeek('prev')} size="small">
                <ChevronLeftIcon />
              </IconButton>
              <Button
                onClick={() => navigateWeek('current')}
                startIcon={<TodayIcon />}
                variant={isCurrentWeek(selectedWeek) ? 'contained' : 'outlined'}
                size="small"
              >
                {isCurrentWeek(selectedWeek) ? 'Current Week' : 'Go to Current'}
              </Button>
              <IconButton onClick={() => navigateWeek('next')} size="small">
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Typography variant="subtitle1" sx={{ mb: 2, color: 'text.secondary' }}>
            Week of {formatWeekRange(selectedWeek)}
          </Typography>

          {employees.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No employees found. Add employees to see payroll information.
            </Alert>
          ) : shifts.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              No shifts scheduled yet. Add shifts to see payroll calculations.
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Employee</TableCell>
                    <TableCell>Hours This Week</TableCell>
                    <TableCell>Total Hours (All Time)</TableCell>
                    <TableCell>Hourly Rate</TableCell>
                    <TableCell>Weekly Pay</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {employees.map(employee => {
                    const weeklyHours = calculateWeeklyHours(employee.id, selectedWeek)
                    const totalHours = calculateTotalHours(employee.id)
                    const weeklyPay = weeklyHours * employee.hourlyRate
                    return (
                      <TableRow key={employee.id} sx={{ opacity: weeklyHours === 0 ? 0.6 : 1 }}>
                        <TableCell>
                          {employee.firstName} {employee.lastName}
                          {weeklyHours === 0 && (
                            <Chip label="No shifts" size="small" variant="outlined" sx={{ ml: 1 }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: weeklyHours > 0 ? 'bold' : 'normal' }}>
                            {weeklyHours.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>{totalHours.toFixed(2)}</TableCell>
                        <TableCell>${employee.hourlyRate.toFixed(2)}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: weeklyPay > 0 ? 'bold' : 'normal' }}>
                            ${weeklyPay.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>TOTALS</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {employees.reduce((total, emp) => total + calculateWeeklyHours(emp.id, selectedWeek), 0).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      {employees.reduce((total, emp) => total + calculateTotalHours(emp.id), 0).toFixed(2)}
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      ${employees.reduce((total, emp) => {
                        const weeklyHours = calculateWeeklyHours(emp.id, selectedWeek)
                        return total + (weeklyHours * emp.hourlyRate)
                      }, 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      {/* Employee Dialog */}
      <Dialog open={openEmployeeDialog} onClose={() => setOpenEmployeeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="First Name" value={newEmployee.firstName} onChange={e => setNewEmployee({ ...newEmployee, firstName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Last Name" value={newEmployee.lastName} onChange={e => setNewEmployee({ ...newEmployee, lastName: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" type="email" value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Phone" value={newEmployee.phone} onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Position" value={newEmployee.position} onChange={e => setNewEmployee({ ...newEmployee, position: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Hourly Rate" type="number" inputProps={{ step: '0.01' }} value={newEmployee.hourlyRate} onChange={e => setNewEmployee({ ...newEmployee, hourlyRate: parseFloat(e.target.value) })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmployeeDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveEmployee} variant="contained">
            {editingEmployee ? 'Update' : 'Add'} Employee
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shift Dialog */}
      <Dialog open={openShiftDialog} onClose={() => {
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
      }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingShift ? 'Edit Shift' : 'Schedule New Shift'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth select label="Employee" value={newShift.employeeId} onChange={e => handleEmployeeSelection(e.target.value)} SelectProps={{ native: true }}>
                <option value="">Select Employee</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} - {employee.position}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={newShift.date instanceof Date ? newShift.date.toISOString().split('T')[0] : newShift.date}
                onChange={e => setNewShift({ ...newShift, date: new Date(e.target.value) })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Start Time" type="time" value={newShift.startTime} onChange={e => handleTimeChange('startTime', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="End Time" type="time" value={newShift.endTime} onChange={e => handleTimeChange('endTime', e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Hours Worked" type="number" inputProps={{ step: '0.25', readOnly: true }} value={newShift.hoursWorked || 0} helperText="Automatically calculated from start and end times" disabled />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Role" value={newShift.role} helperText="Auto-populated from employee position" InputProps={{ readOnly: true }} disabled />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShiftDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveShift} variant="contained">
            {editingShift ? 'Update Shift' : 'Schedule Shift'}
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
