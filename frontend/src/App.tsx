import { AuthProvider } from './contexts/AuthContext'
import Home from './pages/Home'

function App() {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-gray-50">
                <Home />
            </div>
        </AuthProvider>
    )
}

export default App
