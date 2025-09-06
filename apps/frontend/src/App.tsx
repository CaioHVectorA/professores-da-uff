import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Home from './pages/Home'
import Professor from './pages/Professor'
import MagicLink from './pages/MagicLink'
import AuthError from './pages/AuthError'

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/professor/:id" element={<Professor />} />
            <Route path="/magic-link" element={<MagicLink />} />
            <Route path="/auth-error" element={<AuthError />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
