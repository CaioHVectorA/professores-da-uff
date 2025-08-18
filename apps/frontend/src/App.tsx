import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Home from './pages/Home'
import Professor from './pages/Professor'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/professor/:id" element={<Professor />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
