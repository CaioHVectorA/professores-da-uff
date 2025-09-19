import { Suspense } from 'react';
import HomeClient from './HomeClient';
import type { Professor, Subject } from '../types';

async function getInitialData() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000')
  try {
    const [professorsResponse, subjectsResponse] = await Promise.all([
      fetch(`${baseUrl}/api/professors?page=1&pageSize=20`, {
        cache: 'no-store'
      }),
      fetch(`${baseUrl}/api/subjects`, {
        cache: 'force-cache' // Cache subjects as they don't change often
      })
    ]);

    const professorsData = professorsResponse.ok ? await professorsResponse.json() : { data: [] };
    const subjectsData = subjectsResponse.ok ? await subjectsResponse.json() : { data: [] };

    return {
      professors: professorsData.data || [],
      subjects: subjectsData.data || [],
      hasMore: professorsData.data?.length === 20
    };
  } catch (error) {
    console.error('Error fetching initial data:', error);
    return {
      professors: [],
      subjects: [],
      hasMore: false
    };
  }
}

export default async function Home() {
  const initialData = await getInitialData();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeClient
        initialProfessors={initialData.professors}
        initialSubjects={initialData.subjects}
        initialHasMore={initialData.hasMore}
      />
    </Suspense>
  );
}
