# Admin Panel — Local Guider

## Stack
- React 18 + Vite 5
- MUI v9 + Tailwind CSS
- Redux Toolkit
- React Router v6

## Rules
- Use MUI components (no Tailwind for new components — legacy)
- Design tokens: `T` object at top of each page (border, surface, indigo, violet, etc.)
- Use `PanelHeader` for page titles
- Use `DataGrid` for tables
- Use `useMediaQuery(theme.breakpoints.down('md'))` for mobile (not window.innerWidth)
- All API calls via `api/admin.js` or `apiClient` (not raw axios)
- Role check: only `ADMIN` role allowed