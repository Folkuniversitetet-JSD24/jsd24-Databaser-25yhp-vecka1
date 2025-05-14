import { Router } from "express";

export default function UsersRoutes(pool) {
  const router = Router();

  // Get för att hämta alla användare med kurser
  router.get("/", async (req, res) => {
    try {
      const { rows } = await pool.query(`
                SELECT users.*, json_agg(courses.*) AS courses
                    FROM users
                    LEFT JOIN user_courses ON users.id = user_courses.user_id
                    LEFT JOIN courses ON courses.id = user_courses.course_id
                    GROUP BY users.id
                  `);
      //utan  json_agg :

      // user: anna | course: js
      // user: anna | course: node
      // user: anna | course: jstredjekurs

      // json_agg :
      //{"user": anna, "courses": ["js", "node", "tredjekurs"]}

      res.status(200).json({
        success: true,
        message: "Användare och kurser hämtade",
        data: rows,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST för en ny användare + kurser (med en transaktion)
  router.post("/", async (req, res) => {
    const { name, email, courseIds } = req.body;

    const client = await pool.connect();

    try {
      await client.query("BEGIN"); //Begin startar upp transaktionen/"en" koppling med db.

      // skapa användare och retunera id
      const userRes = await client.query(
        "INSERT INTO users (name, email) VALUES ($1,$2) RETURNING *",
        [name, email]
      );

      //   const userId = userRes.rows[0].userId;
      const userId = userRes.rows[0].id;

      //   Koppla användare till flera kurser
      for (let courseId of courseIds) {
        await client.query(
          "INSERT INTO user_courses (user_id, course_id) VALUES ($1,$2)",
          [userId, courseId]
        );
      }
      // COMMIT
      await client.query("COMMIT"); //Bekräftar jag: ändringarna eller vid fel

      // Skicka tillbaka en respose
      res.status(201).json({
        success: true,
        message: "Användare och kurser skapade",
        data: userRes.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");

      console.error("Fel med på post till /users: ", error);
      res.status(500).json({ success: false, error: error.message });
    } finally {
      client.release(); // Släpper anslutningen tillbaka till poolen
    }
  });

  return router;
}
