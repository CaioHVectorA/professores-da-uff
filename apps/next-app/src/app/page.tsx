import Header from "../components/Header";
import ProfessorCard from "../components/ProfessorCard";
import type { Professor } from "../types";

async function getProfessors(
  q: string = "",
  page: number = 1,
  pageSize: number = 20
) {
  const params = new URLSearchParams({
    q,
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  const res = await fetch(`/api/professors?${params}`);
  if (!res.ok) throw new Error("Failed to fetch professors");
  return res.json();
}

export default async function Home() {
  const { data: professors } = await getProfessors();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={true} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Professores</h2>
          <p className="mt-2 text-gray-600">
            Encontre avaliações e informações sobre professores
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professors.map((professor: Professor) => (
            <ProfessorCard key={professor.id} professor={professor} />
          ))}
        </div>
      </main>
    </div>
  );
}
