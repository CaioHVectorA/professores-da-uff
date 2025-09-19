'use client';

import { useState, useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import ProfessorCard from '../components/ProfessorCard';
import type { Professor, Subject } from '../types';

interface HomeClientProps {
    initialProfessors: Professor[];
    initialSubjects: Subject[];
    initialHasMore: boolean;
}

export default function HomeClient({
    initialProfessors,
    initialSubjects,
    initialHasMore
}: HomeClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isFetching,
        refetch
    } = useInfiniteQuery({
        queryKey: ['professors', searchQuery, selectedSubject],
        queryFn: async ({ pageParam = 1 }) => {
            const params = new URLSearchParams({
                q: searchQuery,
                subject: selectedSubject,
                page: pageParam.toString(),
                pageSize: '20',
            });
            const res = await fetch(`/api/professors?${params}`);
            if (!res.ok) throw new Error('Failed to fetch professors');
            const data = await res.json();
            return {
                professors: data.data,
                nextPage: data.data.length === 20 ? pageParam + 1 : undefined
            };
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialData: {
            pages: [{
                professors: initialProfessors,
                nextPage: initialHasMore ? 2 : undefined
            }],
            pageParams: [1]
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const professors = data?.pages.flatMap(page => page.professors) || [];

    // Intersection Observer for infinite loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            refetch();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, selectedSubject, refetch]);

    return (
        <div className="bg-gray-50 min-h-screen">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Avaliação de Professores UFF
                    </h1>
                    <p className="text-xl text-gray-600">
                        Encontre e avalie os melhores professores da Universidade Federal Fluminense
                    </p>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Buscar professor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="md:w-64">
                            <input
                                type="text"
                                placeholder="Filtrar por matéria..."
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                list="subjects-list"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <datalist id="subjects-list">
                                {initialSubjects.map((subject) => (
                                    <option key={subject.id} value={subject.name} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                </div>

                {/* Search Progress Indicator */}
                {isFetching && !isLoading && (
                    <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Buscando professores...</p>
                    </div>
                )}

                {/* Professors Grid */}
                {isLoading && professors.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Carregando professores...</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {professors.map((professor) => (
                                <ProfessorCard key={professor.id} professor={professor} />
                            ))}
                        </div>

                        {/* Infinite Loading Trigger */}
                        {hasNextPage && (
                            <div ref={loadMoreRef} className="text-center py-4">
                                {isFetchingNextPage && (
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                )}
                            </div>
                        )}

                        {professors.length === 0 && !isLoading && !searchQuery && !selectedSubject && (
                            <div className="text-center py-12">
                                <p className="text-gray-600">Nenhum professor encontrado.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
