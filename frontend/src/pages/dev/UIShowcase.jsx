import React, { useState } from 'react'
import { Button } from '../../components/atoms/Button'
import { Input } from '../../components/atoms';
import { Heading, Text, Label } from '../../components/atoms/typography'
import { useTheme } from '../../context/ThemeContext'
import { SearchIcon } from '../../components/atoms/Icons';

const UIShowcase = () => {
  const { theme, toggleTheme, isDark } = useTheme()
  const [inputValue, setInputValue] = useState('')
  const [selectedTab, setSelectedTab] = useState('typography')

  const tabs = [
    { id: 'typography', label: 'Typography' },
    { id: 'buttons', label: 'Buttons' },
    { id: 'inputs', label: 'Inputs' },
    { id: 'labels', label: 'Labels' },
    { id: 'theme', label: 'Theme' }
  ]

  const TabButton = ({ tab, isActive }) => (
    <button
      onClick={() => setSelectedTab(tab.id)}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive 
          ? 'bg-primary text-white' 
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
    >
      {tab.label}
    </button>
  )

  const TypographySection = () => (
    <div className="space-y-8">
      <div>
        <Heading size="3xl" as="h2" className="mb-6">Typography System</Heading>
        <Text muted>Consistent text styling across the application</Text>
      </div>

      {/* Headings */}
      <div>
        <Heading size="xl" as="h3" className="mb-4">Headings</Heading>
        <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Heading size="5xl" as="h1">Heading 5xl - Main Page Title</Heading>
          <Heading size="4xl" as="h2">Heading 4xl - Section Title</Heading>
          <Heading size="3xl" as="h3">Heading 3xl - Subsection</Heading>
          <Heading size="2xl" as="h4">Heading 2xl - Card Title</Heading>
          <Heading size="xl" as="h5">Heading xl - Widget Title</Heading>
          <Heading size="lg" as="h6">Heading lg - Small Title</Heading>
        </div>
      </div>

      {/* Text Sizes */}
      <div>
        <Heading size="xl" as="h3" className="mb-4">Text Sizes</Heading>
        <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Text size="2xl">Text 2xl - Large paragraph text for emphasis</Text>
          <Text size="xl">Text xl - Standard large text for important content</Text>
          <Text size="lg">Text lg - Slightly larger text for better readability</Text>
          <Text size="md">Text md - Default body text for regular content</Text>
          <Text size="sm">Text sm - Small text for secondary information</Text>
          <Text size="xs">Text xs - Extra small text for captions and metadata</Text>
        </div>
      </div>

      {/* Muted Text */}
      <div>
        <Heading size="xl" as="h3" className="mb-4">Muted Text</Heading>
        <div className="space-y-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Text muted>This is muted text for secondary information and descriptions</Text>
          <Text size="sm" muted>Small muted text for captions, timestamps, and metadata</Text>
          <Text size="xs" muted>Extra small muted text for fine print and disclaimers</Text>
        </div>
      </div>
    </div>
  )

  const ButtonsSection = () => (
    <div className="space-y-8">
      <div>
        <Heading size="3xl" as="h2" className="mb-6">Button Components</Heading>
        <Text muted>Interactive elements with consistent styling and states</Text>
      </div>

      {/* Button Variants */}
      <div>
        <Heading size="xl" as="h3" className="mb-4">Button Variants</Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="space-y-2">
            <Text size="sm" className="font-medium">Primary</Text>
            <Button variant="primary">Primary Button</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
          <div className="space-y-2">
            <Text size="sm" className="font-medium">Secondary</Text>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="secondary" disabled>Disabled</Button>
          </div>
          <div className="space-y-2">
            <Text size="sm" className="font-medium">Outline</Text>
            <Button variant="outline">Outline Button</Button>
            <Button variant="outline" disabled>Disabled</Button>
          </div>
          <div className="space-y-2">
            <Text size="sm" className="font-medium">Ghost</Text>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="ghost" disabled>Disabled</Button>
          </div>
          <div className="space-y-2">
            <Text size="sm" className="font-medium">Danger</Text>
            <Button variant="danger">Danger Button</Button>
            <Button variant="danger" disabled>Disabled</Button>
          </div>
          <div className="space-y-2">
            <Text size="sm" className="font-medium">Accent</Text>
            <Button variant="accent">Accent Button</Button>
            <Button variant="accent" disabled>Disabled</Button>
          </div>
        </div>
      </div>

      {/* Button Sizes */}
      <div>
        <Heading size="xl" as="h3" className="mb-4">Button Sizes</Heading>
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="md">Medium</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
      </div>

      {/* Button with Icons */}
      <div>
        <Heading size="xl" as="h3" className="mb-4">Buttons with Icons</Heading>
        <div className="flex flex-wrap gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Button variant="primary" className="flex items-center gap-2">
            <span>📁</span> Open Folder
          </Button>
          <Button variant="secondary" className="flex items-center gap-2">
            <span>💾</span> Save
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <span>🔍</span> Search
          </Button>
          <Button variant="danger" className="flex items-center gap-2">
            <span>🗑️</span> Delete
          </Button>
        </div>
      </div>
    </div>
  )

  const InputsSection = () => (
    <div className="space-y-8">
      <div>
        <Heading size="3xl" as="h2" className="mb-6">Input Components</Heading>
        <Text muted>Form controls with consistent styling and validation states</Text>
      </div>

      {/* Basic Inputs */}
      <div>
        <Heading size="xl" as="h3" className="mb-4">Basic Inputs</Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="space-y-2">
            <Text size="sm" className="font-medium">Default Input</Text>
            <Input placeholder="Enter text here..." />
          </div>
          <div className="space-y-2">
            <Text size="sm" className="font-medium">With Label</Text>
            <Input label="Email Address" placeholder="Enter your email" />
          </div>
          <div className="space-y-2">
            <Text size="sm" className="font-medium">With Value</Text>
            <Input 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type to see changes..." 
            />
          </div>
          <div className="space-y-2">
            <Text size="sm" className="font-medium">Disabled</Text>
            <Input placeholder="Disabled input" disabled />
          </div>
          <div className="space-y-2">
            <Text size="sm" className="font-medium">Search Input</Text>
            <Input
              placeholder="Search by user name, donor name"
              icon={<SearchIcon />}
            />
          </div>
        </div>
      </div>

      {/* Input States */}
      <div>
        <Heading size="xl" as="h3" className="mb-4">Input States</Heading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="space-y-2">
            <Text size="sm" className="font-medium">With Error</Text>
            <Input 
              placeholder="Invalid input" 
              error="This field is required" 
            />
          </div>
          <div className="space-y-2">
            <Text size="sm" className="font-medium">With Success</Text>
            <Input 
              placeholder="Valid input" 
              className="border-green-500 focus:border-green-500" 
            />
          </div>
          <div className="space-y-2">
            <Text size="sm" className="font-medium">With Helper Text</Text>
            <Input 
              label="Password" 
              placeholder="Enter your password"
              helperText="Must be at least 8 characters long"
            />
          </div>
          <div className="space-y-2">
            <Text size="sm" className="font-medium">Required Field</Text>
            <Input 
              label="Username *" 
              placeholder="Enter username"
              required 
            />
          </div>
        </div>
      </div>
    </div>
  )

  const LabelsSection = () => (
    <div className="space-y-8">
      <div>
        <Heading size="3xl" as="h2" className="mb-6">Label Components</Heading>
        <Text muted>Tags, badges, and status indicators</Text>
      </div>

      {/* Label Variants */}
      <div>
        <Heading size="xl" as="h3" className="mb-4">Label Variants</Heading>
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <Text size="sm" className="font-medium mb-2">Default Labels</Text>
            <div className="flex flex-wrap gap-2">
              <Label variant="default">Default Label</Label>
              <Label variant="badge">Badge Label</Label>
            </div>
          </div>
          
          <div>
            <Text size="sm" className="font-medium mb-2">Status Labels</Text>
            <div className="flex flex-wrap gap-2">
              <Label variant="success">Success</Label>
              <Label variant="warning">Warning</Label>
              <Label variant="error">Error</Label>
              <Label variant="info">Info</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Label Sizes */}
      <div>
        <Heading size="xl" as="h3" className="mb-4">Label Sizes</Heading>
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <Text size="sm" className="font-medium mb-2">Size Variants</Text>
            <div className="flex flex-wrap items-center gap-2">
              <Label size="xs" variant="badge">Extra Small</Label>
              <Label size="sm" variant="badge">Small</Label>
              <Label size="md" variant="badge">Medium</Label>
              <Label size="lg" variant="badge">Large</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div>
        <Heading size="xl" as="h3" className="mb-4">Common Use Cases</Heading>
        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <Text size="sm" className="font-medium mb-2">Status Indicators</Text>
            <div className="flex flex-wrap gap-2">
              <Label variant="success">Active</Label>
              <Label variant="warning">Pending</Label>
              <Label variant="error">Failed</Label>
              <Label variant="info">Processing</Label>
            </div>
          </div>
          
          <div>
            <Text size="sm" className="font-medium mb-2">Categories</Text>
            <div className="flex flex-wrap gap-2">
              <Label variant="badge">Technology</Label>
              <Label variant="badge">Design</Label>
              <Label variant="badge">Marketing</Label>
              <Label variant="badge">Finance</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const ThemeSection = () => (
    <div className="space-y-8">
      <div>
        <Heading size="3xl" as="h2" className="mb-6">Theme System</Heading>
        <Text muted>Dark and light mode with persistent preferences</Text>
      </div>

      {/* Theme Controls */}
      <div>
        <Heading size="xl" as="h3" className="mb-4">Theme Controls</Heading>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="primary" 
              onClick={toggleTheme}
              className="flex items-center gap-2"
            >
              {isDark ? '🌞' : '🌙'} Toggle Theme
            </Button>
            <Text muted>
              Current theme: <Label variant="badge">{theme}</Label>
            </Text>
          </div>
          <Text size="sm" muted>
            Keyboard shortcut: Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Ctrl+J</kbd> or <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Cmd+J</kbd> to toggle
          </Text>
        </div>
      </div>

      {/* Color Palette */}
      <div>
        <Heading size="xl" as="h3" className="mb-4">Brand Color Palette</Heading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary rounded-lg mx-auto mb-2"></div>
            <Text size="sm" className="font-medium">Primary</Text>
            <Text size="xs" muted>#1A7F55</Text>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-accent rounded-lg mx-auto mb-2"></div>
            <Text size="sm" className="font-medium">Accent</Text>
            <Text size="xs" muted>#D4AF37</Text>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-info rounded-lg mx-auto mb-2"></div>
            <Text size="sm" className="font-medium">Info</Text>
            <Text size="xs" muted>#0E4C92</Text>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-maroon rounded-lg mx-auto mb-2"></div>
            <Text size="sm" className="font-medium">Maroon</Text>
            <Text size="xs" muted>#861657</Text>
          </div>
        </div>
      </div>

      {/* Theme Preview */}
      <div>
        <Heading size="xl" as="h3" className="mb-4">Theme Preview</Heading>
        <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="space-y-4">
            <Heading size="2xl" as="h3">Sample Content</Heading>
            <Text>
              This is how content looks in the current theme. The background, text colors, 
              and all styling adapts automatically to provide the best user experience.
            </Text>
            <div className="flex gap-2">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary</Button>
            </div>
            <div className="flex gap-2">
              <Label variant="success">Success</Label>
              <Label variant="warning">Warning</Label>
              <Label variant="error">Error</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSection = () => {
    switch (selectedTab) {
      case 'typography':
        return <TypographySection />
      case 'buttons':
        return <ButtonsSection />
      case 'inputs':
        return <InputsSection />
      case 'labels':
        return <LabelsSection />
      case 'theme':
        return <ThemeSection />
      default:
        return <TypographySection />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Heading size="4xl" as="h1" className="mb-2">
            UI Component Showcase
          </Heading>
          <Text size="lg" muted>
            Development and testing environment for all design system components
          </Text>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => (
              <TabButton 
                key={tab.id} 
                tab={tab} 
                isActive={selectedTab === tab.id} 
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <div className="p-8">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  )
} 

export default UIShowcase 