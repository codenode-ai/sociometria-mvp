# Sociometria App Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from productivity tools like Notion and Linear for the dashboard interface, with data visualization elements inspired by analytics platforms. This utility-focused application prioritizes efficiency and learnability for business users managing employee pairing processes.

## Core Design Elements

### Color Palette
**Primary Colors:**
- Brand Blue: 215 85% 35% (professional, trustworthy)
- Deep Navy: 220 45% 15% (headers, primary text)

**Supporting Colors:**
- Success Green: 145 65% 45% (positive indicators, strong pairs)
- Warning Orange: 35 85% 55% (caution, problematic pairs) 
- Light Gray: 210 15% 95% (backgrounds, cards)
- Medium Gray: 210 10% 65% (secondary text, borders)

**Dark Mode:**
- Background: 220 25% 8%
- Card Background: 220 20% 12%
- Text Primary: 0 0% 95%

### Typography
**Fonts:** Inter (Google Fonts)
- Headers: 600 weight, sizes 24px-32px
- Body text: 400 weight, 16px
- UI elements: 500 weight, 14px

### Layout System
**Spacing:** Tailwind units of 2, 4, 6, and 8 (p-2, m-4, gap-6, h-8)
- Card padding: p-6
- Section spacing: mb-8
- Grid gaps: gap-4 (mobile), gap-6 (desktop)

### Component Library

**Navigation:**
- Sidebar with icons and labels
- Clean hover states with subtle background changes
- Active state with colored left border

**Cards:**
- Rounded corners (rounded-lg)
- Subtle shadows (shadow-md)
- White background with clean borders
- Hover elevation effect

**Employee Pair Cards:**
- Split layout showing Drive/Help roles
- Color-coded role indicators
- Justification text in smaller, muted typography

**Forms:**
- Clean input fields with focus states
- Primary action buttons with brand blue
- Modal overlays for creation flows

**Data Visualization:**
- Simple SVG network graphs for sociometry
- Solid lines for preferences, dashed for avoidances
- Node colors matching employee roles
- Clean, minimal chart styling

**Status Indicators:**
- Badge-style pills for employee status
- Star ratings for casa feedback
- Color-coded performance metrics

### Responsive Behavior
- Mobile: Single column card layout, collapsible sidebar
- Desktop: Multi-column grid, persistent sidebar navigation
- Cards stack vertically on mobile, grid layout on larger screens

### Interactive Elements
- Subtle hover states on all clickable elements
- Loading states for "Gerar Novas Duplas" button
- Smooth transitions between navigation sections
- Modal animations for form overlays

This design creates a professional, data-driven interface that maintains clarity while handling complex employee relationship mapping and business operations.