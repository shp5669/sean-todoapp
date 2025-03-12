const PORT = process.env.PORT ?? 8000;
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const app = express();
const pool = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

app.use(cors({ origin: "*", credentials: true })); // Allow frontend connection
app.use(express.json()); // Enable JSON parsing

// ✅ Test Route (Fixes "Cannot GET /" issue)
app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// ✅ Get all todos for a user
app.get("/todos/:userEmail", async (req, res) => {
  const { userEmail } = req.params;
  try {
    const todos = await pool.query(
      "SELECT * FROM todos WHERE user_email = $1",
      [userEmail]
    );
    res.json(todos.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Create a new todo
app.post("/todos", async (req, res) => {
  const { user_email, title, progress, date } = req.body;
  const id = uuidv4();
  try {
    const newToDo = await pool.query(
      "INSERT INTO todos(id, user_email, title, progress, date) VALUES($1, $2, $3, $4, $5) RETURNING *",
      [id, user_email, title, progress, date]
    );
    res.status(201).json(newToDo.rows[0]); // Return created item
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Edit a todo
app.put("/todos/:id", async (req, res) => {
  const { id } = req.params;
  const { user_email, title, progress, date } = req.body;
  try {
    const editToDo = await pool.query(
      "UPDATE todos SET user_email = $1, title = $2, progress = $3, date = $4 WHERE id = $5 RETURNING *",
      [user_email, title, progress, date, id]
    );
    if (editToDo.rowCount === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.json(editToDo.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Delete a todo
app.delete("/todos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleteToDo = await pool.query(
      "DELETE FROM todos WHERE id = $1 RETURNING *",
      [id]
    );
    if (deleteToDo.rowCount === 0) {
      return res.status(404).json({ error: "Todo not found" });
    }
    res.json({ message: "Todo deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Signup Route
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  try {
    const signUp = await pool.query(
      "INSERT INTO users (email, hashed_password) VALUES($1, $2) RETURNING *",
      [email, hashedPassword]
    );
    const token = jwt.sign({ email }, process.env.JWT_SECRET || "secret", {
      expiresIn: "1h",
    });

    res.status(201).json({ email, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const users = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (!users.rows.length)
      return res.status(404).json({ error: "User does not exist!" });

    const success = await bcrypt.compare(
      password,
      users.rows[0].hashed_password
    );
    if (!success) return res.status(401).json({ error: "Login failed" });

    const token = jwt.sign({ email }, process.env.JWT_SECRET || "secret", {
      expiresIn: "1h",
    });

    res.json({ email: users.rows[0].email, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Start Server
app.listen(PORT, () => console.log(`🚀 Server running on PORT ${PORT}`));
