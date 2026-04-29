# Dashboard Container

This directory contains the refactored dashboard components following the same patterns as the Messages component.

## Component Structure
- `index.jsx` - Main dashboard container that orchestrates all sub-components
- `components/` - Contains individual dashboard widgets and sections
  - `DashboardHeader.jsx` - Header with title and timespan selector
  - `DashboardStats.jsx` - Main statistics cards
  - `DashboardGraphs.jsx` - Data visualization components (converted to functional component)
  - `DashboardTickets.jsx` - Overdue tickets table
  - `DashboardQuickStats.jsx` - Quick statistics table
  - `DashboardTopGroups.jsx` - Top groups statistics
  - `DashboardTopTags.jsx` - Top tags statistics

## Improvements Made
- Split monolithic component into smaller, focused components
- Implemented performance optimizations with React.memo
- Fixed PropTypes validation for Immutable.js objects
- Improved code organization and separation of concerns
- Converted DashboardGraphs component to traditional functional component syntax

## Component Details

### DashboardHeader.jsx
- Displays the dashboard header with title and timespan selector
- Uses TitleContext for dynamic page titles
- Integrates with React Helmet for SEO metadata

### DashboardStats.jsx
- Shows main statistics cards with key metrics
- Implements responsive design patterns
- Uses TruCard component for consistent styling

### DashboardGraphs.jsx
- Renders ticket breakdown data visualization
- Uses MGraph component for chart rendering
- Handles loading states and data display

### DashboardTickets.jsx
- Displays overdue tickets table
- Implements table sorting and filtering capabilities
- Uses TruCard component for consistent styling

### DashboardQuickStats.jsx
- Shows quick statistics in a compact table format
- Provides at-a-glance metrics
- Uses TruCard component for consistent styling

### DashboardTopGroups.jsx
- Displays top groups statistics
- Shows group-based ticket distribution
- Uses TruCard component for consistent styling

### DashboardTopTags.jsx
- Displays top tags statistics
- Shows tag-based ticket distribution
- Uses TruCard component for consistent styling

## Usage
The dashboard components are designed to work together as a cohesive unit. The main `index.jsx` file orchestrates all sub-components and passes necessary data and props between them.

## Dependencies
- React 16+
- PropTypes for component prop validation
- react-helmet-async for document head management
- TruCard component for consistent UI styling
- MGraph component for data visualization
