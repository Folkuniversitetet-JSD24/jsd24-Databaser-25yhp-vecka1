import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import UserRoutesCA from "./routes/usersCA.js"; // Importera CA-versionen av routes
import CourseRoutesCA from "./routes/coursesCA.js"; // Importera CA-versionen av routes

dotenv.config();

const { Pool } = pg;

const app = express();
app.use(express.json());

// Skapa pool för effektiv hantering av databasanslutningar
// kan även skapa en db/pool.js-fil enligt best practice
const pool = new Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
});

// Testa anslutning till databasen
(async () => {
  try {
    await pool.connect();
    console.log("✅ Ansluten till databasen");
  } catch (err) {
    console.error("❌ Kunde inte ansluta till databasen:", err);
  }
})();

// Använd user routes efter att ha skapat dem
// Använd CA-versionen av routes
app.use("/users", UserRoutesCA(pool)); // Använd CA-versionen av routes

app.use("/courses", CourseRoutesCA(pool)); // Använd CA-versionen av routes

app.listen(3000, () => console.log("Server körs på port 3000"));
