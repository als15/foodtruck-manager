# 🎨 NomNom Design System

## Brand Identity

**NomNom** is a friendly, approachable food truck management platform that combines professional functionality with a warm, welcoming aesthetic. The design language reflects the joy and community spirit of food truck culture while maintaining the efficiency needed for business operations.

## 🎨 Color Palette

### Primary Colors
```css
--nomnom-primary: #7fffd4     /* Aquamarine - Main brand color */
--nomnom-secondary: #6dded0   /* Medium Turquoise - Secondary actions */
--nomnom-background: #fcf3ee  /* Warm Cream - Page background */
--nomnom-accent: #ffd4d4      /* Light Pink - Highlights & accents */
--nomnom-white: #ffffff       /* Pure White - Cards & surfaces */
```

### Extended Palette
```css
--nomnom-primary-light: #b3ffe0
--nomnom-primary-dark: #4dccaa
--nomnom-secondary-light: #9de6dc
--nomnom-secondary-dark: #5bb5a8
```

### Semantic Colors
```css
--nomnom-success: #6dded0     /* Success states */
--nomnom-warning: #ffd4d4     /* Warning states */
--nomnom-error: #ff9999       /* Error states */
--nomnom-info: #7fffd4        /* Information states */
```

### Typography Colors
```css
--nomnom-text-primary: #2d3748    /* Main text */
--nomnom-text-secondary: #718096  /* Secondary text */
--nomnom-text-light: #a0aec0      /* Light text */
```

## 🔤 Typography

### Font Family
- **Primary**: Inter (Modern, clean, highly readable)
- **RTL Support**: Heebo (For Hebrew/Arabic languages)
- **Fallback**: System fonts (Roboto, Helvetica, Arial)

### Font Weights
- **Light**: 300 (Rare usage)
- **Regular**: 400 (Body text)
- **Medium**: 500 (Buttons, labels)
- **Semi-Bold**: 600 (Headings, emphasis)
- **Bold**: 700 (Major headings, brand text)

### Scale & Usage
```css
h1: 2.5rem, weight: 700    /* Page titles */
h2: 2rem, weight: 600      /* Section titles */
h3: 1.75rem, weight: 600   /* Subsection titles */
h4: 1.5rem, weight: 500    /* Card titles */
h5: 1.25rem, weight: 500   /* Small headings */
h6: 1.125rem, weight: 500  /* Labels */
body1: 1rem, weight: 400   /* Primary text */
body2: 0.875rem, weight: 400 /* Secondary text */
button: 0.875rem, weight: 500 /* Button text */
```

## 🧩 Component Design Language

### Cards
- **Border Radius**: 16px (Friendly, modern)
- **Shadows**: Subtle, layered (0 4px 12px rgba(0,0,0,0.05))
- **Borders**: Light primary color borders
- **Hover Effects**: Lift animation + increased shadow
- **Background**: Pure white with gradient overlays

### Buttons
- **Border Radius**: 10px
- **Padding**: 10px 24px
- **Primary**: Gradient from primary to secondary
- **Hover**: Lift effect + darker gradient
- **Typography**: Medium weight, no text transform

### Form Elements
- **Border Radius**: 10px
- **Focus States**: Primary color with 2px border
- **Background**: White with subtle primary tinting
- **Hover**: Primary color borders

### Tables
- **Header**: Light primary background
- **Rows**: Alternating background with hover states
- **Border Radius**: 12px container
- **Borders**: Light primary color

## 🎭 Theming Principles

### 1. Warmth & Approachability
- Soft, rounded corners throughout
- Warm background colors
- Friendly color combinations
- Subtle animations and transitions

### 2. Professional Functionality
- Clear hierarchy with typography
- Consistent spacing (8px grid)
- Accessible color contrasts
- Predictable interaction patterns

### 3. Food Industry Appropriate
- Colors evoke freshness and cleanliness
- Chef character branding element
- Emphasis on visual clarity for operations
- Mobile-first responsive design

### 4. Brand Consistency
- Gradient text for brand elements
- NomNom logo integration
- Consistent color application
- Coherent visual language

## 🎨 Brand Elements

### Logo
- **Primary**: Chef character + "NomNom" text
- **Variations**: Icon-only, text-only
- **Sizes**: Small (24px), Medium (32px), Large (48px)
- **Usage**: Sidebar, headers, welcome screens

### Color Usage Guidelines

#### Primary Color (#7fffd4)
- **Use for**: Light backgrounds, subtle highlights, decorative elements
- **Avoid**: Text color, buttons (use darker variant instead)

#### Primary Dark (#4dccaa) - **Main Interactive Color**
- **Use for**: Buttons, links, focus states, interactive elements
- **Text Safe**: Good contrast for accessibility

#### Secondary Color (#6dded0)
- **Use for**: Light backgrounds, success indicators, subtle accents
- **Avoid**: Text color (use darker variant instead)

#### Secondary Dark (#5bb5a8) - **Secondary Interactive Color**
- **Use for**: Secondary buttons, alternative actions, highlights
- **Text Safe**: Good contrast for accessibility

#### Background Color (#fcf3ee)
- **Use for**: Page backgrounds, subtle containers
- **Avoid**: Text, interactive elements

#### Accent Color (#ffd4d4)
- **Use for**: Highlights, warm accents, warning backgrounds
- **Avoid**: Primary actions, success messaging

## 🚀 Implementation

### Theme File Location
```
src/theme/nomnom-theme.ts
```

### Usage in Components
```tsx
import { nomNomColors } from '../theme/nomnom-theme';

// Direct color usage
sx={{ color: nomNomColors.primary }}

// Theme integration
<ThemeProvider theme={nomNomTheme}>
```

### Key Components
- **NomNomLogo**: Brand logo component
- **WelcomeCard**: Dashboard welcome component
- **Custom Material-UI theme**: Complete theme override

## 🎯 Design Goals Achieved

✅ **Brand Identity**: Distinctive, memorable visual presence  
✅ **User Experience**: Intuitive, welcoming interface  
✅ **Professional Appeal**: Business-appropriate aesthetics  
✅ **Food Industry Fit**: Colors and imagery suited for food service  
✅ **Accessibility**: Proper contrast ratios and readable typography  
✅ **Responsiveness**: Mobile-first, flexible layouts  
✅ **RTL Support**: Hebrew language support maintained  
✅ **Consistency**: Coherent design system across all components  

## 📱 Responsive Breakpoints

```css
xs: 0px      /* Mobile portrait */
sm: 600px    /* Mobile landscape */
md: 960px    /* Tablet */
lg: 1280px   /* Desktop */
xl: 1920px   /* Large desktop */
```

## 🔧 Future Enhancements

- [ ] Dark mode variant
- [ ] Additional chef character illustrations
- [ ] Micro-interactions and animations
- [ ] Advanced loading states
- [ ] Custom iconography set
- [ ] Seasonal color variations

---

**NomNom Design System v1.0** - Created for professional food truck management with style and warmth. 🚚👨‍🍳