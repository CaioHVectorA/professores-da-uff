'use client';

import { useState, useEffect } from 'react';
import ProfessorCard from '../components/ProfessorCard';
import type { Professor, Subject } from '../types';

export default function Home() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProfessors = async (query: string = '', subject: string = '', pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      const params = new URLSearchParams({
        q: query,
        subject: subject,
        page: pageNum.toString(),
        pageSize: '20',
      });
      const res = await fetch(`/api/professors?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setProfessors(prev => [...prev, ...data.data]);
        } else {
          setProfessors(data.data);
        }
        setHasMore(data.data.length === 20);
      }
    } catch (error) {
      console.error('Failed to fetch professors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessors();
    // Load all subjects for filter
    fetch('/api/subjects')
      .then(res => res.json())
      .then(data => setSubjects(data.data))
      .catch(err => console.error('Error loading subjects:', err));
  }, [page]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setPage(1);
      fetchProfessors(searchQuery, selectedSubject, 1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedSubject]);

  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100 && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProfessors(searchQuery, selectedSubject, nextPage, true);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, hasMore, loading, searchQuery, selectedSubject]);

  if (loading) {
    return (
      <div className="bg-gray-50 flex-1">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="flex space-x-2">
                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex-1">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Professores da UFF
          </h2>
          <p className="text-gray-600">
            Encontre e avalie professores da Universidade Federal Fluminense
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Buscar professores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
            />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Todas as matérias</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.name}>{subject.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professors.map((professor) => (
            <ProfessorCard key={professor.id} professor={professor} />
          ))}
        </div>

        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Carregar mais
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
