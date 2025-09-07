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
  Tab,
  Tabs,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Route as RouteIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { Location, Route } from '../types';

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

export default function Logistics() {
  const [tabValue, setTabValue] = useState(0);
  const [openLocationDialog, setOpenLocationDialog] = useState(false);
  const [openRouteDialog, setOpenRouteDialog] = useState(false);

  const [locations, setLocations] = useState<Location[]>([
    {
      id: '1',
      name: 'Downtown Park',
      address: '123 Main St, Downtown',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      type: 'regular',
      permitsRequired: ['Food Vendor', 'Park Permit']
    },
    {
      id: '2',
      name: 'Business District',
      address: '456 Corporate Ave',
      coordinates: { lat: 40.7580, lng: -73.9855 },
      type: 'regular',
      permitsRequired: ['Food Vendor']
    },
    {
      id: '3',
      name: 'Music Festival',
      address: 'Central Park, Event Area',
      coordinates: { lat: 40.7812, lng: -73.9665 },
      type: 'event',
      permitsRequired: ['Food Vendor', 'Event Permit', 'Special License']
    }
  ]);

  const [routes, setRoutes] = useState<Route[]>([
    {
      id: '1',
      name: 'Daily Downtown Route',
      date: new Date(),
      locations: [locations[0], locations[1]],
      estimatedRevenue: 1500,
      actualRevenue: 1247,
      expenses: 245,
      status: 'completed'
    },
    {
      id: '2',
      name: 'Weekend Festival',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      locations: [locations[2]],
      estimatedRevenue: 2500,
      expenses: 350,
      status: 'planned'
    }
  ]);

  const [newLocation, setNewLocation] = useState<Partial<Location>>({
    name: '',
    address: '',
    coordinates: { lat: 0, lng: 0 },
    type: 'regular',
    permitsRequired: []
  });

  const [newRoute, setNewRoute] = useState<Partial<Route>>({
    name: '',
    date: new Date(),
    locations: [],
    estimatedRevenue: 0,
    expenses: 0,
    status: 'planned'
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSaveLocation = () => {
    const location: Location = {
      ...newLocation as Location,
      id: Date.now().toString()
    };
    setLocations([...locations, location]);
    
    setNewLocation({
      name: '',
      address: '',
      coordinates: { lat: 0, lng: 0 },
      type: 'regular',
      permitsRequired: []
    });
    setOpenLocationDialog(false);
  };

  const handleSaveRoute = () => {
    const route: Route = {
      ...newRoute as Route,
      id: Date.now().toString(),
      locations: locations.filter(loc => 
        newRoute.locations?.some(routeLoc => routeLoc.id === loc.id)
      )
    };
    setRoutes([...routes, route]);
    
    setNewRoute({
      name: '',
      date: new Date(),
      locations: [],
      estimatedRevenue: 0,
      expenses: 0,
      status: 'planned'
    });
    setOpenRouteDialog(false);
  };

  const handleDeleteLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
  };

  const handleDeleteRoute = (id: string) => {
    setRoutes(routes.filter(route => route.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'primary';
      case 'active': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'regular': return 'primary';
      case 'event': return 'secondary';
      case 'special': return 'warning';
      default: return 'default';
    }
  };

  const handlePermitsChange = (value: string) => {
    const permits = value.split(',').map(p => p.trim()).filter(p => p);
    setNewLocation({ ...newLocation, permitsRequired: permits });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Logistics Management</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RouteIcon />}
            onClick={() => setOpenRouteDialog(true)}
            sx={{ mr: 1 }}
          >
            Plan Route
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenLocationDialog(true)}
          >
            Add Location
          </Button>
        </Box>
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Locations" />
          <Tab label="Routes" />
          <Tab label="Schedule" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            {locations.map((location) => (
              <Grid item xs={12} sm={6} md={4} key={location.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">
                          {location.name}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={() => handleDeleteLocation(location.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {location.address}
                    </Typography>
                    
                    <Chip
                      label={location.type}
                      color={getTypeColor(location.type)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    
                    <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                      Coordinates: {location.coordinates.lat}, {location.coordinates.lng}
                    </Typography>
                    
                    {location.permitsRequired.length > 0 && (
                      <Box>
                        <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                          Required Permits:
                        </Typography>
                        {location.permitsRequired.map((permit, index) => (
                          <Chip
                            key={index}
                            label={permit}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
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
                  <TableCell>Route Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Locations</TableCell>
                  <TableCell>Est. Revenue</TableCell>
                  <TableCell>Actual Revenue</TableCell>
                  <TableCell>Expenses</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell>{route.name}</TableCell>
                    <TableCell>{route.date.toLocaleDateString()}</TableCell>
                    <TableCell>
                      {route.locations.map((loc, index) => (
                        <Chip
                          key={loc.id}
                          label={loc.name}
                          size="small"
                          sx={{ mr: 0.5 }}
                        />
                      ))}
                    </TableCell>
                    <TableCell>${route.estimatedRevenue}</TableCell>
                    <TableCell>
                      {route.actualRevenue ? `$${route.actualRevenue}` : '-'}
                    </TableCell>
                    <TableCell>${route.expenses}</TableCell>
                    <TableCell>
                      <Chip
                        label={route.status}
                        color={getStatusColor(route.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleDeleteRoute(route.id)}>
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
          <Typography variant="h6" sx={{ mb: 2 }}>
            Upcoming Schedule
          </Typography>
          <List>
            {routes
              .filter(route => route.date >= new Date())
              .sort((a, b) => a.date.getTime() - b.date.getTime())
              .map((route) => (
                <ListItem key={route.id} divider>
                  <EventIcon sx={{ mr: 2 }} />
                  <ListItemText
                    primary={route.name}
                    secondary={`${route.date.toLocaleDateString()} - ${route.locations.map(l => l.name).join(', ')}`}
                  />
                  <Chip
                    label={route.status}
                    color={getStatusColor(route.status)}
                    size="small"
                  />
                </ListItem>
              ))}
          </List>
        </TabPanel>
      </Paper>

      {/* Location Dialog */}
      <Dialog open={openLocationDialog} onClose={() => setOpenLocationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Location</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location Name"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={newLocation.address}
                onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                inputProps={{ step: "0.000001" }}
                value={newLocation.coordinates?.lat}
                onChange={(e) => setNewLocation({ 
                  ...newLocation, 
                  coordinates: { 
                    ...newLocation.coordinates!, 
                    lat: parseFloat(e.target.value) 
                  } 
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                inputProps={{ step: "0.000001" }}
                value={newLocation.coordinates?.lng}
                onChange={(e) => setNewLocation({ 
                  ...newLocation, 
                  coordinates: { 
                    ...newLocation.coordinates!, 
                    lng: parseFloat(e.target.value) 
                  } 
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Type"
                value={newLocation.type}
                onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value as any })}
                SelectProps={{ native: true }}
              >
                <option value="regular">Regular</option>
                <option value="event">Event</option>
                <option value="special">Special</option>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Required Permits (comma separated)"
                value={newLocation.permitsRequired?.join(', ') || ''}
                onChange={(e) => handlePermitsChange(e.target.value)}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLocationDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveLocation} variant="contained">Add Location</Button>
        </DialogActions>
      </Dialog>

      {/* Route Dialog */}
      <Dialog open={openRouteDialog} onClose={() => setOpenRouteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Plan New Route</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Route Name"
                value={newRoute.name}
                onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={newRoute.date?.toISOString().split('T')[0]}
                onChange={(e) => setNewRoute({ ...newRoute, date: new Date(e.target.value) })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Revenue"
                type="number"
                value={newRoute.estimatedRevenue}
                onChange={(e) => setNewRoute({ ...newRoute, estimatedRevenue: parseFloat(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Estimated Expenses"
                type="number"
                value={newRoute.expenses}
                onChange={(e) => setNewRoute({ ...newRoute, expenses: parseFloat(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRouteDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveRoute} variant="contained">Create Route</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}