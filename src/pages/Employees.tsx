import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Tab,
  Tabs,
  IconButton,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Employee, Shift } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Employees() {
  const [tabValue, setTabValue] = useState(0);
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false);
  const [openShiftDialog, setOpenShiftDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-0123',
      position: 'Head Chef',
      hourlyRate: 25.00,
      hireDate: new Date('2023-01-15'),
      isActive: true
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '555-0124',
      position: 'Cashier',
      hourlyRate: 18.00,
      hireDate: new Date('2023-03-20'),
      isActive: true
    }
  ]);

  const [shifts, setShifts] = useState<Shift[]>([
    {
      id: '1',
      employeeId: '1',
      date: new Date(),
      startTime: '09:00',
      endTime: '17:00',
      hoursWorked: 8,
      role: 'Head Chef',
      location: 'Downtown Park'
    },
    {
      id: '2',
      employeeId: '2',
      date: new Date(),
      startTime: '10:00',
      endTime: '18:00',
      hoursWorked: 8,
      role: 'Cashier',
      location: 'Downtown Park'
    }
  ]);

  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    hourlyRate: 0,
    hireDate: new Date(),
    isActive: true
  });

  const [newShift, setNewShift] = useState<Partial<Shift>>({
    employeeId: '',
    date: new Date(),
    startTime: '',
    endTime: '',
    hoursWorked: 0,
    role: '',
    location: ''
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveEmployee = () => {
    if (editingEmployee) {
      setEmployees(employees.map(emp => 
        emp.id === editingEmployee.id ? { ...newEmployee as Employee, id: editingEmployee.id } : emp
      ));
    } else {
      const employee: Employee = {
        ...newEmployee as Employee,
        id: Date.now().toString()
      };
      setEmployees([...employees, employee]);
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
    });
    setEditingEmployee(null);
    setOpenEmployeeDialog(false);
  };

  const handleEditEmployee = (employee: Employee) => {
    setNewEmployee(employee);
    setEditingEmployee(employee);
    setOpenEmployeeDialog(true);
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  const handleSaveShift = () => {
    const shift: Shift = {
      ...newShift as Shift,
      id: Date.now().toString()
    };
    setShifts([...shifts, shift]);
    
    setNewShift({
      employeeId: '',
      date: new Date(),
      startTime: '',
      endTime: '',
      hoursWorked: 0,
      role: '',
      location: ''
    });
    setOpenShiftDialog(false);
  };

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  };

  const calculateWeeklyHours = (employeeId: string) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    return shifts
      .filter(shift => 
        shift.employeeId === employeeId && 
        shift.date >= weekStart
      )
      .reduce((total, shift) => total + shift.hoursWorked, 0);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Employee Management</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<ScheduleIcon />}
            onClick={() => setOpenShiftDialog(true)}
            sx={{ mr: 1 }}
          >
            Add Shift
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenEmployeeDialog(true)}
          >
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
            {employees.map((employee) => (
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
                      This Week: {calculateWeeklyHours(employee.id)} hours
                    </Typography>
                    
                    <Chip
                      label={employee.isActive ? 'Active' : 'Inactive'}
                      color={employee.isActive ? 'success' : 'default'}
                      size="small"
                    />
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
                </TableRow>
              </TableHead>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>{getEmployeeName(shift.employeeId)}</TableCell>
                    <TableCell>{shift.date.toLocaleDateString()}</TableCell>
                    <TableCell>{shift.startTime}</TableCell>
                    <TableCell>{shift.endTime}</TableCell>
                    <TableCell>{shift.hoursWorked}</TableCell>
                    <TableCell>{shift.role}</TableCell>
                    <TableCell>{shift.location}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6">Payroll Summary</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Hours This Week</TableCell>
                  <TableCell>Hourly Rate</TableCell>
                  <TableCell>Weekly Pay</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => {
                  const weeklyHours = calculateWeeklyHours(employee.id);
                  const weeklyPay = weeklyHours * employee.hourlyRate;
                  return (
                    <TableRow key={employee.id}>
                      <TableCell>{employee.firstName} {employee.lastName}</TableCell>
                      <TableCell>{weeklyHours}</TableCell>
                      <TableCell>${employee.hourlyRate.toFixed(2)}</TableCell>
                      <TableCell>${weeklyPay.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Employee Dialog */}
      <Dialog open={openEmployeeDialog} onClose={() => setOpenEmployeeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={newEmployee.firstName}
                onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={newEmployee.lastName}
                onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={newEmployee.phone}
                onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position"
                value={newEmployee.position}
                onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hourly Rate"
                type="number"
                inputProps={{ step: "0.01" }}
                value={newEmployee.hourlyRate}
                onChange={(e) => setNewEmployee({ ...newEmployee, hourlyRate: parseFloat(e.target.value) })}
              />
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
      <Dialog open={openShiftDialog} onClose={() => setOpenShiftDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule New Shift</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Employee"
                value={newShift.employeeId}
                onChange={(e) => setNewShift({ ...newShift, employeeId: e.target.value })}
                SelectProps={{ native: true }}
              >
                <option value="">Select Employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={newShift.startTime}
                onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={newShift.endTime}
                onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hours Worked"
                type="number"
                inputProps={{ step: "0.5" }}
                value={newShift.hoursWorked}
                onChange={(e) => setNewShift({ ...newShift, hoursWorked: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Role"
                value={newShift.role}
                onChange={(e) => setNewShift({ ...newShift, role: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={newShift.location}
                onChange={(e) => setNewShift({ ...newShift, location: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShiftDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveShift} variant="contained">Schedule Shift</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}