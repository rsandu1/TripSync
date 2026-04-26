## Packages
date-fns | Date formatting and manipulation for itinerary
framer-motion | Smooth animations for UI elements
react-day-picker | Calendar component for date selection (already in shadcn but confirming)
clsx | Class name utility
tailwind-merge | Class name utility

## Notes
Authentication uses Replit Auth (blueprint:javascript_log_in_with_replit).
Login link should point to /api/login.
Protected routes require checking `useAuth().isAuthenticated`.
Dates from API are ISO strings, need parsing.
