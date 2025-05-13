import { Router } from "express";

export default function CourseRoutes(pool) {
  const router = Router();

  // GET: Hämta alla kurser
  router.get("/", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM courses");

      res.status(200).json({
        success: true,
        message: "Kurser hämtade.",
        data: result.rows,
      });
    } catch (err) {
      console.error("GET /courses error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST: Skapa ny kurs
  router.post("/", async (req, res) => {
    const { title, description } = req.body;

    try {
      const result = await pool.query(
        "INSERT INTO courses (title, description) VALUES ($1, $2) RETURNING *",
        [title, description]
      );

      res.status(201).json({
        success: true,
        message: "Kurs skapad.",
        data: result.rows[0],
      });
    } catch (err) {
      console.error("POST /courses error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
