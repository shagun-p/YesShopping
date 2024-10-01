const sqlite3 = require('sqlite3').verbose();

// Create a new database connection
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the users database.');
  });
  
  // Create a new table to store 'users'
  db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);
  
  // Create a new table to store 'products'
  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    imageAddress STRING
  );`);
  
  // Create a new table to store 'Electronics'
  db.run(`CREATE TABLE IF NOT EXISTS electronics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    imageAddress STRING
  );`);
  
  // Create a new table to store 'MensFashion'
  db.run(`CREATE TABLE IF NOT EXISTS mensFashion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL ,
    size TEXT NOT NULL,
    description TEXT NOT NULL,
    price INTEGER NOT NULL,
    imageAddress STRING
  );`);
  
  db.run(`CREATE TABLE IF NOT EXISTS cart_items (
    product_id INTEGER PRIMARY KEY,
    user_id INTEGER,
    quantity INTEGER,
    product_name TEXT,
    product_image STRING,
    product_price INTEGER,
    id INTEGER,
    FOREIGN KEY (id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  );`);
  
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    name_on_card TEXT,
    cardno TEXT,
    exp_month INTEGER,
    exp_year INTEGER,
    cvv TEXT,
    card_type TEXT,
    total_amount INTEGER
  );`);

  module.exports = db;
