import { Router } from "express";

export default function CoursesRoutes(pool) {
  const router = Router();

  // Get för att hämta alla kurser
  router.get("/", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM courses");

      // Skicka tillbaka en respose
      res.status(200).json({
        success: true,
        message: "Kurser hämtades",
        data: result.rows,
      });
    } catch (error) {
      console.error("Fel med på get till /courses: ", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // POST för att skapa en ny kurs
  router.post("/", async (req, res) => {
    const { title, description } = req.body;

    try {
      const result = await pool.query(
        "INSERT INTO courses (title, description) VALUES ($1,$2) RETURNING *",
        [title, description]
      );

      // Skicka tillbaka en respose
      res.status(201).json({
        success: true,
        message: "Kurser skapades",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Fel med på post till /courses: ", error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
}
