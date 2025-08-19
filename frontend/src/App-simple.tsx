import { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import Home from './pages/Home'

function App() {
    const [currentPage, setCurrentPage] = useState<'home' | 'professor'>('home')
    const [professorId, setProfessorId] = useState<string | null>(null)

    // Simple routing based on URL hash
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash
            if (hash.startsWith('#/professor/')) {
                const id = hash.split('/')[2]
                setProfessorId(id)
                setCurrentPage('professor')
            } else {
                setCurrentPage('home')
                setProfessorId(null)
            }
        }

        handleHashChange()
        window.addEventListener('hashchange', handleHashChange)

        return () => window.removeEventListener('hashchange', handleHashChange)
    }, [])

    return (
        <AuthProvider>
            <div className="min-h-screen bg-gray-50">
                {currentPage === 'home' && <Home />}
                {currentPage === 'professor' && professorId && (
                    <div>Professor page for ID: {professorId}</div>
                )}
            </div>
        </AuthProvider>
    )
}

export default App
