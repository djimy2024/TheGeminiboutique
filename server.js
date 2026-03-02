const express = require("express");
const cors = require("cors");
const session = require("express-session");
const ExcelJS = require("exceljs");
const { Pool } = require("pg");

const app = express();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

app.use(cors({
    origin: "https://djimy2024.github.io",  // GitHub Pages
    credentials: true
}));

app.use(express.json());
app.use(express.static("public"));

app.use(session({
    secret: process.env.SESSION_SECRET || "perfumeSecretKey",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true, sameSite: "none" }
}));

// Login
app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;
    if(username === "admin" && password === "1234"){
        req.session.admin = true;
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Middleware admin
function checkAdmin(req, res, next){
    if(req.session.admin) next();
    else res.status(403).json({ message: "Unauthorized" });
}

// GET orders
app.get("/api/orders", checkAdmin, async (req, res) => {
    const { start, end } = req.query;
    let query = "SELECT * FROM orders";
    const params = [];

    if(start && end){
        query += " WHERE date BETWEEN $1 AND $2";
        params.push(start, end);
    }

    try{
        const { rows } = await pool.query(query, params);
        res.json(rows);
    } catch(err){
        res.status(500).json({ error: err.message });
    }
});

// POST order
app.post("/order", async (req, res) => {
    const { product, price, quantity } = req.body;
    try{
        await pool.query(
            "INSERT INTO orders (product, price, quantity, date) VALUES ($1, $2, $3, NOW())",
            [product, price, quantity]
        );
        console.log("Nouvo Commande:", product, quantity);
        res.json({ message: "Order saved!" });
    } catch(err){
        res.status(500).json({ error: err.message });
    }
});

// DELETE order
app.delete("/api/orders/:id", checkAdmin, async (req,res)=>{
    try{
        await pool.query("DELETE FROM orders WHERE id=$1", [req.params.id]);
        res.json({ message: "Deleted" });
    }catch(err){
        res.status(500).json({error: err.message});
    }
});

// Export Excel
app.get("/export", checkAdmin, async (req,res)=>{
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Orders");

    sheet.columns = [
        { header: "ID", key: "id" },
        { header: "Product", key: "product" },
        { header: "Price", key: "price" },
        { header: "Quantity", key: "quantity" },
        { header: "Date", key: "date" }
    ];

    try{
        const { rows } = await pool.query("SELECT * FROM orders");
        rows.forEach(r => sheet.addRow(r));

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");

        await workbook.xlsx.write(res);
        res.end();

    }catch(err){
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=> console.log("Server is running"));