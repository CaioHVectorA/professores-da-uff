'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface ReviewFormProps {
    professorId: number
    subjects: { id: number; name: string }[]
    onReviewCreated: () => void
}

export default function ReviewForm({ professorId, subjects, onReviewCreated }: ReviewFormProps) {
    const [formData, setFormData] = useState({
        subjectId: '',
        review: '',
        didaticQuality: 0,
        materialQuality: 0,
        examsDifficulty: 0,
        personality: 0,
        requiresPresence: false,
        examMethod: '',
        anonymous: true
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleStarClick = (field: string, rating: number) => {
        setFormData(prev => ({ ...prev, [field]: rating }))
    }

    const renderStars = (field: string, currentRating: number) => {
        return [...Array(5)].map((_, i) => (
            <button
                key={i}
                type="button"
                onClick={() => handleStarClick(field, i + 1)}
                className="focus:outline-none"
            >
                <Star
                    size={24}
                    className={i < currentRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                />
            </button>
        ))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await fetch(`/api/professors/${professorId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    subjectId: parseInt(formData.subjectId)
                }),
            })

            if (response.ok) {
                onReviewCreated()
            } else {
                console.error('Failed to create review')
            }
        } catch (error) {
            console.error('Error creating review:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disciplina
                </label>
                <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                    required
                >
                    <option value="">Selecione uma disciplina</option>
                    {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id.toString()}>{subject.name}</option>
                    ))}
                    <option value="outro">Outro</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avaliação
                </label>
                <textarea
                    value={formData.review}
                    onChange={(e) => setFormData(prev => ({ ...prev, review: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Escreva sua avaliação..."
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Didática
                    </label>
                    <div className="flex space-x-1">
                        {renderStars('didaticQuality', formData.didaticQuality)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Qualidade do ensino e clareza das explicações</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Material
                    </label>
                    <div className="flex space-x-1">
                        {renderStars('materialQuality', formData.materialQuality)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Qualidade dos materiais didáticos fornecidos</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Avaliações acessíveis
                    </label>
                    <div className="flex space-x-1">
                        {renderStars('examsDifficulty', formData.examsDifficulty)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Facilidade de compreensão das avaliações</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Personalidade
                    </label>
                    <div className="flex space-x-1">
                        {renderStars('personality', formData.personality)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Atitude e relacionamento com os alunos</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Avaliação
                </label>
                <select
                    value={formData.examMethod}
                    onChange={(e) => setFormData(prev => ({ ...prev, examMethod: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
                >
                    <option value="">Selecione</option>
                    <option value="Prova escrita">Prova escrita</option>
                    <option value="Prova oral">Prova oral</option>
                    <option value="Trabalho">Trabalho</option>
                    <option value="Projeto">Projeto</option>
                    <option value="Outro">Outro</option>
                </select>
            </div>

            <div className="flex items-center space-x-4">
                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={formData.requiresPresence}
                        onChange={(e) => setFormData(prev => ({ ...prev, requiresPresence: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Cobra presença?</span>
                </label>

                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={formData.anonymous}
                        onChange={(e) => setFormData(prev => ({ ...prev, anonymous: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Anonimato</span>
                </label>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Enviando...' : 'Enviar Avaliação'}
            </button>
        </form>
    )
}
