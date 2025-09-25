import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Psychology as AIIcon,
  Assessment as AnalysisIcon,
  ShoppingCart as OrderIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Add as AddIcon
} from '@mui/icons-material';
// Using native file input instead of react-dropzone
import { useTranslation } from 'react-i18next';
import Papa from 'papaparse';
import { MenuItem as MenuItemType, Order, OrderItem } from '../../types';
import { menuItemsService, ordersService } from '../../services/supabaseService';

interface SalesData {
  productName: string;
  averagePrice: number;
  discount: number;
  discountAmount: number;
  quantitySold: number;
  totalRevenue: number;
}

interface ParsedData {
  businessName: string;
  businessNumber: string;
  dateRange: string;
  salesData: SalesData[];
  totalRevenue: number;
  totalQuantity: number;
}

interface ProductMapping {
  originalName: string;
  mappedMenuItem?: MenuItemType;
  confidence: number;
  suggestions: MenuItemType[];
  manualOverride?: MenuItemType;
  shouldCreateNewItem?: boolean;
  newItemData?: {
    name: string;
    price: number;
    category: string;
    description: string;
  };
}

interface GeneratedOrder {
  items: OrderItem[];
  total: number;
  orderTime: Date;
  estimatedCustomerType: string;
}

interface AIOrderImporterProps {
  open: boolean;
  onClose: () => void;
  onOrdersImported: (orders: Order[]) => void;
}

const AIOrderImporter: React.FC<AIOrderImporterProps> = ({
  open,
  onClose,
  onOrdersImported
}) => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [productMappings, setProductMappings] = useState<ProductMapping[]>([]);
  const [generatedOrders, setGeneratedOrders] = useState<GeneratedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSettings, setImportSettings] = useState({
    generateRealisticOrders: true,
    orderDistributionHours: 8, // spread orders over 8 hours
    averageItemsPerOrder: 2.5,
    applyDiscounts: true
  });

  const steps = [
    'Upload & Parse File',
    'AI Product Mapping',
    'Order Generation',
    'Review & Import'
  ];

  // Load menu items on component mount
  React.useEffect(() => {
    if (open) {
      loadMenuItems();
    }
  }, [open]);

  const loadMenuItems = async () => {
    try {
      const items = await menuItemsService.getAll();
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu items:', error);
      setError('Failed to load menu items');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const parsed = parsePaymentProviderCSV(text);
      setParsedData(parsed);
      setActiveStep(1);
      
      // Start AI mapping
      await performAIMapping(parsed.salesData);
    } catch (error) {
      console.error('Error parsing file:', error);
      setError('Failed to parse file. Please check the format.');
    } finally {
      setLoading(false);
    }
  };

  const parsePaymentProviderCSV = (csvText: string): ParsedData => {
    // Parse Hebrew CSV data
    const lines = csvText.split('\n').filter(line => line.trim());
    
    // Extract business info - handle different formats
    const businessName = lines[1]?.split(',')[1]?.replace(/"/g, '') || '';
    const businessNumber = lines[2]?.split(',')[1]?.replace(/"/g, '') || '';
    
    // Look for date line - it could be in line 3 or 4
    let dateRange = '';
    for (let i = 3; i <= 4; i++) {
      if (lines[i] && lines[i].includes('תאריך')) {
        dateRange = lines[i].split(',').slice(1).join(' - ').replace(/"/g, '').trim();
        break;
      }
    }

    // Find data rows (skip header and metadata) - look for the header with columns
    const dataStartIndex = lines.findIndex(line => 
      line.includes('מוצרים / מחלקות') || 
      line.includes('Products') ||
      line.includes('מחיר מכירה ממוצע') ||
      line.includes('כמות שנמכרה')
    );
    
    if (dataStartIndex === -1) {
      throw new Error('Could not find product data in CSV');
    }

    const salesData: SalesData[] = [];
    let totalRevenue = 0;
    let totalQuantity = 0;

    // Parse each product line
    for (let i = dataStartIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('סה״כ') || line.includes('Total')) break;

      // Manual CSV parsing to handle Hebrew text and special characters better
      const cleanLine = line.replace(/‎/g, '').replace(/"/g, ''); // Remove Unicode LTR marks and quotes
      const columns = cleanLine.split(',').map(col => col.trim());
      
      if (columns.length >= 6) {
        const productName = columns[0]?.trim();
        const averagePrice = parseFloat(columns[1]?.replace(/[^\d.]/g, '') || '0');
        const discount = parseFloat(columns[2]?.replace(/[^\d.]/g, '') || '0');
        const discountAmount = parseFloat(columns[3]?.replace(/[^\d.]/g, '') || '0');
        const quantitySold = parseFloat(columns[4]?.replace(/[^\d.]/g, '') || '0');
        const revenue = parseFloat(columns[5]?.replace(/[^\d.]/g, '') || '0');

        if (productName && productName.length > 0 && quantitySold > 0) {
          console.log(`Parsing product: "${productName}", quantity: ${quantitySold}, revenue: ${revenue}`);
          salesData.push({
            productName,
            averagePrice,
            discount,
            discountAmount,
            quantitySold,
            totalRevenue: revenue
          });
          
          totalRevenue += revenue;
          totalQuantity += quantitySold;
        } else {
          console.log(`Skipped line ${i}: productName="${productName}", quantity=${quantitySold}, columns:`, columns);
        }
      }
    }

    // Sort by quantity to verify parsing
    console.log('=== Parsing Results Summary ===');
    console.log(`Total products parsed: ${salesData.length}`);
    console.log(`Total quantity: ${totalQuantity}`);
    console.log(`Total revenue: ${totalRevenue}`);
    
    const sortedByQuantity = [...salesData].sort((a, b) => b.quantitySold - a.quantitySold);
    console.log('Top 5 products by quantity:');
    sortedByQuantity.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. "${item.productName}" - ${item.quantitySold} units`);
    });
    console.log('===========================');

    return {
      businessName,
      businessNumber,
      dateRange,
      salesData,
      totalRevenue,
      totalQuantity
    };
  };

  const performAIMapping = async (salesData: SalesData[]) => {
    setLoading(true);
    
    try {
      console.log(`Starting AI mapping for ${salesData.length} products...`);
      const mappings: ProductMapping[] = [];

      for (let i = 0; i < salesData.length; i++) {
        const product = salesData[i];
        console.log(`Processing ${i + 1}/${salesData.length}: "${product.productName}" (${product.quantitySold} units)`);
        const mapping = await mapProductToMenuItem(product.productName, salesData);
        mappings.push(mapping);
      }

      console.log(`Completed mapping. Total mappings: ${mappings.length}`);
      console.log('Mappings summary:', mappings.map(m => ({
        original: m.originalName,
        mapped: m.mappedMenuItem?.name || 'None',
        confidence: m.confidence
      })));

      setProductMappings(mappings);
      setActiveStep(2);
      
      // Auto-generate orders
      await generateOrders(mappings, salesData);
    } catch (error) {
      console.error('AI mapping failed:', error);
      setError('AI mapping failed. Please check mappings manually.');
    } finally {
      setLoading(false);
    }
  };

  const mapProductToMenuItem = async (productName: string, salesData: SalesData[]): Promise<ProductMapping> => {
    // Simple AI-like matching based on text similarity and keywords
    const normalizedProduct = productName.toLowerCase().trim();
    
    console.log(`Mapping product: "${productName}" (normalized: "${normalizedProduct}")`);
    console.log(`Available menu items:`, menuItems.map(item => item.name));
    
    const suggestions = menuItems
      .map(item => ({
        item,
        score: calculateSimilarity(normalizedProduct, item.name.toLowerCase())
      }))
      .filter(({ score }) => score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ item }) => item);

    const bestMatch = suggestions[0];
    const confidence = suggestions.length > 0 ? 
      calculateSimilarity(normalizedProduct, bestMatch.name.toLowerCase()) : 0;

    console.log(`  Suggestions for "${productName}":`, suggestions.map(s => s.name));
    console.log(`  Best match: ${bestMatch?.name || 'None'}, confidence: ${confidence}`);

    // For products with low confidence, suggest creating a new menu item
    const shouldCreate = confidence < 0.5 && suggestions.length === 0;
    let newItemData;
    
    if (shouldCreate) {
      // Extract price from sales data to suggest for new item
      const salesItem = salesData.find(s => s.productName === productName);
      const suggestedPrice = salesItem?.averagePrice || 0;
      
      // Categorize based on Hebrew keywords
      let category = 'Other';
      const lowerName = productName.toLowerCase();
      if (lowerName.includes('קפה') || lowerName.includes('אספרסו') || lowerName.includes('אמריקנו') || lowerName.includes('הפוך')) {
        category = 'Coffee';
      } else if (lowerName.includes('מאפין') || lowerName.includes('עוגיות') || lowerName.includes('קראוסון') || lowerName.includes('רוגלך')) {
        category = 'Pastries';
      } else if (lowerName.includes('כריך') || lowerName.includes('בייגל') || lowerName.includes('בריוש')) {
        category = 'Sandwiches';
      } else if (lowerName.includes('מיץ') || lowerName.includes('טבעי') || lowerName.includes('מים') || lowerName.includes('סודה')) {
        category = 'Beverages';
      }
      
      newItemData = {
        name: productName,
        price: suggestedPrice,
        category,
        description: `Imported from sales data - ${productName}`
      };
    }

    return {
      originalName: productName,
      mappedMenuItem: confidence > 0.7 ? bestMatch : undefined,
      confidence,
      suggestions,
      shouldCreateNewItem: shouldCreate,
      newItemData
    };
  };

  const calculateSimilarity = (str1: string, str2: string): number => {
    // Simple similarity calculation based on common words and length
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    let commonWords = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.includes(word2) || word2.includes(word1)) {
          commonWords++;
          break;
        }
      }
    }
    
    // Also check for Hebrew/English variations and common coffee/food terms
    const foodKeywords = {
      'קפה': ['coffee', 'cafe'],
      'קר': ['cold', 'iced'],
      'חם': ['hot', 'warm'],
      'אמריקנו': ['americano'],
      'אספרסו': ['espresso'],
      'הפוך': ['cappuccino', 'latte'],
      'מאפין': ['muffin'],
      'עוגיות': ['cookies', 'cookie'],
      'כריך': ['sandwich'],
      'שוקולד': ['chocolate']
    };

    for (const [hebrew, english] of Object.entries(foodKeywords)) {
      if (str1.includes(hebrew) && english.some(eng => str2.includes(eng))) {
        commonWords += 2;
      }
      if (str2.includes(hebrew) && english.some(eng => str1.includes(eng))) {
        commonWords += 2;
      }
    }

    return Math.min(commonWords / Math.max(words1.length, words2.length), 1);
  };

  const generateOrders = async (mappings: ProductMapping[], salesData: SalesData[]) => {
    setLoading(true);
    
    try {
      const orders: GeneratedOrder[] = [];
      const baseDate = new Date();
      baseDate.setHours(8, 0, 0, 0); // Start at 8 AM

      // Calculate total orders needed based on average items per order
      const totalItems = salesData.reduce((sum, item) => sum + item.quantitySold, 0);
      const estimatedOrderCount = Math.ceil(totalItems / importSettings.averageItemsPerOrder);

      // Generate realistic order distribution throughout the day
      const orderTimes = generateRealisticOrderTimes(estimatedOrderCount, baseDate, importSettings.orderDistributionHours);

      // Create item pool based on quantities sold
      const itemPool: Array<{ mapping: ProductMapping; salesData: SalesData }> = [];
      mappings.forEach((mapping, index) => {
        const sales = salesData[index];
        for (let i = 0; i < sales.quantitySold; i++) {
          itemPool.push({ mapping, salesData: sales });
        }
      });

      // Shuffle item pool for realistic distribution
      for (let i = itemPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [itemPool[i], itemPool[j]] = [itemPool[j], itemPool[i]];
      }

      // Generate orders
      let itemIndex = 0;
      for (let orderIndex = 0; orderIndex < estimatedOrderCount && itemIndex < itemPool.length; orderIndex++) {
        const orderSize = Math.max(1, Math.round(importSettings.averageItemsPerOrder + (Math.random() - 0.5)));
        const orderItems: OrderItem[] = [];
        let orderTotal = 0;

        for (let i = 0; i < orderSize && itemIndex < itemPool.length; i++) {
          const { mapping, salesData: sales } = itemPool[itemIndex++];
          // Use manual override first, then mapped item, and skip if creating new item
          const menuItem = mapping.manualOverride || mapping.mappedMenuItem;
          
          if (menuItem && !mapping.shouldCreateNewItem) {
            const basePrice = menuItem.price;
            const discountAmount = importSettings.applyDiscounts ? 
              (sales.discountAmount / sales.quantitySold) : 0;
            const finalPrice = Math.max(basePrice - discountAmount, basePrice * 0.1);

            orderItems.push({
              menuItemId: menuItem.id,
              menuItem: {
                name: menuItem.name,
                description: menuItem.description,
                price: menuItem.price
              },
              quantity: 1,
              unitPrice: finalPrice,
              totalPrice: finalPrice
            });
            
            orderTotal += finalPrice;
          }
        }

        if (orderItems.length > 0) {
          orders.push({
            items: orderItems,
            total: orderTotal,
            orderTime: orderTimes[orderIndex],
            estimatedCustomerType: getCustomerType(orderItems)
          });
        }
      }

      setGeneratedOrders(orders);
      setActiveStep(3);
    } catch (error) {
      console.error('Order generation failed:', error);
      setError('Failed to generate orders');
    } finally {
      setLoading(false);
    }
  };

  const generateRealisticOrderTimes = (orderCount: number, baseDate: Date, hours: number): Date[] => {
    const times: Date[] = [];
    const millisecondsInHour = 60 * 60 * 1000;
    const totalMilliseconds = hours * millisecondsInHour;

    // Create realistic distribution (more orders during peak hours)
    const peakHours = [9, 12, 15]; // 9 AM, 12 PM, 3 PM
    
    for (let i = 0; i < orderCount; i++) {
      let timeOffset: number;
      
      if (Math.random() < 0.6) {
        // 60% chance of peak hour order
        const peakHour = peakHours[Math.floor(Math.random() * peakHours.length)];
        const peakStart = (peakHour - 8) * millisecondsInHour;
        timeOffset = peakStart + (Math.random() * millisecondsInHour * 0.5); // ±30 minutes
      } else {
        // Random time throughout the day
        timeOffset = Math.random() * totalMilliseconds;
      }
      
      const orderTime = new Date(baseDate.getTime() + timeOffset);
      times.push(orderTime);
    }

    return times.sort((a, b) => a.getTime() - b.getTime());
  };

  const getCustomerType = (items: OrderItem[]): string => {
    if (items.length === 1) return 'Quick Customer';
    if (items.length >= 3) return 'Family/Group';
    return 'Regular Customer';
  };

  const handleMappingChange = (index: number, menuItem: MenuItemType | null) => {
    const updated = [...productMappings];
    updated[index].manualOverride = menuItem || undefined;
    updated[index].shouldCreateNewItem = false; // Override the create new item option
    setProductMappings(updated);
  };

  const handleCreateNewMenuItem = async (index: number) => {
    const mapping = productMappings[index];
    if (!mapping.newItemData) return;

    try {
      setLoading(true);
      
      // Create the new menu item
      const newMenuItem: Omit<MenuItemType, 'id' | 'businessId' | 'totalIngredientCost' | 'profitMargin'> = {
        name: mapping.newItemData.name,
        description: mapping.newItemData.description,
        price: mapping.newItemData.price,
        category: mapping.newItemData.category,
        isAvailable: true,
        prepTime: 5, // Default 5 minutes
        ingredients: [], // No ingredients for imported items
        allergens: []
      };

      const createdMenuItem = await menuItemsService.create(newMenuItem);
      
      // Update the local menu items list
      setMenuItems(prev => [...prev, createdMenuItem]);
      
      // Update the mapping to use the newly created item
      const updated = [...productMappings];
      updated[index].mappedMenuItem = createdMenuItem;
      updated[index].shouldCreateNewItem = false;
      updated[index].confidence = 1.0; // Perfect match since we created it
      setProductMappings(updated);
      
    } catch (error) {
      console.error('Failed to create menu item:', error);
      setError(`Failed to create menu item: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportOrders = async () => {
    setLoading(true);
    
    try {
      const orders: Order[] = [];
      
      for (let i = 0; i < generatedOrders.length; i++) {
        const generatedOrder = generatedOrders[i];
        const order: Omit<Order, 'id' | 'orderNumber' | 'businessId'> = {
          items: generatedOrder.items,
          total: generatedOrder.total,
          subtotal: generatedOrder.total,
          status: 'completed', // Historical orders are completed
          orderTime: generatedOrder.orderTime,
          location: 'Main Location',
          paymentMethod: 'card',
          paymentStatus: 'completed',
          externalSource: 'payment_provider_import'
        };

        try {
          const createdOrder = await ordersService.create(order);
          orders.push(createdOrder);
        } catch (error) {
          if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint "orders_order_number_key"')) {
            // Add small delay and retry once
            await new Promise(resolve => setTimeout(resolve, 100));
            const createdOrder = await ordersService.create(order);
            orders.push(createdOrder);
          } else {
            throw error;
          }
        }
        
        // Add small delay between orders to prevent race conditions
        if (i < generatedOrders.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      onOrdersImported(orders);
      onClose();
    } catch (error) {
      console.error('Failed to import orders:', error);
      
      // Check if it's an inventory error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('Insufficient inventory')) {
        setError(`Import failed due to insufficient inventory: ${errorMessage.split('Insufficient inventory: ')[1] || errorMessage}. Orders have been imported as "pending" status. You can complete them manually after restocking inventory.`);
      } else {
        setError(`Failed to import orders: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // File input ref for triggering file selection
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setActiveStep(0);
    setParsedData(null);
    setProductMappings([]);
    setGeneratedOrders([]);
    setError(null);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '90vh' } }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AIIcon color="primary" />
          AI-Powered Order Import
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Step 0: File Upload */}
        {activeStep === 0 && (
          <Paper
            onClick={() => fileInputRef.current?.click()}
            sx={{
              p: 4,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: 'grey.300',
              bgcolor: 'background.paper',
              cursor: 'pointer',
              mb: 2,
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover'
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Upload Payment Provider Report
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click to select your CSV/Excel file from your payment provider
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Supports Hebrew and English CSV files
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }}>
              Choose File
            </Button>
          </Paper>
        )}

        {/* Step 1: AI Product Mapping */}
        {activeStep === 1 && parsedData && (
          <Box>
            <Typography variant="h6" gutterBottom>AI Product Mapping</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              AI has analyzed your payment data and mapped products to your menu items. Review and adjust as needed.
            </Alert>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Original Product</TableCell>
                    <TableCell>Quantity Sold</TableCell>
                    <TableCell>Mapped Menu Item</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productMappings.map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell>{mapping.originalName}</TableCell>
                      <TableCell>{parsedData.salesData[index]?.quantitySold}</TableCell>
                      <TableCell>
                        {mapping.mappedMenuItem ? (
                          <Chip 
                            label={mapping.mappedMenuItem.name}
                            color={mapping.confidence > 0.7 ? 'success' : 'warning'}
                            size="small"
                          />
                        ) : mapping.shouldCreateNewItem ? (
                          <Chip 
                            label="Will create new item" 
                            color="info" 
                            size="small"
                            icon={<AddIcon />}
                          />
                        ) : (
                          <Chip label="No match" color="error" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={mapping.confidence > 0.7 ? 'success.main' : 'warning.main'}>
                          {Math.round(mapping.confidence * 100)}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {mapping.shouldCreateNewItem ? (
                          <Box>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              startIcon={<AddIcon />}
                              onClick={() => handleCreateNewMenuItem(index)}
                              sx={{ mb: 1 }}
                            >
                              Create "₪{mapping.newItemData?.price}" - {mapping.newItemData?.category}
                            </Button>
                            <Typography variant="caption" display="block" color="text.secondary">
                              Or select existing:
                            </Typography>
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                              <Select
                                value={mapping.manualOverride?.id || ''}
                                onChange={(e) => {
                                  const menuItem = menuItems.find(item => item.id === e.target.value);
                                  handleMappingChange(index, menuItem || null);
                                }}
                                displayEmpty
                              >
                                <MenuItem value="">Select existing item</MenuItem>
                                {menuItems.map(item => (
                                  <MenuItem key={item.id} value={item.id}>
                                    {item.name} - ₪{item.price}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Box>
                        ) : (
                          <FormControl size="small" sx={{ minWidth: 200 }}>
                            <Select
                              value={mapping.manualOverride?.id || mapping.mappedMenuItem?.id || ''}
                              onChange={(e) => {
                                const menuItem = menuItems.find(item => item.id === e.target.value);
                                handleMappingChange(index, menuItem || null);
                              }}
                              displayEmpty
                            >
                              <MenuItem value="">Select menu item</MenuItem>
                              {menuItems.map(item => (
                                <MenuItem key={item.id} value={item.id}>
                                  {item.name} - ₪{item.price}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Step 2: Order Generation Settings */}
        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Order Generation Settings</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Configure how AI should generate individual orders from your sales data.
            </Alert>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Generation Settings</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={importSettings.generateRealisticOrders}
                      onChange={(e) => setImportSettings(prev => ({ ...prev, generateRealisticOrders: e.target.checked }))}
                    />
                  }
                  label="Generate realistic order patterns"
                />
                
                <TextField
                  label="Average items per order"
                  type="number"
                  value={importSettings.averageItemsPerOrder}
                  onChange={(e) => setImportSettings(prev => ({ ...prev, averageItemsPerOrder: parseFloat(e.target.value) }))}
                  inputProps={{ min: 1, max: 10, step: 0.1 }}
                />
                
                <TextField
                  label="Distribution hours"
                  type="number"
                  value={importSettings.orderDistributionHours}
                  onChange={(e) => setImportSettings(prev => ({ ...prev, orderDistributionHours: parseInt(e.target.value) }))}
                  inputProps={{ min: 1, max: 24 }}
                  helperText="Spread orders over this many hours"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={importSettings.applyDiscounts}
                      onChange={(e) => setImportSettings(prev => ({ ...prev, applyDiscounts: e.target.checked }))}
                    />
                  }
                  label="Apply discounts from payment data"
                />
              </Box>
            </Paper>

            {parsedData && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Import Summary</Typography>
                <List dense>
                  <ListItem>
                    <ListItemText primary={`Business: ${parsedData.businessName}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary={`Date Range: ${parsedData.dateRange}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary={`Total Products: ${parsedData.salesData.length}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary={`Total Items Sold: ${parsedData.totalQuantity}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary={`Total Revenue: ₪${parsedData.totalRevenue.toFixed(2)}`} />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={`Estimated Orders: ~${Math.ceil(parsedData.totalQuantity / importSettings.averageItemsPerOrder)}`}
                      secondary="Based on your settings"
                    />
                  </ListItem>
                </List>
              </Paper>
            )}
          </Box>
        )}

        {/* Step 3: Review Generated Orders */}
        {activeStep === 3 && generatedOrders.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Generated Orders Preview</Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              AI has generated {generatedOrders.length} realistic orders from your sales data.
            </Alert>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Import Summary</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                <Box>
                  <Typography variant="h4" color="primary.main">
                    {generatedOrders.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Orders Generated
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="success.main">
                    ₪{generatedOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="info.main">
                    {(generatedOrders.reduce((sum, order) => sum + order.items.length, 0) / generatedOrders.length).toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Items/Order
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Order Time</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell>Customer Type</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generatedOrders.slice(0, 50).map((order, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {order.orderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {order.items.length} items
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {order.items.map((item, itemIndex) => {
                              const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                              return menuItem ? `${item.quantity}x ${menuItem.name}` : `${item.quantity}x Unknown`;
                            }).join(', ')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={order.estimatedCustomerType} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        ₪{order.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            {generatedOrders.length > 50 && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                Showing first 50 orders. {generatedOrders.length - 50} more will be imported.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {activeStep > 0 && (
          <Button onClick={handleReset} color="secondary">
            Start Over
          </Button>
        )}
        {activeStep === 1 && (
          <Button onClick={() => generateOrders(productMappings, parsedData?.salesData || [])} variant="contained">
            Generate Orders
          </Button>
        )}
        {activeStep === 3 && (
          <Button onClick={handleImportOrders} variant="contained" disabled={loading}>
            Import {generatedOrders.length} Orders
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AIOrderImporter;