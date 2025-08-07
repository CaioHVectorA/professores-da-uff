import { Database } from 'bun:sqlite'
const json = await Bun.file('./professors.json').json()
console.log(Object.values(json).length, 'professors loaded');

const db = new Database('./db.db');

db.exec(`
CREATE TABLE IF NOT EXISTS professors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    department TEXT
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

const insertProfessor = db.prepare('INSERT INTO professors (name, email, department) VALUES (?, ?, ?)');
const insertSubject = db.prepare('INSERT INTO subjects (name) VALUES (?)');
const insertProfessorSubject = db.prepare('INSERT INTO professor_subjects (professor_id, subject_id) VALUES (?, ?)');