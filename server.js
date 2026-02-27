const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const session = require("express-session");
const ExcelJS = require("exceljs");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use(session({
    secret: "perfumeSecretKey",
    resave: false,
    saveUninitialized: true
}));

const db = new sqlite3.Database("./database.db");

// Kreye table si li pa egziste
db.run(`
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product TEXT,
    price REAL,
    quantity INTEGER,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`);

// Resevwa order
app.post("/order", (req, res) => {
    const { product, price, quantity } = req.body;

    db.run(
        "INSERT INTO orders (product, price, quantity) VALUES (?, ?, ?)",
        [product, price, quantity],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // NOTIFIKASYON
            console.log("Nouvo Commande:");
            console.log("Produit:", product);
            console.log("Quantité:", quantity);

            res.json({ message: "Order saved!" });
        }
    );
});

// Login
app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "admin" && password === "1234") {
        req.session.admin = true;
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Middleware pwoteksyon
function checkAdmin(req, res, next) {
    if (req.session.admin) {
        next();
    } else {
        res.status(403).json({ message: "Unauthorized" });
    }
}

app.get("/api/orders", checkAdmin, (req, res) => {
    const { start, end } = req.query;

    let query = "SELECT * FROM orders";
    let params = [];

    if(start && end){
        query += " WHERE date BETWEEN ? AND ?";
        params.push(start, end);
    }

    db.all(query, params, (err, rows) => {
        if(err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.delete("/api/orders/:id", checkAdmin, (req, res) => {
    db.run("DELETE FROM orders WHERE id = ?", [req.params.id], function(err){
        if(err) return res.status(500).json({error: err.message});
        res.json({message: "Deleted"});
    });
});

app.get("/export", checkAdmin, async (req, res) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Orders");

    sheet.columns = [
        { header: "ID", key: "id" },
        { header: "Product", key: "product" },
        { header: "Price", key: "price" },
        { header: "Quantity", key: "quantity" },
        { header: "Date", key: "date" }
    ];

    db.all("SELECT * FROM orders", [], async (err, rows) => {
        rows.forEach(r => sheet.addRow(r));

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", "attachment; filename=orders.xlsx");

        await workbook.xlsx.write(res);
        res.end();
    });
});


app.listen(3000, () => {
    console.log("Server is running at http://localhost:3000");
});