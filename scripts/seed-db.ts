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
PRAGMA foreign_keys = ON;

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

-- Users for magic-link auth: store only a hash of the email (with server-side pepper) and verification status
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_hash TEXT NOT NULL UNIQUE,
    verified_at TIMESTAMP DEFAULT NULL,
    is_admin INTEGER DEFAULT 0, -- 0 or 1
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- One-time magic link tokens (store only token hash)
CREATE TABLE IF NOT EXISTS magic_link_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    purpose TEXT DEFAULT 'signin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP DEFAULT NULL,
    request_ip TEXT DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Optional session table if you issue persistent sessions after verifying the magic link
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token_hash TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS review (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professor_id INTEGER,
    subject_id INTEGER,
    user_id INTEGER,
    review TEXT NOT NULL,
    approved INTEGER DEFAULT 0 CHECK (approved IN (0,1)),
    didatic_quality INTEGER DEFAULT 1 CHECK (didatic_quality BETWEEN 1 AND 5), -- 1 to 5
    material_quality INTEGER DEFAULT 1 CHECK (material_quality BETWEEN 1 AND 5), -- 1 to 5
    exams_difficulty INTEGER DEFAULT 1 CHECK (exams_difficulty BETWEEN 1 AND 5), -- 1 to 5
    personality INTEGER DEFAULT 1 CHECK (personality BETWEEN 1 AND 5), -- 1 to 5
    requires_presence INTEGER DEFAULT 0 CHECK (requires_presence IN (0,1)), -- 0 or 1
    exam_method TEXT DEFAULT NULL,
    anonymous INTEGER DEFAULT 1 CHECK (anonymous IN (0,1)), -- 0 or 1
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES professors(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_professor_name ON professors(name);
CREATE INDEX IF NOT EXISTS idx_subject_name ON subjects(name);
CREATE INDEX IF NOT EXISTS idx_review_professor ON review(professor_id);
CREATE INDEX IF NOT EXISTS idx_review_subject ON review(subject_id);
CREATE INDEX IF NOT EXISTS idx_magic_link_user ON magic_link_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
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
