import React, { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Modal,
  Input,
  Table,
  Tag,
  Space,
  message,
  Tabs,
  Avatar,
  Checkbox,
  Select,
  Spin,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ScheduleOutlined,
  UserOutlined,
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { Employee, Shift } from '../types'
import { employeesService, shiftsService, subscriptions } from '../services/supabaseService'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../utils/currency'
import { exportScheduleToPDF, exportScheduleToImage } from '../utils/pdfExport'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { Option } = Select

export default function Employees() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const [tabValue, setTabValue] = useState(() => {
    const savedTab = localStorage.getItem('employeesTabValue')
    return savedTab || '1'
  })
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false)
  const [openShiftDialog, setOpenShiftDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [loading, setLoading] = useState(false)
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
      message.error(t('failed_to_load_employee_data'))
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

  const handleTabChange = (newValue: string) => {
    setTabValue(newValue)
    localStorage.setItem('employeesTabValue', newValue)
  }

  const handleSaveEmployee = async () => {
    try {
      if (editingEmployee) {
        await employeesService.update(editingEmployee.id, newEmployee)
        message.success(t('employee_updated_success'))
      } else {
        await employeesService.create(newEmployee as Omit<Employee, 'id'>)
        message.success(t('employee_added_success'))
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
      message.error(t('failed_to_save_employee'))
    }
  }

  const handleEditEmployee = (employee: Employee) => {
    setNewEmployee(employee)
    setEditingEmployee(employee)
    setOpenEmployeeDialog(true)
  }

  const handleDeleteEmployee = async (id: string) => {
    Modal.confirm({
      title: t('confirm_delete_employee'),
      onOk: async () => {
        try {
          await employeesService.delete(id)
          message.success(t('employee_deleted_success'))
          await loadEmployees()
        } catch (error) {
          message.error(t('failed_to_delete_employee'))
        }
      }
    })
  }

  const handleSaveShift = async () => {
    try {
      if (editingShift) {
        await shiftsService.update(editingShift.id, newShift)
        message.success(t('shift_updated_success'))
      } else {
        await shiftsService.create(newShift as Omit<Shift, 'id'>)
        message.success(t('shift_scheduled_success'))
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
      message.error(editingShift ? t('failed_to_update_shift') : t('failed_to_schedule_shift'))
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
    Modal.confirm({
      title: 'Are you sure you want to delete this shift?',
      onOk: async () => {
        try {
          await shiftsService.delete(id)
          message.success('Shift deleted successfully')
          await loadShifts()
        } catch (error) {
          message.error('Failed to delete shift')
        }
      }
    })
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
      message.error(t('failed_to_save_schedule'))
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
      message.success(t('schedule_exported_successfully'))
    } catch (error) {
      message.error(t('failed_to_export_schedule'))
    }
  }

  const handleExportToImage = async () => {
    try {
      const fileName = `schedule-${formatWeekRange(scheduleWeek).replace(/[^a-zA-Z0-9]/g, '-')}.pdf`
      await exportScheduleToImage('weekly-schedule-table', fileName)
      message.success(t('schedule_exported_successfully'))
    } catch (error) {
      message.error(t('failed_to_export_schedule'))
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

  const shiftsColumns: ColumnsType<Shift> = [
    {
      title: t('employee'),
      key: 'employee',
      align: isRtl ? 'right' : 'left',
      render: (_, record) => getEmployeeName(record.employeeId),
    },
    {
      title: t('date'),
      dataIndex: 'date',
      key: 'date',
      render: (date) => date.toLocaleDateString(),
    },
    {
      title: t('start_time'),
      dataIndex: 'startTime',
      key: 'startTime',
    },
    {
      title: t('end_time'),
      dataIndex: 'endTime',
      key: 'endTime',
    },
    {
      title: t('hours'),
      dataIndex: 'hoursWorked',
      key: 'hoursWorked',
      align: isRtl ? 'left' : 'right',
    },
    {
      title: t('role'),
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: t('location'),
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: t('actions'),
      key: 'actions',
      align: isRtl ? 'left' : 'right',
      render: (_, record) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEditShift(record)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteShift(record.id)} />
        </Space>
      ),
    },
  ]

  const payrollColumns: ColumnsType<Employee> = [
    {
      title: t('employee'),
      key: 'employee',
      align: isRtl ? 'right' : 'left',
      render: (_, record) => (
        <Space>
          <Text>{record.firstName} {record.lastName}</Text>
          {calculateWeeklyHours(record.id, selectedWeek) === 0 && (
            <Tag>{t('no_shifts')}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: t('hours_this_week'),
      key: 'weeklyHours',
      align: isRtl ? 'left' : 'right',
      render: (_, record) => {
        const hours = calculateWeeklyHours(record.id, selectedWeek)
        return <Text strong={hours > 0}>{hours.toFixed(2)}</Text>
      },
    },
    {
      title: t('all_hours_this_week'),
      key: 'totalHours',
      align: isRtl ? 'left' : 'right',
      render: (_, record) => calculateTotalHours(record.id, selectedWeek).toFixed(2),
    },
    {
      title: t('hourly_rate'),
      dataIndex: 'hourlyRate',
      key: 'hourlyRate',
      align: isRtl ? 'left' : 'right',
      render: (rate) => formatCurrency(rate),
    },
    {
      title: t('weekly_pay'),
      key: 'weeklyPay',
      align: isRtl ? 'left' : 'right',
      render: (_, record) => {
        const weeklyHours = calculateWeeklyHours(record.id, selectedWeek)
        const weeklyPay = weeklyHours * record.hourlyRate
        return <Text strong={weeklyPay > 0}>{formatCurrency(weeklyPay)}</Text>
      },
    },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>{t('employee_management')}</Title>
        <Space>
          <Button icon={<ScheduleOutlined />} onClick={() => setOpenShiftDialog(true)}>
            {t('add_shift')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenEmployeeDialog(true)}>
            {t('add_employee')}
          </Button>
        </Space>
      </div>

      <Card bordered={false}>
        <Tabs activeKey={tabValue} onChange={handleTabChange}>
          <TabPane tab={t('employees_tab')} key="1">
            <Row gutter={[16, 16]}>
              {employees.map(employee => (
                <Col xs={24} sm={12} md={8} key={employee.id}>
                  <Card bordered>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                      <Avatar icon={<UserOutlined />} style={{ marginRight: isRtl ? 0 : 16, marginLeft: isRtl ? 16 : 0 }} />
                      <div style={{ flexGrow: 1 }}>
                        <Title level={5} style={{ margin: 0, textAlign: isRtl ? 'right' : 'left' }}>
                          {employee.firstName} {employee.lastName}
                        </Title>
                        <Text type="secondary" style={{ display: 'block', textAlign: isRtl ? 'right' : 'left' }}>{employee.position}</Text>
                      </div>
                      <Space>
                        <Button type="text" icon={<EditOutlined />} onClick={() => handleEditEmployee(employee)} />
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDeleteEmployee(employee.id)} />
                      </Space>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">{t('email')}: </Text>
                      <Text>{employee.email}</Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">{t('phone')}: </Text>
                      <Text>{employee.phone}</Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">{t('hourly_rate')}: </Text>
                      <Text>{formatCurrency(employee.hourlyRate)}</Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">{t('hours_this_week')}: </Text>
                      <Text>{calculateWeeklyHours(employee.id, new Date()).toFixed(2)} {t('hours')}</Text>
                    </div>

                    <Tag color={employee.isActive ? 'success' : 'default'}>{employee.isActive ? t('active') : t('inactive')}</Tag>
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>

          <TabPane tab={t('shifts_tab')} key="2">
            <Table
              columns={shiftsColumns}
              dataSource={shifts}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab={t('payroll_tab')} key="3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Title level={4}>{t('payroll_summary')}</Title>
              <Space>
                <Button icon={isRtl ? <RightOutlined /> : <LeftOutlined />} onClick={() => navigateWeek('prev')} />
                <Button
                  icon={<CalendarOutlined />}
                  type={isCurrentWeek(selectedWeek) ? 'primary' : 'default'}
                  onClick={() => navigateWeek('current')}
                >
                  {isCurrentWeek(selectedWeek) ? t('current_week') : t('go_to_current')}
                </Button>
                <Button icon={isRtl ? <LeftOutlined /> : <RightOutlined />} onClick={() => navigateWeek('next')} />
              </Space>
            </div>

            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              {t('week_of')} {formatWeekRange(selectedWeek)}
            </Text>

            {employees.length === 0 ? (
              <Card>
                <Text>{t('no_employees_found')}</Text>
              </Card>
            ) : shifts.length === 0 ? (
              <Card>
                <Text>{t('no_shifts_scheduled_yet')}</Text>
              </Card>
            ) : (
              <>
                <Table
                  columns={payrollColumns}
                  dataSource={employees}
                  rowKey="id"
                  pagination={false}
                  summary={(pageData) => {
                    const totalWeeklyHours = pageData.reduce((sum, emp) => sum + calculateWeeklyHours(emp.id, selectedWeek), 0)
                    const totalAllHours = pageData.reduce((sum, emp) => sum + calculateTotalHours(emp.id, selectedWeek), 0)
                    const totalPay = pageData.reduce((sum, emp) => sum + (calculateWeeklyHours(emp.id, selectedWeek) * emp.hourlyRate), 0)

                    return (
                      <Table.Summary.Row style={{ fontWeight: 'bold' }}>
                        <Table.Summary.Cell index={0}>{t('totals')}</Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align={isRtl ? 'left' : 'right'}>{totalWeeklyHours.toFixed(2)}</Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align={isRtl ? 'left' : 'right'}>{totalAllHours.toFixed(2)}</Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align={isRtl ? 'left' : 'right'}>-</Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align={isRtl ? 'left' : 'right'}>${totalPay.toFixed(2)}</Table.Summary.Cell>
                      </Table.Summary.Row>
                    )
                  }}
                />
              </>
            )}
          </TabPane>

          <TabPane tab={t('schedule_tab')} key="4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
              <Title level={4}>{t('weekly_schedule')}</Title>
              <Space wrap>
                <Button icon={<SettingOutlined />} onClick={() => setOpenDaysDialog(true)}>
                  {t('operating_days')}
                </Button>
                <Button icon={<FilePdfOutlined />} onClick={handleExportToPDF}>
                  {t('export_pdf')}
                </Button>
                <Button icon={<DownloadOutlined />} onClick={handleExportToImage}>
                  {t('export_image')}
                </Button>
                <Button icon={<PlusOutlined />} onClick={addEmployeeToSchedule}>
                  {t('add_employee')}
                </Button>
                <Button icon={isRtl ? <RightOutlined /> : <LeftOutlined />} onClick={() => navigateScheduleWeek('prev')} />
                <Button
                  icon={<CalendarOutlined />}
                  type={isCurrentWeek(scheduleWeek) ? 'primary' : 'default'}
                  onClick={() => navigateScheduleWeek('current')}
                >
                  {isCurrentWeek(scheduleWeek) ? t('current_week') : t('go_to_current')}
                </Button>
                <Button icon={isRtl ? <LeftOutlined /> : <RightOutlined />} onClick={() => navigateScheduleWeek('next')} />
              </Space>
            </div>

            <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
              {t('week_of')} {formatWeekRange(scheduleWeek)}
            </Text>

            <div id="weekly-schedule-table" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #f0f0f0' }}>
                <thead>
                  <tr>
                    {isRtl ? (
                      <>
                        <th style={{ padding: 8, borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>{t('actions')}</th>
                        {getWeekDaysForDisplay(scheduleWeek).map(day => (
                          <th key={formatDayKey(day)} style={{ padding: 8, borderBottom: '2px solid #f0f0f0', textAlign: 'center' }}>
                            <div>
                              <Text strong>{day.toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', { weekday: 'short' })}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {day.toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', { month: 'numeric', day: 'numeric' })}
                              </Text>
                            </div>
                          </th>
                        ))}
                        <th style={{ padding: 8, borderBottom: '2px solid #f0f0f0' }}>{t('employee')}</th>
                      </>
                    ) : (
                      <>
                        <th style={{ padding: 8, borderBottom: '2px solid #f0f0f0' }}>{t('employee')}</th>
                        {getWeekDaysForDisplay(scheduleWeek).map(day => (
                          <th key={formatDayKey(day)} style={{ padding: 8, borderBottom: '2px solid #f0f0f0', textAlign: 'center' }}>
                            <div>
                              <Text strong>{day.toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', { weekday: 'short' })}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {day.toLocaleDateString(i18n.language === 'he' ? 'he-IL' : 'en-US', { month: 'numeric', day: 'numeric' })}
                              </Text>
                            </div>
                          </th>
                        ))}
                        <th style={{ padding: 8, borderBottom: '2px solid #f0f0f0', textAlign: 'right' }}>{t('actions')}</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {employees
                    .filter(emp => emp.isActive)
                    .map(employee => {
                      const employeeSchedule = weeklySchedule[employee.id] || {}
                      const employeeCell = (
                        <td key={`emp-${employee.id}`} style={{ padding: 8, borderBottom: '1px solid #f0f0f0', textAlign: isRtl ? 'right' : 'left' }}>
                          {employee.id.startsWith('temp-') ? (
                            <Input
                              size="small"
                              placeholder="Employee name"
                              value={`${employee.firstName} ${employee.lastName}`.trim()}
                              onChange={e => {
                                const [firstName, ...lastNameParts] = e.target.value.split(' ')
                                const lastName = lastNameParts.join(' ')
                                setEmployees(prev => prev.map(emp => (emp.id === employee.id ? { ...emp, firstName: firstName || '', lastName: lastName || '' } : emp)))
                              }}
                              style={{ width: 120 }}
                            />
                          ) : (
                            <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                              <Text strong>{getDisplayName(employee, employees)}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>{employee.position}</Text>
                            </div>
                          )}
                        </td>
                      )

                      const dayCells = getWeekDaysForDisplay(scheduleWeek).map(day => {
                        const dayKey = formatDayKey(day)
                        const daySchedule = employeeSchedule[dayKey] || { startTime: '', endTime: '' }
                        return (
                          <td key={`${employee.id}-${dayKey}`} style={{ padding: 8, borderBottom: '1px solid #f0f0f0', textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                              <Input
                                size="small"
                                type="time"
                                value={daySchedule.startTime}
                                onChange={e => updateEmployeeSchedule(employee.id, dayKey, 'startTime', e.target.value)}
                                style={{ width: 100 }}
                                placeholder="Start"
                              />
                              <Input
                                size="small"
                                type="time"
                                value={daySchedule.endTime}
                                onChange={e => updateEmployeeSchedule(employee.id, dayKey, 'endTime', e.target.value)}
                                style={{ width: 100 }}
                                placeholder="End"
                              />
                            </div>
                          </td>
                        )
                      })

                      const actionsCell = (
                        <td key={`act-${employee.id}`} style={{ padding: 8, borderBottom: '1px solid #f0f0f0', textAlign: isRtl ? 'left' : 'right' }}>
                          {employee.id.startsWith('temp-') && (
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeEmployeeFromSchedule(employee.id)} />
                          )}
                        </td>
                      )

                      return (
                        <tr key={employee.id}>
                          {isRtl ? (
                            <>
                              {actionsCell}
                              {dayCells}
                              {employeeCell}
                            </>
                          ) : (
                            <>
                              {employeeCell}
                              {dayCells}
                              {actionsCell}
                            </>
                          )}
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* Employee Dialog */}
      <Modal
        open={openEmployeeDialog}
        onCancel={() => setOpenEmployeeDialog(false)}
        onOk={handleSaveEmployee}
        title={editingEmployee ? t('edit_employee') : t('add_new_employee')}
        width={600}
      >
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12}>
            <div>
              <Text>{t('first_name')}</Text>
              <Input
                value={newEmployee.firstName}
                onChange={e => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text>{t('last_name')}</Text>
              <Input
                value={newEmployee.lastName}
                onChange={e => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24}>
            <div>
              <Text>{t('email')}</Text>
              <Input
                type="email"
                value={newEmployee.email}
                onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24}>
            <div>
              <Text>{t('phone')}</Text>
              <Input
                value={newEmployee.phone}
                onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text>{t('position')}</Text>
              <Input
                value={newEmployee.position}
                onChange={e => setNewEmployee({ ...newEmployee, position: e.target.value })}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text>{t('hourly_rate')}</Text>
              <Input
                type="number"
                step="0.01"
                value={newEmployee.hourlyRate}
                onChange={e => setNewEmployee({ ...newEmployee, hourlyRate: parseFloat(e.target.value) })}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
        </Row>
      </Modal>

      {/* Shift Dialog */}
      <Modal
        open={openShiftDialog}
        onCancel={() => {
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
        onOk={handleSaveShift}
        title={editingShift ? t('edit_shift') : t('schedule_new_shift')}
        width={600}
      >
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24}>
            <div>
              <Text>{t('employee')}</Text>
              <Select
                value={newShift.employeeId}
                onChange={handleEmployeeSelection}
                style={{ width: '100%', marginTop: 4 }}
                placeholder={t('select_employee')}
              >
                {employees.map(employee => (
                  <Option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} - {employee.position}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col xs={24}>
            <div>
              <Text>{t('date')}</Text>
              <Input
                type="date"
                value={newShift.date instanceof Date ? newShift.date.toISOString().split('T')[0] : newShift.date}
                onChange={e => setNewShift({ ...newShift, date: new Date(e.target.value) })}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text>{t('start_time')}</Text>
              <Input
                type="time"
                value={newShift.startTime}
                onChange={e => handleTimeChange('startTime', e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text>{t('end_time')}</Text>
              <Input
                type="time"
                value={newShift.endTime}
                onChange={e => handleTimeChange('endTime', e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text>{t('hours_worked')}</Text>
              <Input
                type="number"
                step="0.25"
                value={newShift.hoursWorked || 0}
                disabled
                style={{ marginTop: 4 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{t('auto_calculated_from_times')}</Text>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div>
              <Text>{t('role')}</Text>
              <Input
                value={newShift.role}
                disabled
                style={{ marginTop: 4 }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>{t('auto_populated_from_position')}</Text>
            </div>
          </Col>
        </Row>
      </Modal>

      {/* Operating Days Dialog */}
      <Modal
        open={openDaysDialog}
        onCancel={() => setOpenDaysDialog(false)}
        onOk={() => setOpenDaysDialog(false)}
        title={t('configure_operating_days')}
        width={500}
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          {t('select_days_business_operates')}
        </Text>
        <Space direction="vertical">
          {[
            { day: 0, label: t('sunday') },
            { day: 1, label: t('monday') },
            { day: 2, label: t('tuesday') },
            { day: 3, label: t('wednesday') },
            { day: 4, label: t('thursday') },
            { day: 5, label: t('friday') },
            { day: 6, label: t('saturday') }
          ].map(({ day, label }) => (
            <Checkbox
              key={day}
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
            >
              {label}
            </Checkbox>
          ))}
        </Space>
        {operatingDays.length === 0 && (
          <Card style={{ marginTop: 16, backgroundColor: '#fffbe6', border: '1px solid #ffe58f' }}>
            <Text>{t('select_at_least_one_day')}</Text>
          </Card>
        )}
      </Modal>
    </div>
  )
}
