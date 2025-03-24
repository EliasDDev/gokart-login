const express = require("express");
const session = require('express-session')
const mysql = require("mysql2");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));
app.set('view engine', 'ejs');
const port = 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})

const connection = mysql.createPool({
    connectionLimit: 10,
    host: "213.66.63.31",
    user: "elias",
    password: "1324",
    database: "gokart",
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html')
})

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/');
}

app.get("/bookings", isAuthenticated, (req, res) => {
    const sql = `SELECT app_booking.id, app_customer.name, app_customer.email, app_booking.date, app_booking.time 
    FROM app_booking 
    INNER JOIN app_customer 
    ON app_booking.customer_id = app_customer.id`;

    connection.query(sql, (err, rows) => {
        if (err) throw err;

        // Sort by date and time
        rows.sort((a, b) => {
            const dateTimeA = new Date(a.date.toISOString().split('T')[0] + 'T' + a.time);
            const dateTimeB = new Date(b.date.toISOString().split('T')[0] + 'T' + b.time);
            return dateTimeA - dateTimeB;
          });
        res.render("bookings", { bookings: rows });
    })
})

app.post("/cancel-booking", isAuthenticated, (req, res) => {
    const booking_id = req.body.booking_id;
    console.log(`Avbokar tiden med ID ${booking_id}`);
    connection.query('DELETE FROM app_booking WHERE id = ?', booking_id, (err, result) => {
        if (err) throw err;
        res.send('User deleted successfully');
    });
})

app.post('/login', (req, res) => {
    const name = req.body.admin_code;
    connection.query('SELECT admin_code FROM admin_users WHERE admin_code = ?', [name], (err, rows) => {
        if (err) throw err;

        if (rows.length > 0) {
            req.session.user = rows[0];
            res.redirect('/bookings')
        } else {
            res.status(401).send("User not found");
        }
    })
})
