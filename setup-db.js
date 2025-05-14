import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT,
  host: process.env.PG_HOST,
});

async function setupDatabase() {
  const client = await pool.connect(); //Här hämtar vi en dedikerad anslutning

  try {
    await client.query("BEGIN"); //Begin startar upp transaktionen/"en" koppling med db.

    // Users-tabell
    await client.query(`
          CREATE TABLE users (
              id SERIAL PRIMARY KEY,    
              name VARCHAR(50),
              email VARCHAR(50)
      )
          `);

    // Courses-tabell
    await client.query(`
            CREATE TABLE courses (
                id SERIAL PRIMARY KEY,    
                title VARCHAR(50),
                description TEXT
        )
            `);

    // junction-tabell
    await client.query(`
                CREATE TABLE user_courses (
                    user_id INTEGER REFERENCES users(id),    
                    course_id INTEGER REFERENCES courses(id),    
                    PRIMARY KEY (user_id,course_id)
            )
                `);

    //   Index syntax för att göra vår db snabbare genom att indexera så lättare att hitta i db
    await client.query(`CREATE INDEX idx_user_email ON users(email);`);
    await client.query(
      `CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);`
    );

    await client.query("COMMIT"); //Bekräftar jag: ändringarna eller vid fel

    console.log("Databasen och transaktion åtminstone startades.");
  } catch (error) {
    await client.query("ROLLBACK"); // Roolback återställer db till det tillstånd den var innan transaktionen börjades (BEGIN) vid fel.

    console.error("Fel med koppning/transaktionen av/mot db: ", error);
  } finally {
    client.release(); // Släpper anslutningen tillbaka till poolen

    await pool.end(); // Avsluta anslutningen efter den har körts
  }
}

setupDatabase();
