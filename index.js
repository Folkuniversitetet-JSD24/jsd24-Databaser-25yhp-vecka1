import express from "express";
import pg from "pg";

const { Pool } = pg;

const app = express();

app.use(express.json());

// Anslutning med Pool till DB
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "expressconnectiondemo",
  password: "degerfors85",
  port: 5432,
});

// Tydligt se om anslutningen gick bra
(async () => {
  try {
    await pool.connect();
    console.log("Ansluten till databasen");
  } catch (error) {
    console.error("Kunde inte ansluta till databasen", error);
  }
})();

// CRUD för users

// GET route för att hämta alla users/användare
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    console.log("result", result);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("FEL: ", error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Skapa en användare
app.post("/users", async (req, res) => {
  const { name, email } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
      [name, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("FEL: ", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT - uppdatera en user
app.put("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    const result = await pool.query(
      "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *",

      [name, email, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Användaren hittades inte!" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("FEL: ", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE
app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",

      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Användaren hittades inte!" });
    }

    res
      .status(200)
      .json({ message: "Användaren raderad", user: result.rows[0] });
  } catch (error) {
    console.error("FEL: ", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(8541, () => console.log("Servern körs på http://localhost:8541"));
