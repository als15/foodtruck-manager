import React from 'react'
import { Box, Button, Card, CardContent, Grid, TextField, Typography, Alert, Chip, Divider, List, ListItem, ListItemText, Stack } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ingredientsService, menuItemsService } from '../services/supabaseService'
import type { Ingredient, MenuItem } from '../types'

type AggregatedIngredient = {
  ingredientId: string
  ingredientName: string
  unit: string
  totalQuantity: number
}

type ParsedEntry = { name: string; quantity: number }

function parseFreeTextList(input: string): ParsedEntry[] {
  // Split by commas or newlines; allow entries like "2 bagels" or "bagel x 2"
  const parts = input
    .split(/\n|,/)
    .map(p => p.trim())
    .filter(Boolean)
  const entries: ParsedEntry[] = []
  for (const part of parts) {
    // Try patterns: "2 bagels" or "bagels x 2"
    const m1 = part.match(/^(\d+(?:\.\d+)?)\s+(.+)$/i)
    const m2 = part.match(/^(.+?)\s*[x\*]\s*(\d+(?:\.\d+)?)$/i)
    if (m1) {
      entries.push({ quantity: parseFloat(m1[1]), name: m1[2].toLowerCase().trim() })
      continue
    }
    if (m2) {
      entries.push({ quantity: parseFloat(m2[2]), name: m2[1].toLowerCase().trim() })
      continue
    }
    // Default quantity 1
    entries.push({ quantity: 1, name: part.toLowerCase() })
  }
  return entries
}

export default function PrepPlanner() {
  const { t } = useTranslation()
  const [inputText, setInputText] = React.useState('')
  const [menuItems, setMenuItems] = React.useState<MenuItem[]>([])
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [results, setResults] = React.useState<AggregatedIngredient[]>([])

  React.useEffect(() => {
    let active = true
    ;(async () => {
      try {
        setLoading(true)
        const [mis, ings] = await Promise.all([menuItemsService.getAll(), ingredientsService.getAll()])
        if (!active) return
        setMenuItems(mis)
        setIngredients(ings)
      } catch (e: any) {
        if (!active) return
        setError(e?.message || 'Failed to load data')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const handleCompute = () => {
    setError(null)
    const entries = parseFreeTextList(inputText)
    if (entries.length === 0) {
      setResults([])
      return
    }

    // Build quick lookup from menu item name to item data (case-insensitive)
    const nameToMenuItem = new Map<string, MenuItem>()
    for (const mi of menuItems) {
      nameToMenuItem.set(mi.name.toLowerCase(), mi)
    }

    const ingredientTotals = new Map<string, { ingredientId: string; ingredientName: string; unit: string; totalQuantity: number }>()

    const missingItems: string[] = []
    for (const entry of entries) {
      const mi = nameToMenuItem.get(entry.name)
      if (!mi) {
        missingItems.push(entry.name)
        continue
      }
      for (const comp of mi.ingredients) {
        const ing = ingredients.find(i => i.id === comp.ingredientId)
        const ingredientName = ing?.name || comp.ingredientId
        const unit = comp.unit || ing?.unit || ''
        const key = `${comp.ingredientId}__${unit}`
        const additionalQty = (comp.quantity || 0) * entry.quantity
        const existing = ingredientTotals.get(key)
        if (existing) {
          existing.totalQuantity += additionalQty
        } else {
          ingredientTotals.set(key, {
            ingredientId: comp.ingredientId,
            ingredientName,
            unit,
            totalQuantity: additionalQty
          })
        }
      }
    }

    const list = Array.from(ingredientTotals.values()).sort((a, b) => a.ingredientName.localeCompare(b.ingredientName))
    setResults(list)
    if (missingItems.length > 0) {
      setError(t('some_items_not_found', { items: missingItems.join(', ') }))
    }
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
        {t('prep_planner')}
      </Typography>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="body1">{t('prep_planner_instructions')}</Typography>
            <TextField label={t('enter_items_for_tomorrow')} placeholder={t('prep_planner_placeholder')} multiline minRows={3} value={inputText} onChange={e => setInputText(e.target.value)} fullWidth />
            <Box>
              <Button variant="contained" onClick={handleCompute} disabled={loading || menuItems.length === 0}>
                {t('compute_ingredients')}
              </Button>
            </Box>
            {error && <Alert severity="warning">{error}</Alert>}
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
          {t('aggregated_ingredients')}
        </Typography>
        {results.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('no_ingredients_to_show')}
          </Typography>
        ) : (
          <Card>
            <CardContent>
              <List>
                {results.map(r => (
                  <ListItem key={`${r.ingredientId}-${r.unit}`} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {r.ingredientName}
                          </Typography>
                          <Chip label={r.unit || t('unit')} size="small" />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          {t('total_quantity')}: {r.totalQuantity} {r.unit}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}
