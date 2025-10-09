import React, { useState, useRef } from 'react'
import { Box, Typography, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Stepper, Step, StepLabel, Alert, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip, Divider, useTheme } from '@mui/material'
import { Upload as UploadIcon, AutoAwesome as AIIcon, Edit as EditIcon, Delete as DeleteIcon, Download as DownloadIcon, PhotoCamera as CameraIcon, TextFields as TextIcon, AttachFile as FileIcon, CheckCircle as CheckIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import Papa from 'papaparse'

interface ParsedIngredient {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  estimatedCost: number
  confidence: number
  notes?: string
}

interface RecipeParserProps {
  open: boolean
  onClose: () => void
  onImport: (ingredients: ParsedIngredient[]) => void
}

const PARSING_STEPS = ['upload', 'parse', 'review', 'generate']

export default function RecipeParser({ open, onClose, onImport }: RecipeParserProps) {
  const theme = useTheme()
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [activeStep, setActiveStep] = useState(0)
  const [parsing, setParsing] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<'text' | 'image' | 'file' | null>(null)
  const [recipeText, setRecipeText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedIngredients, setParsedIngredients] = useState<ParsedIngredient[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setActiveStep(0)
    setUploadMethod(null)
    setRecipeText('')
    setSelectedFile(null)
    setParsedIngredients([])
    setError(null)
    onClose()
  }

  const handleTextUpload = () => {
    setUploadMethod('text')
    setActiveStep(1)
  }

  const handleImageUpload = () => {
    setUploadMethod('image')
    imageInputRef.current?.click()
  }

  const handleFileUpload = () => {
    setUploadMethod('file')
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setActiveStep(1)
      // Auto-parse if it's a text file
      if (file.type.startsWith('text/')) {
        readFileContent(file)
      }
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file)
      setActiveStep(1)
    }
  }

  const readFileContent = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const content = e.target?.result as string
      setRecipeText(content)
    }
    reader.readAsText(file)
  }

  const parseRecipe = async () => {
    setParsing(true)
    setError(null)

    try {
      let contentToAnalyze = ''

      if (uploadMethod === 'text') {
        contentToAnalyze = recipeText
      } else if (uploadMethod === 'image' && selectedFile) {
        // For image parsing, we would need OCR service
        contentToAnalyze = await extractTextFromImage(selectedFile)
      } else if (uploadMethod === 'file' && selectedFile) {
        contentToAnalyze = recipeText
      }

      const ingredients = await analyzeRecipeWithAI(contentToAnalyze)
      setParsedIngredients(ingredients)
      setActiveStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failed_to_parse_recipe') || 'Failed to parse recipe')
    } finally {
      setParsing(false)
    }
  }

  const extractTextFromImage = async (file: File): Promise<string> => {
    // This would integrate with an OCR service like Google Vision API or Tesseract
    // For now, return a placeholder
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(t('ocr_placeholder') || 'OCR extraction would happen here - integrating with vision API')
      }, 2000)
    })
  }

  const analyzeRecipeWithAI = async (recipeText: string): Promise<ParsedIngredient[]> => {
    // This would integrate with OpenAI API or similar AI service
    // For now, simulate the parsing with realistic data

    return new Promise(resolve => {
      setTimeout(() => {
        // Simulate AI parsing results
        const mockIngredients: ParsedIngredient[] = [
          {
            id: '1',
            name: 'Ground Beef',
            quantity: 2,
            unit: 'lbs',
            category: 'Meat',
            estimatedCost: 8.99,
            confidence: 0.95,
            notes: 'Detected from "2 pounds ground beef"'
          },
          {
            id: '2',
            name: 'Onions',
            quantity: 1,
            unit: 'piece',
            category: 'Vegetables',
            estimatedCost: 1.5,
            confidence: 0.9,
            notes: 'Detected from "1 large onion, diced"'
          },
          {
            id: '3',
            name: 'Garlic',
            quantity: 3,
            unit: 'cloves',
            category: 'Herbs & Spices',
            estimatedCost: 0.5,
            confidence: 0.85,
            notes: 'Detected from "3 cloves garlic, minced"'
          },
          {
            id: '4',
            name: 'Tomato Sauce',
            quantity: 1,
            unit: 'can',
            category: 'Pantry',
            estimatedCost: 2.25,
            confidence: 0.92,
            notes: 'Detected from "1 can (15oz) tomato sauce"'
          }
        ]

        resolve(mockIngredients)
      }, 3000)
    })
  }

  const updateIngredient = (id: string, field: keyof ParsedIngredient, value: any) => {
    setParsedIngredients(prev => prev.map(ing => (ing.id === id ? { ...ing, [field]: value } : ing)))
  }

  const removeIngredient = (id: string) => {
    setParsedIngredients(prev => prev.filter(ing => ing.id !== id))
  }

  const generateCSV = () => {
    const csvData = parsedIngredients.map(ing => ({
      name: ing.name,
      costPerUnit: ing.estimatedCost,
      unit: ing.unit,
      supplier: 'AI Parsed - Please Update',
      category: ing.category,
      isAvailable: true,
      unitsPerPackage: ing.quantity,
      packageType: '',
      minimumOrderQuantity: 1,
      orderByPackage: false
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'parsed-ingredients.csv'
    link.click()

    setActiveStep(3)
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                {t('how_upload_recipe')}
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { transform: 'scale(1.02)' },
                  transition: 'transform 0.2s'
                }}
                onClick={handleTextUpload}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <TextIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {t('paste_recipe_text')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('paste_recipe_text_desc')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { transform: 'scale(1.02)' },
                  transition: 'transform 0.2s'
                }}
                onClick={handleImageUpload}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <CameraIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {t('upload_image_label')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('upload_image_desc')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { transform: 'scale(1.02)' },
                  transition: 'transform 0.2s'
                }}
                onClick={handleFileUpload}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <FileIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {t('upload_file_label')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('upload_file_desc')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )

      case 1:
        return (
          <Box>
            {uploadMethod === 'text' && <TextField fullWidth multiline rows={10} label={t('recipe_text_label')} value={recipeText} onChange={e => setRecipeText(e.target.value)} placeholder={t('recipe_text_placeholder')} sx={{ mb: 3 }} />}

            {selectedFile && (
              <Alert severity="info" sx={{ mb: 3 }}>
                {t('selected_file_label', { name: selectedFile.name })}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button variant="contained" onClick={parseRecipe} disabled={parsing || (!recipeText && !selectedFile)} startIcon={parsing ? <CircularProgress size={20} /> : <AIIcon />} size="large">
                {parsing ? t('parsing_with_ai') : t('parse_recipe_button')}
              </Button>
            </Box>
          </Box>
        )

      case 2:
        return (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('ai_parsing_complete', { count: parsedIngredients.length })}
              </Typography>
              <Typography variant="body2">{t('review_edit_hint')}</Typography>
            </Alert>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('ingredient_col')}</TableCell>
                    <TableCell>{t('quantity_col')}</TableCell>
                    <TableCell>{t('unit_col')}</TableCell>
                    <TableCell>{t('category_col')}</TableCell>
                    <TableCell>{t('estimated_cost_col')}</TableCell>
                    <TableCell>{t('confidence_col')}</TableCell>
                    <TableCell>{t('actions_col')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedIngredients.map(ingredient => (
                    <TableRow key={ingredient.id}>
                      <TableCell>
                        <TextField value={ingredient.name} onChange={e => updateIngredient(ingredient.id, 'name', e.target.value)} variant="outlined" size="small" fullWidth />
                      </TableCell>
                      <TableCell>
                        <TextField type="number" value={ingredient.quantity} onChange={e => updateIngredient(ingredient.id, 'quantity', parseFloat(e.target.value))} variant="outlined" size="small" sx={{ width: 80 }} />
                      </TableCell>
                      <TableCell>
                        <TextField value={ingredient.unit} onChange={e => updateIngredient(ingredient.id, 'unit', e.target.value)} variant="outlined" size="small" sx={{ width: 100 }} />
                      </TableCell>
                      <TableCell>
                        <TextField value={ingredient.category} onChange={e => updateIngredient(ingredient.id, 'category', e.target.value)} variant="outlined" size="small" sx={{ width: 120 }} />
                      </TableCell>
                      <TableCell>
                        <TextField type="number" value={ingredient.estimatedCost} onChange={e => updateIngredient(ingredient.id, 'estimatedCost', parseFloat(e.target.value))} variant="outlined" size="small" sx={{ width: 100 }} InputProps={{ startAdornment: '$' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={`${Math.round(ingredient.confidence * 100)}%`} color={ingredient.confidence > 0.8 ? 'success' : 'warning'} size="small" />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => removeIngredient(ingredient.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button variant="contained" onClick={generateCSV} startIcon={<DownloadIcon />} size="large" disabled={parsedIngredients.length === 0}>
                {t('generate_csv_button')}
              </Button>
            </Box>
          </Box>
        )

      case 3:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              {t('csv_generated_title')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {t('csv_generated_desc')}
            </Typography>
            <Button variant="contained" onClick={() => onImport(parsedIngredients)} size="large">
              {t('import_ingredients_now')}
            </Button>
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth PaperProps={{ sx: { minHeight: '80vh' } }}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AIIcon color="primary" />
            <Typography variant="h5">{t('ai_recipe_parser_title')}</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t('ai_recipe_parser_subtitle')}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ flexDirection: theme.direction === 'rtl' ? 'row-reverse' : 'row' }}>
              <Step>
                <StepLabel>{t('step_upload_recipe')}</StepLabel>
              </Step>
              <Step>
                <StepLabel>{t('step_ai_parsing')}</StepLabel>
              </Step>
              <Step>
                <StepLabel>{t('step_review_edit')}</StepLabel>
              </Step>
              <Step>
                <StepLabel>{t('step_generate_csv')}</StepLabel>
              </Step>
            </Stepper>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {getStepContent(activeStep)}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>{activeStep === 3 ? t('done') : t('cancel')}</Button>
          {activeStep > 0 && activeStep < 3 && <Button onClick={() => setActiveStep(prev => prev - 1)}>{t('back')}</Button>}
        </DialogActions>
      </Dialog>

      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".txt,.doc,.docx,.pdf" onChange={handleFileSelect} />

      <input type="file" ref={imageInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleImageSelect} />
    </>
  )
}
