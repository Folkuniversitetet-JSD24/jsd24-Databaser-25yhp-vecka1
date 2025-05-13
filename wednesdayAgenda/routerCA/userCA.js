import { Router } from "express";

export default function UserRoutesCA(pool) {
  const router = Router();

  // GET alla användare med kurser (JOIN)
  router.get("/", async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT users.*, json_agg(courses.*) AS courses
        FROM users
        LEFT JOIN user_courses ON users.id = user_courses.user_id
        LEFT JOIN courses ON courses.id = user_courses.course_id
        GROUP BY users.id
      `);
      //   json_agg() är en PostgreSQL-funktion som:
      // Aggregerar flera rader från en JOIN till en JSON-array.
      // Används för att smidigt samla relaterad data i ett snyggt format för frontend.

      // Exempel på resultat utan json_agg:
      // user: Anna | course: JavaScript
      // user: Anna | course: Node.js
      // user: Anna | course: SQL

      // Med json_agg:
      // {
      //     "user": "Anna",
      //     "courses": ["JavaScript", "Node.js", "SQL"]
      //   }

      //   Detta gör att vi kan hämta alla kurser för varje användare i en enda fråga istället för flera.
      //   Det är också mer effektivt och minskar antalet frågor till databasen.

      //   Standardiserat API-format.
      res.status(200).json({
        success: true,
        message: "Användare och kurser hämtade.",
        data: rows,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST ny användare + kurser (med transaktion)
  router.post("/", async (req, res) => {
    const { name, email, courseIds } = req.body;
    const client = await pool.connect(); // Hämta en klient från poolen
    try {
      await client.query("BEGIN"); // Starta transaktion

      // Skapa användare och returnera id
      const userRes = await client.query(
        "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
        [name, email]
      );
      const userId = userRes.rows[0].id;

      // Koppla användaren till flera kurser
      for (let courseId of courseIds) {
        await client.query(
          "INSERT INTO user_courses (user_id, course_id) VALUES ($1, $2)",
          [userId, courseId]
        );
      }

      await client.query("COMMIT"); // Allt gick bra, spara permanent

      res.status(201).json({
        success: true,
        message: "Användare och kurser skapade!",
        data: userRes.rows[0],
      });
    } catch (err) {
      await client.query("ROLLBACK"); // Något gick fel, återställ allt
      console.error("POST /users error:", err);
      res.status(500).json({
        success: false,
        error: err.message,
      });
    } finally {
      client.release();
      //   När du använder en klient från pool måste du alltid frigöra den efter att du är klar, annars tar de slut.

      // release() säger till poolen: ”Nu är jag färdig med klienten, du kan använda den igen.”

      // Alltid i finally-block för säker frigöring!
    }
  });

  return router;
}
