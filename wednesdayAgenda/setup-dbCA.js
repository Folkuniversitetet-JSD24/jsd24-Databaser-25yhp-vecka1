import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
});

async function setupDatabase() {
  try {
    await pool.query("BEGIN"); // Startar en transaktion

    // En transaktion är en samling SQL-kommandon som behandlas som en enda helhet. Antingen lyckas alla kommandon, eller så misslyckas hela transaktionen och alla ändringar ångras.

    // Vanliga användningsområden:

    // Säkerställa databasintegritet.

    // Utföra flera relaterade operationer (ex: skapa användare + deras kurser)

    // Users-tabell
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50),
        email VARCHAR(50) UNIQUE
      )
    `);

    // Courses-tabell
    await pool.query(`
      CREATE TABLE courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100),
        description TEXT
      )
    `);

    // Junction-tabell (many-to-many)
    await pool.query(`
      CREATE TABLE user_courses (
        user_id INTEGER REFERENCES users(id),
        course_id INTEGER REFERENCES courses(id),
        PRIMARY KEY (user_id, course_id)
      )
    `);

    await pool.query(`CREATE INDEX idx_user_email ON users(email);`);
    await pool.query(
      `CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);`
    );
    await pool.query("COMMIT"); // Bekräfta ändringar // eller vid fel
    console.log("✅ Databas uppsatt!");
  } catch (err) {
    await pool.query("ROLLBACK"); // Återställ databasen till det tillstånd den var i innan transaktionen påbörjades vid fel. Alla ändringar i transaktionen ignoreras och databasens integritet bibehålls.

    console.error("❌ Fel vid uppsättning av databas:", err);
  } finally {
    pool.end(); // Avsluta anslutning efter att ha kört klart
  }
}

setupDatabase();
