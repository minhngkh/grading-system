# GitHub Copilot Instructions

## Project Overview

Building a modern web application using:

- Vite
- React
- TypeScript
- TanStack Router
- shadcn/ui

## Code Generation Guidelines

### Framework and Setup

- Initialize projects using Vite with React + TypeScript template
- Follow React 18+ best practices
- Use strict TypeScript configuration (`strictNullChecks`, `noImplicitAny`)
- Include ESLint and Prettier for consistent code formatting and linting
- Use `pnpm` or `yarn` for dependency management (optional)

### Routing

- Implement routing using TanStack Router
- Create type-safe route definitions
- Use loader and action patterns for data fetching
- Use `lazy()` and `Suspense` for route-level code-splitting
- Implement route-level error boundaries and fallback UI

### UI Components

- Utilize shadcn/ui components
- Follow their styling conventions
- Maintain consistent theming
- Use Tailwind CSS for custom styling
- Create reusable utility components for common patterns (e.g., modals, toasts)
- Use Tailwind's `@apply` for consistent styling

### TypeScript

- Write strongly-typed components
- Define proper interfaces and types
- Avoid using 'any' type
- Use `zod` for runtime type validation
- Implement proper error handling

### Code Structure

- Follow feature-based folder structure
- Separate business logic from UI components
- Use a `services/` folder for API calls and external integrations
- Document folder structure in `README.md`
- Implement proper state management
- Write clean, modular code

### Best Practices

- Follow React hooks guidelines
- Implement proper error boundaries
- Use proper loading states
- Follow accessibility standards (audit with Lighthouse or Axe)
- Use React Profiler for performance monitoring
- Implement responsive design
- Follow performance optimization practices
- All files should be in .tsx
