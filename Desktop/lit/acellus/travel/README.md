# Travel Journal ✈️

A beautiful travel journal application with photo upload and cropping capabilities.

**Created by Kara ❤️**

## Features

- 📝 Create and view travel journal entries
- 📸 Upload and crop photos with interactive cropping tool
- 🖼️ Photo gallery with Instagram-style grid layout
- 🗺️ Location tracking for your adventures
- 🔐 User authentication with password visibility toggle
- 📱 Responsive design with modern UI

## Tech Stack

- **Frontend**: React + TypeScript + Vite + TanStack Router
- **Backend**: Go + Gin Framework
- **Database**: ScyllaDB (CQL)
- **Photo Processing**: React Image Crop

## Local Development

### Prerequisites
- Go 1.21+
- Node.js 18+
- ScyllaDB or Cassandra

### Setup
1. Clone the repository
2. Install frontend dependencies: `npm install`
3. Set up ScyllaDB with the schema in `schema.cql`
4. Start backend: `go run cmd/api/main.go`
5. Start frontend: `npm run dev`

## Deployment

### Railway (Recommended)
1. Push to GitHub
2. Connect Railway to your repository
3. Railway will auto-deploy both services
4. Set environment variables in Railway dashboard

### Environment Variables
- `VITE_API_BASE_URL`: Backend API URL (frontend)
- `PORT`: Server port (backend, defaults to 8080)

## API Endpoints

- `GET /healthz` - Health check
- `POST /register` - User registration
- `POST /login` - User login
- `GET /entries` - Get user entries
- `POST /entries` - Create new entry
- `POST /upload` - Upload photo
- `GET /uploads/*` - Serve uploaded photos

## Photo Features

- **Interactive Cropping**: Square aspect ratio with drag-to-reposition
- **Optimized Processing**: Non-blocking canvas operations
- **Gallery View**: Click photo counter to view all photos
- **Upload Progress**: Visual feedback during photo processing

---

*Built with ❤️ for preserving travel memories*

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
