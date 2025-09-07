'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import type { Course } from '@/types'

interface ProfileModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { user } = useAuth()
    const [courses, setCourses] = useState<Course[]>([])
    const [formData, setFormData] = useState({
        courseId: '',
        experience: '',
        suggestion: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            // Load courses
            fetch('/api/courses')
                .then(res => res.json())
                .then(data => setCourses(data.data))
                .catch(err => console.error('Error loading courses:', err))

            // Load user data
            fetch('/api/user/course')
                .then(res => res.json())
                .then(data => {
                    if (data.data?.courseId) {
                        setFormData(prev => ({ ...prev, courseId: data.data.courseId.toString() }))
                    }
                })
                .catch(err => console.error('Error loading user course:', err))

            // Do not load previous report to keep experience and suggestion empty
        }
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // Update user course only if selected
            if (formData.courseId) {
                await fetch('/api/user/course', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseId: parseInt(formData.courseId) })
                })
            }

            // Create report only if has content
            if (formData.experience.trim() || formData.suggestion.trim()) {
                await fetch('/api/reports', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        experience: formData.experience,
                        suggestion: formData.suggestion
                    })
                })
            }

            onClose()
        } catch (error) {
            console.error('Error updating profile:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Perfil</h2>
                <p className="text-sm text-gray-600 mb-4">Tudo é opcional. Você pode preencher apenas o que desejar.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Seu Curso
                        </label>
                        <select
                            value={formData.courseId}
                            onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                        >
                            <option value="">Selecione seu curso</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id.toString()}>{course.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Selecionar seu curso ajuda a melhorar a experiência geral da plataforma.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Como está sendo sua experiência com os professores da UFF?
                        </label>
                        <textarea
                            value={formData.experience}
                            onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                            placeholder="Compartilhe sua experiência..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sugestão
                        </label>
                        <textarea
                            value={formData.suggestion}
                            onChange={(e) => setFormData(prev => ({ ...prev, suggestion: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                            placeholder="Alguma sugestão para melhorar?"
                        />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
