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
// ----- GET PRODUCTS -----
app.get("/api/products", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                products.id, 
                products.name, 
                products.price, 
                products.image_url,
                products.stock_quantity,
                vendors.business_name AS vendor_name,
                categories.name AS category_name
            FROM products
            JOIN vendors ON products.vendor_id = vendors.id
            LEFT JOIN categories ON products.category_id = categories.id
            ORDER BY products.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not fetch products" });
    }
});

// ----- GET SINGLE PRODUCT -----
app.get("/api/products/:id", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                products.id, 
                products.name, 
                products.description,
                products.price, 
                products.image_url,
                products.stock_quantity,
                vendors.id AS vendor_id,
                vendors.business_name AS vendor_name,
                vendors.location AS vendor_location,
                categories.name AS category_name
            FROM products
            JOIN vendors ON products.vendor_id = vendors.id
            LEFT JOIN categories ON products.category_id = categories.id
            WHERE products.id = ?
        `, [req.params.id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not fetch product" });
    }
});

// ----- GET OTHER PRODUCTS FROM SAME VENDOR -----
app.get("/api/vendors/:vendorId/products", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT id, name, price 
            FROM products 
            WHERE vendor_id = ? AND id != ?
            LIMIT 4
        `, [req.params.vendorId, req.query.exclude || 0]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not fetch vendor products" });
    }
});
// ----- GET CATEGORIES -----
app.get("/api/categories", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, name FROM categories ORDER BY name");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not fetch categories" });
    }
});
// ----- CHECK LOGIN STATUS -----
app.get("/api/me", (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Not logged in" });
    }
    res.json({ userId: req.session.userId, role: req.session.role });
});

// ----- CREATE ORDER -----
app.post("/api/orders", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "You must be logged in to place an order" });
    }

    const { items, deliveryMethod } = req.body; // items: [{ productId, quantity }]

    if (!items || items.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Fetch current prices from DB (never trust prices sent from the browser)
        let total = 0;
        const itemsWithPrices = [];

        for (const item of items) {
            const [rows] = await connection.query(
                "SELECT id, price FROM products WHERE id = ?",
                [item.productId]
            );
            if (rows.length === 0) throw new Error(`Product ${item.productId} not found`);

            const price = Number(rows[0].price);
            total += price * item.quantity;
            itemsWithPrices.push({ productId: item.productId, quantity: item.quantity, price });
        }

        const [orderResult] = await connection.query(
            "INSERT INTO orders (customer_id, status, delivery_method, total_amount) VALUES (?, 'pending', ?, ?)",
            [req.session.userId, deliveryMethod || 'pickup', total]
        );

        const orderId = orderResult.insertId;

        for (const item of itemsWithPrices) {
            await connection.query(
                "INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)",
                [orderId, item.productId, item.quantity, item.price]
            );
        }

        await connection.commit();
        res.status(201).json({ message: "Order placed successfully", orderId, total });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: "Could not place order" });
    } finally {
        connection.release();
    }
});

// ----- CREATE PRODUCT (vendor only) -----
app.post("/api/vendor/products", async (req, res) => {
    if (!req.session.userId || req.session.role !== "vendor") {
        return res.status(403).json({ error: "Only approved vendors can add products" });
    }

    const { name, description, price, category_id, stock_quantity } = req.body;

    if (!name || !price) {
        return res.status(400).json({ error: "Name and price are required" });
    }

    try {
        // Find this vendor's own vendor record and check they're approved
        const [vendorRows] = await pool.query(
            "SELECT id, approved FROM vendors WHERE user_id = ?",
            [req.session.userId]
        );

        if (vendorRows.length === 0) {
            return res.status(403).json({ error: "No vendor profile found for this account" });
        }
        if (!vendorRows[0].approved) {
            return res.status(403).json({ error: "Your vendor account is not yet approved" });
        }

        const vendorId = vendorRows[0].id;

        const [result] = await pool.query(
            "INSERT INTO products (vendor_id, category_id, name, description, price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)",
            [vendorId, category_id || null, name, description || "", price, stock_quantity || 0]
        );

        res.status(201).json({ message: "Product added successfully", productId: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not add product" });
    }
});
// ----- GET VENDOR'S OWN PRODUCTS -----
app.get("/api/vendor/my-products", async (req, res) => {
    if (!req.session.userId || req.session.role !== "vendor") {
        return res.status(403).json({ error: "Vendor access only" });
    }

    try {
        const [vendorRows] = await pool.query(
            "SELECT id FROM vendors WHERE user_id = ?",
            [req.session.userId]
        );
        if (vendorRows.length === 0) {
            return res.status(403).json({ error: "No vendor profile found" });
        }

        const [products] = await pool.query(
            "SELECT id, name, price, stock_quantity, created_at FROM products WHERE vendor_id = ? ORDER BY created_at DESC",
            [vendorRows[0].id]
        );
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not fetch your products" });
    }
});

// ----- GET ORDERS CONTAINING VENDOR'S PRODUCTS -----
app.get("/api/vendor/my-orders", async (req, res) => {
    if (!req.session.userId || req.session.role !== "vendor") {
        return res.status(403).json({ error: "Vendor access only" });
    }

    try {
        const [vendorRows] = await pool.query(
            "SELECT id FROM vendors WHERE user_id = ?",
            [req.session.userId]
        );
        if (vendorRows.length === 0) {
            return res.status(403).json({ error: "No vendor profile found" });
        }

        const [rows] = await pool.query(`
            SELECT 
                orders.id AS order_id,
                orders.status,
                orders.delivery_method,
                orders.created_at,
                products.name AS product_name,
                order_items.quantity,
                order_items.price_at_purchase,
                users.full_name AS customer_name
            FROM order_items
            JOIN orders ON order_items.order_id = orders.id
            JOIN products ON order_items.product_id = products.id
            JOIN users ON orders.customer_id = users.id
            WHERE products.vendor_id = ?
            ORDER BY orders.created_at DESC
        `, [vendorRows[0].id]);

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not fetch your orders" });
    }
});
     

// ----- GET PENDING VENDORS (admin only) -----
app.get("/api/admin/pending-vendors", async (req, res) => {
    if (!req.session.userId || req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access only" });
    }

    try {
        const [rows] = await pool.query(`
            SELECT vendors.id, vendors.business_name, vendors.category, vendors.location, users.full_name, users.email
            FROM vendors
            JOIN users ON vendors.user_id = users.id
            WHERE vendors.approved = FALSE
            ORDER BY vendors.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not fetch pending vendors" });
    }
});

// ----- APPROVE A VENDOR (admin only) -----
app.post("/api/admin/approve-vendor/:id", async (req, res) => {
    if (!req.session.userId || req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access only" });
    }

    try {
        await pool.query("UPDATE vendors SET approved = TRUE WHERE id = ?", [req.params.id]);
        res.json({ message: "Vendor approved" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not approve vendor" });
    }
});

app.listen(PORT, () => {
    console.log(`SDU Mart server running on http://localhost:${PORT}`);
});