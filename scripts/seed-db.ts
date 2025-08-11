import { Database } from 'bun:sqlite'
const json = await Bun.file('./professors.json').json();
/*   "Rosa Ines de Novais Cordeiro": {
    "subjects": [
      "Análise Documentária e Recuperação da Informação I",
      "Laboratório de Linguagem Documentária Verbal I"
    ],
    "processedClasses": [
      "https://app.uff.br/graduacao/quadrodehorarios/turmas/100000433520",
      "https://app.uff.br/graduacao/quadrodehorarios/turmas/100000433535"
    ]
  }, 

*/
console.log(Object.values(json).length, 'professors loaded');

const db = new Database('./db.db');

db.exec(`
CREATE TABLE IF NOT EXISTS professors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    picture TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS professor_subjects (
    professor_id INTEGER,
    subject_id INTEGER,
    FOREIGN KEY (professor_id) REFERENCES professors(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);
`);

const insertProfessor = db.prepare('INSERT INTO professors (name) VALUES (?)');
const insertSubject = db.prepare('INSERT INTO subjects (name) VALUES (?)');
const insertProfessorSubject = db.prepare('INSERT INTO professor_subjects (professor_id, subject_id) VALUES (?, ?)');

for (const [name, data] of Object.entries(json)) {
    //@ts-ignore
    const { subjects, processedClasses } = data;
    const result = insertProfessor.run(name);
    const professorId = result.lastInsertRowid;
    for (const subjectName of subjects) {
        let subjectId;
        const existingSubject = db.prepare('SELECT id FROM subjects WHERE name = ?').get(subjectName) as { id: number };
        if (existingSubject) {
            subjectId = existingSubject.id;
        } else {
            const subjectResult = insertSubject.run(subjectName);
            subjectId = subjectResult.lastInsertRowid;
        }
        insertProfessorSubject.run(professorId, subjectId);
    }
}

console.log('Database seeding completed.');
db.close();
