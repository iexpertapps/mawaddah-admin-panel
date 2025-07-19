# Mawaddah Admin Panel Frontend

**See also:** [Wallet Admin Analytics Enhancements](./WALLET_ADMIN_ANALYTICS.md)

A modern React application built with Vite and Tailwind CSS for the Mawaddah Admin Panel.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── atoms/          # Smallest building blocks (Button, Input, etc.)
│   ├── molecules/      # Combinations of atoms (SearchBar, Card, etc.)
│   └── organisms/      # Complex UI sections (Header, Sidebar, etc.)
├── layout/             # Page layout components
├── pages/              # Full page views
├── services/           # API services and external integrations
├── utils/              # Utility functions and helpers
├── hooks/              # Custom React hooks
├── assets/             # Static assets (images, icons, fonts)
├── App.jsx            # Main application component
├── main.jsx           # Application entry point
└── index.css          # Global styles with Tailwind
```

## 🎨 Design System

### Color Palette
- **Primary**: `#1A7F55` (Green)
- **Accent**: `#D4AF37` (Gold)
- **Info**: `#0E4C92` (Blue)
- **Maroon**: `#861657` (Maroon)
- **Light Background**: `#F8F6F0` (Off-white)

### Usage
```jsx
// Using custom colors
<div className="bg-primary text-white">Primary Button</div>
<div className="bg-accent text-white">Accent Element</div>
<div className="bg-info text-white">Info Section</div>
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📁 Component Architecture

### Atomic Design Pattern
1. **Atoms** - Basic building blocks (buttons, inputs, labels)
2. **Molecules** - Simple combinations of atoms (search bars, form fields)
3. **Organisms** - Complex UI sections (headers, sidebars, data tables)
4. **Templates** - Page layouts
5. **Pages** - Complete page views

### Example Component Structure
```jsx
// src/components/atoms/Button.jsx
export const Button = ({ children, variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors'
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary/90 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800'
  }
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

## 🔧 Development

### Adding New Components
1. Create component in appropriate folder (`atoms/`, `molecules/`, `organisms/`)
2. Export from folder's `index.js`
3. Import and use in your pages

### Styling Guidelines
- Use Tailwind utility classes for styling
- Create custom components for reusable patterns
- Follow the established color palette
- Use semantic class names

### Code Quality
- Run `npm run lint` before committing
- Use Prettier for consistent formatting
- Follow React best practices

## 🌐 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🚀 Deployment

The application is ready for deployment to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## 📝 Notes

- The development server runs on `http://localhost:5173`
- Hot Module Replacement (HMR) is enabled for fast development
- Tailwind CSS is configured with custom colors matching the brand
- ESLint and Prettier are configured for code quality
