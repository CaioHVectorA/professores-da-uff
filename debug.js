const { Database } = require("bun:sqlite");
const db = new Database("./db.db");
const users = db.query("SELECT * FROM users ORDER BY id DESC LIMIT 5").all();
console.log("Users in DB:", JSON.stringify(users, null, 2));
const schema = db.query("SELECT sql FROM sqlite_master WHERE type=\"table\" AND name=\"users\"").get();
console.log("Users table schema:", schema);
