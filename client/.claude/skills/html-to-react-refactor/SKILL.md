---
name: html-to-react-refactor
description: |
  Convert static HTML pages to professional React components using the project's tech stack. 
  Use this skill when you need to refactor HTML (CSS3, Tailwind, Google Fonts/Icons) into React components with Ant Design integration.
  
  The skill handles two HTML structures:
  1. Full web pages with header/nav/main sections → automatically use AppHeader + AppSidebar
  2. Partial components → convert to React component with proper layout wrapper
  
  The skill will automatically:
  - Extract reusable components to @src/components (never references V1 folder)
  - Convert simple HTML elements to Ant Design components when appropriate
  - Preserve Tailwind styling while integrating with antd theme
  - Generate TypeScript interfaces for component props
  - Define variable names and TODO comments for logic/API implementation (user completes)
  - Output final page component to #file:page
---

# HTML-to-React Refactoring Skill

This skill transforms static HTML pages and components into well-structured React components that leverage your project's tech stack: React, TypeScript, Tailwind CSS, and Ant Design.

## When to Use

- Converting static HTML mockups to React
- Refactoring plain HTML forms to React forms with Ant Design
- Creating new page components from design files
- Migrating HTML components to align with project standards

## Tech Stack Integration

- **React**: Functional components with TypeScript
- **Tailwind CSS**: Preserved from HTML, optimized for React
- **Ant Design (v5+)**: For buttons, inputs, forms, modals, tables, etc.
- **Antd Icons**: For Material Symbols and icon replacements
- **Antd Theme**: For color consistency across components
- **Shared Components**: AppHeader, AppSidebar (auto-detected in page structures)

## Input Requirements

**File format**: HTML file with HTML5 structure

**Expected structure**:
```html
<!-- Full page: auto-detect and use shared components -->
<body>
  <header>...</header>
  <nav>...</nav>
  <main>...</main>
</body>

<!-- Or partial component: any HTML structure -->
<div class="container">...</div>
```

## Refactoring Process

### Step 1: Analyze HTML Structure
- Detect whether input is a full page (header/nav/main) or a partial component
- Identify layout type, nested elements, and styling patterns
- Check for existing component patterns (cards, lists, forms)

### Step 2: Plan Component Architecture
- **Full page**: Use AppHeader + AppSidebar layout, extract content from `<main>`
- **Partial component**: Wrap in layout container, identify reusable patterns
- Create extraction plan for sub-components → @src/components

### Step 3: Convert to React
- Replace HTML elements with React components
- Map simple elements (button, input, form) to Ant Design equivalents
- Preserve Tailwind classes, optimize for React structure
- Generate TypeScript interfaces for all component props

### Step 4: Extract Reusable Components
- Identify repeating patterns (cards, list items, form fields, etc.)
- Create separate component files in @src/components/
- **IMPORTANT**: Never import or reference components from @src/components/V1

### Step 5: Output Structure
- **Main page component**: Output to #file:page with appropriate name
- **Sub-components**: Each extracted to @src/components/<ComponentName>.tsx
- **Styling**: Tailwind classes in component, theme colors via antd Token
- **Types**: Full TypeScript with Props interfaces

## Component Mapping Guide

| HTML Element | React Component | Notes |
|---|---|---|
| `<button>` | `<Button>` (antd) | Preserve style (primary, default, danger) |
| `<input type="text">` | `<Input>` (antd) | Group with label if exists |
| `<input type="checkbox">` | `<Checkbox>` (antd) | |
| `<select>` | `<Select>` (antd) | Parse options from HTML |
| `<textarea>` | `<Input.TextArea>` (antd) | |
| `<form>` | `<Form>` (antd) | Only if complex; simple divs stay divs |
| `<img src="material-icons">` | `<IconName />` (antd icons) | Convert Material Symbols to antd icons |
| Navigation | Handled via React Router Links | Use useNavigate/Link |
| Icons (SVG/emoji) | Antd Icon components | Direct mapping where possible |

## Output Format

### Page Component (TypeScript + React)
```typescript
import React from 'react';
import { Button, Input, Form } from 'antd';
import AppHeader from '@/components/AppHeader';
import AppSidebar from '@/components/AppSidebar';
import CustomCard from '@/components/CustomCard';

interface PageProps {
  // typed props
}

const PageName: React.FC<PageProps> = () => {
  return (
    <div className="flex">
      <AppSidebar />
      <div className="flex-1">
        <AppHeader />
        <main className="p-8 mt-16">
          {/* Page content */}
        </main>
      </div>
    </div>
  );
};

export default PageName;
```

### Sub-Component (if extracted)
```typescript
interface CardProps {
  title: string;
  // other props
}

const CustomCard: React.FC<CardProps> = ({ title }) => {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <h3 className="font-semibold">{title}</h3>
    </div>
  );
};

export default CustomCard;
```

## Common Patterns Handled

- **Card-based layouts**: Extract to reusable Card component
- **Forms**: Convert to Ant Design Form with proper validation
- **Lists/Tables**: Use Ant Design Table or custom list components
- **Modal dialogs**: Convert to antd Modal
- **Notifications/Alerts**: Use antd Alert, message, or notification
- **Navigation**: Update routes to use React Router

## Logic & API Integration

⚠️ **IMPORTANT**: Components generated by this skill do NOT include business logic or API calls.

**The skill responsibility**:
- Define variable names and state structure
- Create placeholder functions/hooks with TODO comments
- Set up proper TypeScript types for data
- Leave implementation details for the user

**User responsibility**:
- Implement API calls in the TODO sections
- Add business logic as needed
- Handle data fetching, caching, error handling

**Example**:
```typescript
// Component only defines structure - user implements logic
const MyDashboard: React.FC = () => {
  // TODO: Implement API call to fetch dashboard data
  const [stats, setStats] = useState<StatData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: Implement useEffect to call fetchDashboardStats
  useEffect(() => {
    // User: Add your API call here
    // Example: const data = await fetchDashboardStats();
  }, []);

  return (
    <div>
      {/* UI only - logic implemented by user */}
    </div>
  );
};
```

## Important Constraints

- ✅ **DO**: Use Ant Design for common UI patterns (buttons, inputs, forms)
- ✅ **DO**: Preserve Tailwind for layout and custom styling
- ✅ **DO**: Extract repeating components to separate files in @src/components
- ✅ **DO**: Use TypeScript with Props interfaces
- ✅ **DO**: Define variable names and TODO for logic/API implementation
- ❌ **DON'T**: Implement business logic or API calls in components
- ❌ **DON'T**: Import from @src/components/V1 (legacy folder)
- ❌ **DON'T**: Create new components in V1 or other non-standard folders
- ❌ **DON'T**: Mix CSS modules or styled-components with Tailwind

## Error Handling

If the HTML contains:
- **Invalid structure**: Output best-effort component with notes in comments
- **Complex custom widgets**: Keep as-is with Tailwind styling, note for future enhancement
- **External dependencies** (custom JS): Replace with React equivalents or Ant Design
- **Inline styles**: Convert to Tailwind classes

## File Locations

- **Output page**: `src/page/<PageName>.tsx`
- **Extracted components**: `src/components/<ComponentName>.tsx`
- **Do NOT use**: `src/components/V1/` or other custom folders
- **Shared components** (read-only): `src/components/AppHeader.tsx`, `src/components/AppSidebar.tsx`
