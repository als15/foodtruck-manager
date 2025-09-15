import React from 'react'
import { IconButton, Menu, MenuItem, Box, Typography } from '@mui/material'
import { Language as LanguageIcon } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'he', name: 'עברית', flag: '🇮🇱' }
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  // Set initial direction on component mount
  React.useEffect(() => {
    const isRtl = i18n.language === 'he'
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
    handleClose()

    // Set document direction based on language
    const isRtl = languageCode === 'he'
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
    document.documentElement.lang = languageCode

    // Trigger custom event for theme direction change
    const event = new StorageEvent('storage', {
      key: 'i18nextLng',
      newValue: languageCode
    })
    window.dispatchEvent(event)
  }

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  return (
    <>
      <IconButton onClick={handleClick} size="small" className="no-flip" sx={{ ml: 2 }} aria-controls={open ? 'language-menu' : undefined} aria-haspopup="true" aria-expanded={open ? 'true' : undefined} title="Change Language">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <span style={{ fontSize: '16px' }}>{currentLanguage.flag}</span>
          <LanguageIcon fontSize="small" />
        </Box>
      </IconButton>
      <Menu anchorEl={anchorEl} id="language-menu" open={open} onClose={handleClose} onClick={handleClose} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
        {languages.map(language => (
          <MenuItem key={language.code} onClick={() => handleLanguageChange(language.code)} selected={i18n.language === language.code}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: '18px' }}>{language.flag}</span>
              <Typography variant="body2">{language.name}</Typography>
            </Box>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
