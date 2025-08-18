# QuadroScrap Frontend

Frontend web application for the QuadroScrap professor evaluation system at UFF.

## Features

- **Home Page**: Browse and search professors
- **Professor Page**: View professor details, subjects, and reviews
- **Authentication**: Login system with email verification
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS

## Technology Stack

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Backend Integration

The frontend is configured to proxy API requests to the backend server running on `http://localhost:8080`. Make sure your backend server is running before starting the frontend.

## Environment

The frontend expects the backend to be running on port 8080. The proxy configuration in `vite.config.ts` automatically forwards all `/api` requests to the backend.

## Pages

### Home (`/`)
- Lists all professors with pagination
- Search functionality
- Professor cards showing name and subjects
- Header with login/logout functionality

### Professor (`/professor/:id`)
- Professor details and subjects
- Average ratings display
- List of reviews with detailed information
- Star ratings for different criteria

## Authentication

The authentication flow:
1. User clicks "Entrar" in the header
2. Modal opens requesting UFF email
3. System sends verification email (or dev token in development)
4. User enters token to complete login
5. Session is stored in localStorage

## Development

The application uses:
- Hot reload for development
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling

## API Integration

The frontend communicates with the backend via REST API:
- `GET /api/professors` - List professors with pagination and search
- `GET /api/professors/:id/reviews` - Get reviews for a specific professor
- `POST /api/auth/request` - Request login email
- `GET /api/auth/verify` - Verify login token
