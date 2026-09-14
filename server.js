const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const pool = require("./db");

const app = express();
const PORT = 3000;

// Parse incoming form/JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve your frontend files
app.use(express.static(path.join(__dirname, "Public")));

// Sessions (keeps track of who's logged in)
app.use(session({
    secret: "sdu-mart-secret-key-change-later",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// ----- REGISTER -----
app.post("/api/register", async (req, res) => {
    const { fullName, phone, email, password, role, shopName, category, shopLocation } = req.body;

    if (!fullName || !email || !password || !phone) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const userRole = role === "vendor" ? "vendor" : "customer";

    try {
        const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(409).json({ error: "Email already registered" });
        }

        const password_hash = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            "INSERT INTO users (full_name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
            [fullName, email, password_hash, userRole, phone]
        );

        const newUserId = result.insertId;

        if (userRole === "vendor") {
            await pool.query(
                "INSERT INTO vendors (user_id, business_name, category, location) VALUES (?, ?, ?, ?)",
                [newUserId, shopName || "", category || "", shopLocation || ""]
            );
        }

        res.status(201).json({ message: "Registered successfully", userId: newUserId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// ----- LOGIN -----
app.post("/api/login", async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ error: "Missing email/phone or password" });
    }

    try {
        const [rows] = await pool.query(
            "SELECT * FROM users WHERE email = ? OR phone = ?",
            [identifier, identifier]
        );
        if (rows.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        req.session.userId = user.id;
        req.session.role = user.role;

        res.json({ message: "Logged in successfully", role: user.role });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// ----- LOGOUT -----
app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ message: "Logged out" });
    });
});

app.listen(PORT, () => {
    console.log(`SDU Mart server running on http://localhost:${PORT}`);
});