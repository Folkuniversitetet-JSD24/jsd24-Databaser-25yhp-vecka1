import express from "express";
import { Pool } from "pg";

import dotenv from "dotenv";
dotenv.config();

// Här kommer vi importera våra user och course router
import UsersRoutes from "./routes/users.js";
import CoursesRoutes from "./routes/courses.js";

const app = express();
app.use(express.json());

const pool = new Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT,
  host: process.env.PG_HOST,
});

(async () => {
  try {
    await pool.connect();
    console.log("Ansluten till db");
  } catch (error) {
    console.error("Fel med anslutningen till db: ", error);
  }
})();

// Koppla våran user route
app.use("/users", UsersRoutes(pool));

// Koppla våran course route
app.use("/courses", CoursesRoutes(pool));

app.listen(5021, () => console.log("Servern körs på http://localhost:5021"));
