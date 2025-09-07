'use client';

import { useState, useEffect } from 'react';
import ProfessorCard from '../components/ProfessorCard';
import type { Professor, Subject } from '../types';

export default function Home() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [infiniteLoading, setInfiniteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProfessors = async (query: string = '', subject: string = '', pageNum: number = 1, append: boolean = false, showLoading: boolean = true) => {
    try {
      console.log('Fetching professors with:', { query, subject, pageNum, append, showLoading });
      if (showLoading && !append) setInitialLoading(true);
      if (append) setInfiniteLoading(true);
      const params = new URLSearchParams({
        q: query,
        subject: subject,
        page: pageNum.toString(),
        pageSize: '20',
      });
      console.log('Request params:', params.toString());
      const res = await fetch(`/api/professors?${params}`);
      console.log('Response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched data:', data);
        if (append) {
          setProfessors(prev => {
            const newProfessors = [...prev, ...data.data];
            console.log('Appended professors, new length:', newProfessors.length);
            return newProfessors;
          });
        } else {
          console.log('Setting professors to:', data.data.length, 'items');
          setProfessors(data.data);
        }
        setHasMore(data.data.length === 20);
        console.log('Has more:', data.data.length === 20);
      } else {
        console.error('Fetch failed with status:', res.status);
      }
    } catch (error) {
      console.error('Failed to fetch professors:', error);
    } finally {
      if (showLoading && !append) setInitialLoading(false);
      if (append) setInfiniteLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessors('', '', 1, false, true);
    // Load all subjects for filter
    fetch('/api/subjects')
      .then(res => res.json())
      .then(data => setSubjects(data.data))
      .catch(err => console.error('Error loading subjects:', err));
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setPage(1);
      fetchProfessors(searchQuery, selectedSubject, 1, false, false);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedSubject]);

  const handleScroll = () => {
    if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100 && hasMore && !infiniteLoading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProfessors(searchQuery, selectedSubject, nextPage, true, false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [page, hasMore, infiniteLoading, searchQuery, selectedSubject]);

  if (initialLoading) {
    return (
      <div className="flex-1">
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
    <div className="flex-1">
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
            <input
              type="text"
              placeholder="Filtrar por matéria..."
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              list="subjects"
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 bg-white"
            />
            <datalist id="subjects">
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professors.map((professor) => (
            <ProfessorCard key={professor.id} professor={professor} />
          ))}
        </div>

        {infiniteLoading && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Carregando mais...</span>
            </div>
          </div>
        )}

        {!hasMore && professors.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            Não há mais professores para carregar.
          </div>
        )}
      </main>
    </div>
  );
}
