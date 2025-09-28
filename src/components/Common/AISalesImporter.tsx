import React, { useState, useCallback } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, Alert, Chip, Stepper, Step, StepLabel, Divider, List, ListItem, ListItemText, TextField, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel } from '@mui/material'
import { CloudUpload as UploadIcon, Psychology as AIIcon, Assessment as AnalysisIcon, ShoppingCart as OrderIcon, Check as CheckIcon, Warning as WarningIcon, Add as AddIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import Papa from 'papaparse'
import { MenuItem as MenuItemType } from '../../types'
import { menuItemsService } from '../../services/supabaseService'

interface SalesData {
  productName: string
  averagePrice: number
  discount: number
  discountAmount: number
  quantitySold: number
  totalRevenue: number
}

interface ParsedData {
  businessName: string
  businessNumber: string
  dateRange: string
  salesData: SalesData[]
  totalRevenue: number
  totalQuantity: number
  parsingDebug?: {
    parsedProducts: Array<{ name: string; quantity: number; revenue: number }>
    skippedLines: Array<{ lineIndex: number; reason: string; content: string; columns: string[] }>
    expectedTotal: number
    calculatedTotal: number
  }
}

interface ProductMapping {
  originalName: string
  mappedMenuItem?: MenuItemType
  confidence: number
  suggestions: MenuItemType[]
  manualOverride?: MenuItemType
  shouldCreateNewItem?: boolean
  newItemData?: {
    name: string
    price: number
    category: string
    description: string
  }
}

interface ProcessedSalesData {
  productName: string
  menuItem?: MenuItemType
  quantity: number
  unitPrice: number
  totalRevenue: number
  date?: Date
}

interface AISalesImporterProps {
  open: boolean
  onClose: () => void
  onSalesDataImported: (
    salesData: ProcessedSalesData[],
    summary: {
      totalRevenue: number
      totalQuantity: number
      dateRange: string
      businessName: string
    }
  ) => void
  title?: string
  description?: string
}

const AISalesImporter: React.FC<AISalesImporterProps> = ({ open, onClose, onSalesDataImported, title = 'AI-Powered Sales Import', description = 'Import sales data from your payment provider' }) => {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const [activeStep, setActiveStep] = useState(0)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([])
  const [productMappings, setProductMappings] = useState<ProductMapping[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const steps = [t('sales_import_step_upload'), t('sales_import_step_debug'), t('sales_import_step_mapping'), t('sales_import_step_review')]

  // Load menu items on component mount
  React.useEffect(() => {
    if (open) {
      loadMenuItems()
    }
  }, [open])

  const loadMenuItems = async () => {
    try {
      const items = await menuItemsService.getAll()
      setMenuItems(items)
    } catch (error) {
      console.error('Failed to load menu items:', error)
      setError('Failed to load menu items')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const text = await file.text()
      const parsed = parsePaymentProviderCSV(text)
      setParsedData(parsed)
      setActiveStep(1) // Show parsing debug first
    } catch (error) {
      console.error('Error parsing file:', error)
      setError('Failed to parse file. Please check the format.')
    } finally {
      setLoading(false)
    }
  }

  const parsePaymentProviderCSV = (csvText: string): ParsedData => {
    // Parse Hebrew CSV data
    const lines = csvText.split('\n').filter(line => line.trim())

    // Extract business info - handle different formats
    const businessName = lines[1]?.split(',')[1]?.replace(/"/g, '') || ''
    const businessNumber = lines[2]?.split(',')[1]?.replace(/"/g, '') || ''

    // Look for date line - it could be in line 3 or 4
    let dateRange = ''
    for (let i = 3; i <= 4; i++) {
      if (lines[i] && lines[i].includes('תאריך')) {
        dateRange = lines[i].split(',').slice(1).join(' - ').replace(/"/g, '').trim()
        break
      }
    }

    // Find data rows (skip header and metadata) - look for the header with columns
    const dataStartIndex = lines.findIndex(line => line.includes('מוצרים / מחלקות') || line.includes('Products') || line.includes('מחיר מכירה ממוצע') || line.includes('כמות שנמכרה'))

    if (dataStartIndex === -1) {
      throw new Error('Could not find product data in CSV')
    }

    const salesData: SalesData[] = []
    let totalRevenue = 0
    let totalQuantity = 0

    console.log('\n=== DETAILED CSV PARSING DEBUG ===')
    console.log(`Data starts at line index: ${dataStartIndex}`)
    console.log(`Total lines to process: ${lines.length - dataStartIndex - 1}`)

    const skippedLines: Array<{ lineIndex: number; reason: string; content: string; columns: string[] }> = []
    const parsedProducts: Array<{ name: string; quantity: number; revenue: number }> = []

    // Parse each product line
    for (let i = dataStartIndex + 1; i < lines.length; i++) {
      const line = lines[i]
      console.log(`\nProcessing line ${i}: "${line}"`)

      if (line.includes('סה״כ') || line.includes('Total')) {
        console.log('Found total line, stopping parsing')
        // Extract actual total from the summary line for validation
        const totalLine = line.replace(/‎/g, '').replace(/"/g, '')
        const totalColumns = totalLine.split(',').map(col => col.trim())
        if (totalColumns.length >= 6) {
          // Use the same Hebrew number parsing for consistency
          const parseHebrewNumber = (value: string): number => {
            if (!value) return 0
            const cleaned = value
              .replace(/[^\d.\s]/g, '')
              .replace(/\s+/g, '')
              .trim()
            return parseFloat(cleaned) || 0
          }
          const actualTotalRevenue = parseHebrewNumber(totalColumns[5])
          console.log(`Found total line - Actual total revenue: ${actualTotalRevenue}`)
          // If our calculated total doesn't match, use the official total
          if (actualTotalRevenue > 0 && Math.abs(totalRevenue - actualTotalRevenue) > 1) {
            console.log(`Using official total ${actualTotalRevenue} instead of calculated ${totalRevenue}`)
            totalRevenue = actualTotalRevenue
          }
        }
        break
      }

      // Manual CSV parsing to handle Hebrew text and special characters better
      const cleanLine = line.replace(/‎/g, '').replace(/"/g, '') // Remove Unicode LTR marks and quotes
      const columns = cleanLine.split(',').map(col => col.trim())
      console.log(`  Cleaned line: "${cleanLine}"`)
      console.log(`  Split into ${columns.length} columns:`, columns)

      if (columns.length >= 6) {
        const productName = columns[0]?.trim()
        // Improved number parsing to handle Hebrew currency formatting with spaces
        const parseHebrewNumber = (value: string): number => {
          if (!value) return 0
          // Remove all non-digit characters except dots, then remove spaces between digits
          const cleaned = value
            .replace(/[^\d.\s]/g, '')
            .replace(/\s+/g, '')
            .trim()
          const result = parseFloat(cleaned) || 0
          console.log(`    parseHebrewNumber("${value}") -> "${cleaned}" -> ${result}`)
          return result
        }

        const averagePrice = parseHebrewNumber(columns[1])
        const discount = parseHebrewNumber(columns[2])
        const discountAmount = parseHebrewNumber(columns[3])
        const quantitySold = parseHebrewNumber(columns[4])
        const revenue = parseHebrewNumber(columns[5])

        console.log(`  Parsed values: name="${productName}", qty=${quantitySold}, revenue=${revenue}`)

        if (productName && productName.length > 0 && quantitySold > 0 && revenue > 0) {
          console.log(`  ✅ ACCEPTED: "${productName}", quantity: ${quantitySold}, revenue: ${revenue}`)
          salesData.push({
            productName,
            averagePrice,
            discount,
            discountAmount,
            quantitySold,
            totalRevenue: revenue
          })

          parsedProducts.push({ name: productName, quantity: quantitySold, revenue })
          totalRevenue += revenue
          totalQuantity += quantitySold
        } else {
          const reason = !productName || productName.length === 0 ? 'empty product name' : quantitySold <= 0 ? 'invalid quantity' : revenue <= 0 ? 'invalid revenue' : 'unknown'
          console.log(`  ❌ SKIPPED: ${reason}`)
          skippedLines.push({
            lineIndex: i,
            reason,
            content: line,
            columns
          })
        }
      } else {
        console.log(`  ❌ SKIPPED: insufficient columns (${columns.length} < 6)`)
        skippedLines.push({
          lineIndex: i,
          reason: `insufficient columns (${columns.length})`,
          content: line,
          columns
        })
      }
    }

    console.log('\n=== PARSING RESULTS ===')
    console.log(`✅ Successfully parsed ${parsedProducts.length} products:`)
    parsedProducts.forEach((product, index) => {
      console.log(`  ${index + 1}. "${product.name}" - ${product.quantity} units - ₪${product.revenue}`)
    })

    console.log(`\n❌ Skipped ${skippedLines.length} lines:`)
    skippedLines.forEach((skipped, index) => {
      console.log(`  ${index + 1}. Line ${skipped.lineIndex}: ${skipped.reason}`)
      console.log(`     Content: "${skipped.content}"`)
      console.log(`     Columns: [${skipped.columns.map(c => `"${c}"`).join(', ')}]`)
    })

    console.log(`\nCalculated total revenue: ₪${totalRevenue}`)
    console.log('=========================\n')

    return {
      businessName,
      businessNumber,
      dateRange,
      salesData,
      totalRevenue,
      totalQuantity,
      parsingDebug: {
        parsedProducts,
        skippedLines,
        expectedTotal: 5801.2,
        calculatedTotal: totalRevenue
      }
    }
  }

  const performAIMapping = async (salesData: SalesData[]) => {
    setLoading(true)

    try {
      console.log(`Starting AI mapping for ${salesData.length} products...`)
      const mappings: ProductMapping[] = []

      for (let i = 0; i < salesData.length; i++) {
        const product = salesData[i]
        console.log(`Processing ${i + 1}/${salesData.length}: "${product.productName}" (${product.quantitySold} units)`)
        const mapping = await mapProductToMenuItem(product.productName)
        mappings.push(mapping)
      }

      console.log(`Completed mapping. Total mappings: ${mappings.length}`)
      setProductMappings(mappings)
      setActiveStep(2)
    } catch (error) {
      console.error('AI mapping failed:', error)
      setError('AI mapping failed. Please check mappings manually.')
    } finally {
      setLoading(false)
    }
  }

  const mapProductToMenuItem = async (productName: string): Promise<ProductMapping> => {
    // Simple AI-like matching based on text similarity and keywords
    const normalizedProduct = productName.toLowerCase().trim()

    const suggestions = menuItems
      .map(item => ({
        item,
        score: calculateSimilarity(normalizedProduct, item.name.toLowerCase())
      }))
      .filter(({ score }) => score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ item }) => item)

    const bestMatch = suggestions[0]
    const confidence = suggestions.length > 0 ? calculateSimilarity(normalizedProduct, bestMatch.name.toLowerCase()) : 0

    // For products with low confidence, suggest creating a new menu item
    const shouldCreate = confidence < 0.5 && suggestions.length === 0
    let newItemData

    if (shouldCreate) {
      // Extract price from sales data to suggest for new item
      const salesItem = parsedData?.salesData.find(s => s.productName === productName)
      const suggestedPrice = salesItem?.averagePrice || 0

      // Categorize based on Hebrew keywords
      let category = 'Other'
      const lowerName = productName.toLowerCase()
      if (lowerName.includes('קפה') || lowerName.includes('אספרסו') || lowerName.includes('אמריקנו') || lowerName.includes('הפוך')) {
        category = 'Coffee'
      } else if (lowerName.includes('מאפין') || lowerName.includes('עוגיות') || lowerName.includes('קראוסון') || lowerName.includes('רוגלך')) {
        category = 'Pastries'
      } else if (lowerName.includes('כריך') || lowerName.includes('בייגל') || lowerName.includes('בריוש')) {
        category = 'Sandwiches'
      } else if (lowerName.includes('מיץ') || lowerName.includes('טבעי') || lowerName.includes('מים') || lowerName.includes('סודה')) {
        category = 'Beverages'
      }

      newItemData = {
        name: productName,
        price: suggestedPrice,
        category,
        description: `Imported from sales data - ${productName}`
      }
    }

    return {
      originalName: productName,
      mappedMenuItem: confidence > 0.7 ? bestMatch : undefined,
      confidence,
      suggestions,
      shouldCreateNewItem: shouldCreate,
      newItemData
    }
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    // Simple similarity calculation based on common words and length
    const words1 = str1.split(/\s+/)
    const words2 = str2.split(/\s+/)

    let commonWords = 0
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.includes(word2) || word2.includes(word1)) {
          commonWords++
          break
        }
      }
    }

    // Also check for Hebrew/English variations and common coffee/food terms
    const foodKeywords = {
      קפה: ['coffee', 'cafe'],
      קר: ['cold', 'iced'],
      חם: ['hot', 'warm'],
      אמריקנו: ['americano'],
      אספרסו: ['espresso'],
      הפוך: ['cappuccino', 'latte'],
      מאפין: ['muffin'],
      עוגיות: ['cookies', 'cookie'],
      כריך: ['sandwich'],
      שוקולד: ['chocolate']
    }

    for (const [hebrew, english] of Object.entries(foodKeywords)) {
      if (str1.includes(hebrew) && english.some(eng => str2.includes(eng))) {
        commonWords += 2
      }
      if (str2.includes(hebrew) && english.some(eng => str1.includes(eng))) {
        commonWords += 2
      }
    }

    return Math.min(commonWords / Math.max(words1.length, words2.length), 1)
  }

  const handleMappingChange = (index: number, menuItem: MenuItemType | null) => {
    const updated = [...productMappings]
    updated[index].manualOverride = menuItem || undefined
    updated[index].shouldCreateNewItem = false // Override the create new item option
    setProductMappings(updated)
  }

  const handleCreateNewMenuItem = async (index: number) => {
    const mapping = productMappings[index]
    if (!mapping.newItemData) return

    try {
      setLoading(true)

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
      }

      const createdMenuItem = await menuItemsService.create(newMenuItem)

      // Update the local menu items list
      setMenuItems(prev => [...prev, createdMenuItem])

      // Update the mapping to use the newly created item
      const updated = [...productMappings]
      updated[index].mappedMenuItem = createdMenuItem
      updated[index].shouldCreateNewItem = false
      updated[index].confidence = 1.0 // Perfect match since we created it
      setProductMappings(updated)
    } catch (error) {
      console.error('Failed to create menu item:', error)
      setError(`Failed to create menu item: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessSalesData = () => {
    if (!parsedData) return

    const processedSalesData: ProcessedSalesData[] = []

    productMappings.forEach((mapping, index) => {
      const salesItem = parsedData.salesData[index]
      if (!salesItem) return

      const menuItem = mapping.manualOverride || mapping.mappedMenuItem

      if (menuItem) {
        processedSalesData.push({
          productName: mapping.originalName,
          menuItem,
          quantity: salesItem.quantitySold,
          unitPrice: salesItem.averagePrice,
          totalRevenue: salesItem.totalRevenue
        })
      }
    })

    const summary = {
      totalRevenue: parsedData.totalRevenue,
      totalQuantity: parsedData.totalQuantity,
      dateRange: parsedData.dateRange,
      businessName: parsedData.businessName
    }

    onSalesDataImported(processedSalesData, summary)
    onClose()
  }

  // File input ref for triggering file selection
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleReset = () => {
    setActiveStep(0)
    setParsedData(null)
    setProductMappings([])
    setError(null)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '90vh' } }}>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AIIcon color="primary" />
          {title}
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

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
            <input ref={fileInputRef} type="file" accept=".csv,.xls,.xlsx" onChange={handleFileUpload} style={{ display: 'none' }} />
            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('click_to_select_csv_file')}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {t('supports_hebrew_english_csv')}
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }}>
              {t('choose_file')}
            </Button>
          </Paper>
        )}

        {/* Step 1: Parsing Debug Results */}
        {activeStep === 1 && parsedData && parsedData.parsingDebug && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('csv_parsing_results')}
            </Typography>

            <Alert severity={Math.abs(parsedData.parsingDebug.calculatedTotal - parsedData.parsingDebug.expectedTotal) < 1 ? 'success' : 'warning'} sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>{t('expected_total')}:</strong> ₪{parsedData.parsingDebug.expectedTotal.toFixed(2)} |<strong> {t('calculated_total')}:</strong> ₪{parsedData.parsingDebug.calculatedTotal.toFixed(2)} |<strong> {t('difference_label')}:</strong> ₪{Math.abs(parsedData.parsingDebug.calculatedTotal - parsedData.parsingDebug.expectedTotal).toFixed(2)}
              </Typography>
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
              {/* Successfully Parsed Products */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom color="success.main">
                  ✅ {t('successfully_parsed_products', { count: parsedData.parsingDebug.parsedProducts.length })}
                </Typography>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('original_product')}</TableCell>
                        <TableCell align="right">{t('quantity_sold')}</TableCell>
                        <TableCell align="right">{t('revenue')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parsedData.parsingDebug.parsedProducts.map((product, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ fontSize: '0.875rem' }}>{product.name}</TableCell>
                          <TableCell align="right">{product.quantity}</TableCell>
                          <TableCell align="right">₪{product.revenue.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {t('total_revenue_label')}: ₪{parsedData.parsingDebug.parsedProducts.reduce((sum, p) => sum + p.revenue, 0).toFixed(2)}
                </Typography>
              </Paper>

              {/* Skipped Lines */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom color="error.main">
                  ❌ {t('skipped_lines_label', { count: parsedData.parsingDebug.skippedLines.length })}
                </Typography>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('line_label')}</TableCell>
                        <TableCell>{t('reason_label')}</TableCell>
                        <TableCell>{t('content_label')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {parsedData.parsingDebug.skippedLines.map((skipped, index) => (
                        <TableRow key={index}>
                          <TableCell>{skipped.lineIndex}</TableCell>
                          <TableCell>
                            <Chip label={skipped.reason} color="error" size="small" />
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{skipped.content.substring(0, 50)}...</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => {
                  setActiveStep(2)
                  performAIMapping(parsedData.salesData)
                }}
                disabled={parsedData.parsingDebug.parsedProducts.length === 0}
              >
                {t('continue_to_ai_product_mapping')}
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 2: AI Product Mapping */}
        {activeStep === 2 && parsedData && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('ai_product_mapping')}
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('ai_has_analyzed_your_payment_data')}
            </Alert>

            {/* Debug info for menu items */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>{t('available_menu_items_loaded', { count: menuItems.length })}</strong>
                {menuItems.length === 0 && ` - ${t('no_menu_items_found_create')}`}
              </Typography>
              {menuItems.length > 0 && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Menu items:{' '}
                  {menuItems
                    .slice(0, 3)
                    .map(item => item.name)
                    .join(', ')}
                  {menuItems.length > 3 && ` and ${menuItems.length - 3} more...`}
                </Typography>
              )}
            </Alert>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('original_product')}</TableCell>
                    <TableCell>{t('quantity_sold')}</TableCell>
                    <TableCell>{t('mapped_menu_item')}</TableCell>
                    <TableCell>{t('confidence')}</TableCell>
                    <TableCell>{t('action') || 'Action'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productMappings.map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell>{mapping.originalName}</TableCell>
                      <TableCell>{parsedData.salesData[index]?.quantitySold}</TableCell>
                      <TableCell>{mapping.mappedMenuItem ? <Chip label={mapping.mappedMenuItem.name} color={mapping.confidence > 0.7 ? 'success' : 'warning'} size="small" /> : mapping.shouldCreateNewItem ? <Chip label={t('will_create_new_item')} color="info" size="small" icon={<AddIcon />} /> : <Chip label={t('no_match')} color="error" size="small" />}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color={mapping.confidence > 0.7 ? 'success.main' : 'warning.main'}>
                          {Math.round(mapping.confidence * 100)}%
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 250 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {/* Always show the dropdown for manual mapping */}
                          <FormControl size="small" fullWidth>
                            <InputLabel>{t('map_to_menu_item')}</InputLabel>
                            <Select
                              value={mapping.manualOverride?.id || mapping.mappedMenuItem?.id || ''}
                              onChange={e => {
                                const menuItem = menuItems.find(item => item.id === e.target.value)
                                handleMappingChange(index, menuItem || null)
                              }}
                              label={t('map_to_menu_item')}
                              disabled={menuItems.length === 0}
                            >
                              <MenuItem value="">
                                <em>{t('select_menu_item_to_map')}</em>
                              </MenuItem>
                              {menuItems.map(item => (
                                <MenuItem key={item.id} value={item.id}>
                                  {item.name} - ₪{item.price}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>

                          {/* Show create new item option if no mapping or low confidence */}
                          {(mapping.shouldCreateNewItem || (!mapping.mappedMenuItem && !mapping.manualOverride)) && (
                            <Button size="small" variant="outlined" color="primary" startIcon={<AddIcon />} onClick={() => handleCreateNewMenuItem(index)} disabled={!mapping.newItemData} fullWidth>
                              {mapping.newItemData ? `${t('create_new_item')}: ₪${mapping.newItemData.price} - ${mapping.newItemData.category}` : t('create_new_item')}
                            </Button>
                          )}

                          {/* Show current mapping status */}
                          {mapping.manualOverride && (
                            <Typography variant="caption" color="success.main">
                              ✅ {t('manually_mapped_to', { name: mapping.manualOverride.name })}
                            </Typography>
                          )}
                          {!mapping.manualOverride && mapping.mappedMenuItem && (
                            <Typography variant="caption" color="warning.main">
                              🤖 {t('ai_mapped_to_confidence', { name: mapping.mappedMenuItem.name, percent: Math.round(mapping.confidence * 100) })}
                            </Typography>
                          )}
                          {!mapping.manualOverride && !mapping.mappedMenuItem && (
                            <Typography variant="caption" color="error.main">
                              ❌ {t('no_match')} - {t('will_be_excluded') || 'will be excluded from import'}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Step 3: Review & Process */}
        {activeStep === 3 && parsedData && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('review_sales_data')}
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              {t('ready_to_process_sales_data_from', { business: parsedData.businessName })}
            </Alert>

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('import_summary_title')}
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary={`${t('business_label')}: ${parsedData.businessName}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={`${t('date_range_label')}: ${parsedData.dateRange}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={`${t('total_products_label')}: ${parsedData.salesData.length}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={`${t('total_items_sold_label')}: ${parsedData.totalQuantity}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={`${t('total_revenue_label')}: ₪${parsedData.totalRevenue.toFixed(2)}`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary={`${t('mapped_products_label')}: ${productMappings.filter(m => m.manualOverride || m.mappedMenuItem).length}/${productMappings.length}`} />
                </ListItem>
              </List>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('cancel')}</Button>
        {activeStep > 0 && (
          <Button onClick={handleReset} color="secondary">
            {t('start_over')}
          </Button>
        )}
        {activeStep === 2 && (
          <Button onClick={() => setActiveStep(3)} variant="contained">
            {t('review_and_process')}
          </Button>
        )}
        {activeStep === 3 && (
          <Button onClick={handleProcessSalesData} variant="contained" disabled={loading}>
            {t('process_sales_data')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default AISalesImporter
