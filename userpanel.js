//const stripe = require('stripe')(config.stripeSecretKey);
const { JSDOM } = require('jsdom');
const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = jsdom;
global.window = window;
global.document = window.document;
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookie_parser=require('cookie-parser');
const session = require("express-session");
const secretKey = 'secretKey';
const flash = require('connect-flash');
const passport = require('passport');
const { name } = require('ejs');
const app = express();
app.use("/",require("./routes/pages"));
var type='Log In';
app.use(require("express-session")({
  secret: "This is the secret line",
  resave: false,
  saveUninitialized: false
  }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookie_parser());
// Serve static files from the public directory
app.use(express.static('public'));
 
// Set the view engine to EJS
app.set('view engine', 'ejs');

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

db.run(`CREATE TABLE IF NOT EXISTS wishlist_items (
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
  user_id INTEGER,
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

db.run(`CREATE TABLE IF NOT EXISTS order_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT,
  price INTEGER,
  quantity INTEGER
);`);

// Render the dashboard page
app.get('/',(req, res) => {
  res.render('dashboard', {name:type});
});

//Render the dashboard
app.get('/dashboard',(req,res) =>{
  res.render('dashboard', {name:type});
});

//Render the home page
app.get('/home',(req, res) => { 
  res.render('home', {name: type});
});

//Render the home page
app.get('/adminHome',(req, res) => {
res.render('adminHome',  {name: type});
});

// Route for the contact page
app.get('/contact',(req, res) => {
res.render('contact', {name: type});
});

// Route for the about page
app.get('/about',(req, res) => {
  res.render('about', {name: type});
});

//render for the help page
app.get('/help',(req, res) => {
  res.render('help', {name: type});
});

//render for the faq page
app.get('/faq', (req, res) => {
  res.render('faq', {name: type});
});


//Render the HomeOffice products page
app.get('/Electronics',(req,res)=>{
  //res.render('HomeOffice');
  db.all('SELECT * FROM electronics', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.sendStatus(500);
    } else {
      res.render('Electronics', { electronics: rows });
    }
  });
});

//Render the Books product page
app.get('/Books',(req,res)=>{
  //res.render('Books');
  db.all('SELECT * FROM books', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.sendStatus(500);
    } else {
      res.render('Books', { books: rows });
    }
  });
});

//Render the Mens fashion product page
app.get('/MensFashion',(req,res)=>{
  //res.render('MensFashion');
  db.all('SELECT * FROM mensFashion', (err, rows) => {
    if (err) {
      console.error(err.message);
      res.sendStatus(500);
    } else {
      res.render('MensFashion', { mensFashion: rows });
    }
  });
});

//simply checking if the token passed is in string format or not
const extractBearerToken = headerValue => {
  if (typeof headerValue !== 'string') {
      return false
  }
  // Matches a string or an object that supports being matched against, and returns an array
  //  containing the results of that search, or null if no matches are found.
  const matches = headerValue.match(/(bearer)\s+(\S+)/i)
  return matches && matches[2]
}
// The middleware
function checkTokenMiddleware(req, res, next){
  const token =  extractBearerToken(req.headers.authorization)

  if (!token) {
      return res.status(401).json({ message: 'need a token' })
  }
  jwt.verify(token, secretKey, (err, decodedToken) => {
      if (err) {
          return res.status(401).json({ message: 'bad token' })
      }
  })
  req.user=decoded;
  next()
}

// initialize express-session to allow us track the logged-in user across sessions.
app.use(
  session({
    key: "key",
    secret: "Anything",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 60,
    },
  })
);
app.use((req,res,next)=>{
  if(req.session.user && req.cookies.key){
    res.redirect('/loginDashboard');
  }
  next();
})
// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
  if (req.cookies.key && !req.session.user) {
    res.clearCookie("Key");
  }
  next();
});

// middleware function to check for logged-in users
var sessionChecker=(req,res,next)=>{
  if(req.session.user && req.cookies.token)
    res.redirect('/loginDashboard');
  else
    next();
}

// Render the login page
app.get('/login',sessionChecker,(req, res) => {
  res.render('login', {name:type});
});

function isAuthenticate(req, res, next) {
  if (req.cookies.token && req.session.user) {
    // user is authenticated, proceed with the request
    next();
  } else {
    // user is not authenticated, send an unauthorized response
    res.status(401).send('Unauthorized');
  }

}

// Render the login_dashboard page
app.get('/loginDashboard',isAuthenticate,(req, res) => {
    res.render('loginDashboard',{name:req.flash('value')});
});

// Handle login form submissions
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const sql = `SELECT * FROM users WHERE username = ?`;
  db.get(sql, [username], (err, user) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to get user' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }
    if (!password) {
      return res.status(401).json({ error: 'Email or password is incorrect' });
    }
    var token = jwt.sign({ username: user.username }, 'secretKey', { expiresIn: '10m' });
    res.cookie('token', token, { httpOnly: true });
    if(username=="admin" && password=="adminpass")
    {
      res.status(201).redirect('/adminHome');
    }
    else
    {
      req.session.user = user;
      type= 'Log Out';
      req.flash('value', type)
      res.status(201).redirect('/loginDashboard');
    }
  });
});
// Render the forgot password page
app.get('/forgotPassword',sessionChecker, (req, res) => {
  res.render('forgotPassword');
});

// Handle forgot password form submissions
app.post('/forgotPassword', (req, res) => {
  const { username,password} = req.body;
  const sql = `UPDATE users SET password = ? WHERE username = ?`;
  db.run(sql, [password,username], (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to update password' });
    }
    else{
    res.status(201).redirect('/login');
    }
  });
});

// Render the signup page
app.get('/signup',sessionChecker, (req, res) => {
  res.render('signup');
});

// Handle signup form submissions
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const sql = `INSERT INTO users (username, password) VALUES (?, ?)`;
  db.run(sql, [username , password], (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to create user' });
    }
    else{
    res.status(201).redirect('/login');
    }
  });
});

//Handle the add product request
app.post('/addBooks',async (req,res)=>{
var { name,description,price,imageAddress } = req.body;
var sql = `INSERT INTO books (name,description,price,imageAddress) VALUES (?,?,?,?)`;
db.run(sql, [name,description,price,imageAddress], (err) => {
  if (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Failed to add product' });
  }
  res.status(404).send('the product added');
});
});

app.post('/deleteBooks/:id', (req, res) => {
  const ID = req.body.id;
  console.log(ID);
  const sql = `DELETE  FROM books WHERE id = ?`;
  db.run(sql, ID, (err) => { 
    //console.log(rows);
    if (!sql) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to delete this book' });
    }
    res.status(200).send('Book deleted');
  });
});

app.post('/updateBooks/:id/:name', (req,res)=>{
  var ID  = req.body.id;
  var NAME = req.body.name;
  console.log(NAME);
  var sql= 'UPDATE books SET name = ? WHERE id = ?';
  db.run(sql, NAME,ID, (err) => { 
    if(err){
      res.send("Error encountered while updating");
      return console.error(err.message);
    }
    res.send("Entry updated successfully");
    console.log("Entry updated successfully");
  });
});

app.post('/updateMensFashion/:id/:brand', (req,res)=>{
  var ID  = req.body.id;
  var BRAND = req.body.brand;
  var sql= 'UPDATE mensFashion SET brand = ? WHERE id = ?';
  db.run(sql, BRAND,ID, (err) => { 
    if(err){
      res.send("Error encountered while updating");
      return console.error(err.message);
    }
    res.send("Entry updated successfully");
    console.log("Entry updated successfully");
  });
});

app.post('/deleteMensFashion/:id', (req, res) => {
  const ID = req.body.id;
  const sql = `DELETE  FROM mensFashion WHERE id = ?`;
  db.run(sql, ID, (err) => { 
    
    if (!ID) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to delete this item' });
    }
    else
    res.status(200).send('item deleted');
  });
});

//Books search functionality 
app.get('/searchBooks', (req, res) => {
  const searchTerm  = req.query?.searchTerm;
  var sql = `SELECT * FROM books WHERE description LIKE '%${searchTerm}%' OR name LIKE '%${searchTerm}%'`;
  db.all(sql, (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.render('search-results-books', { books: rows })
  });
});

//Handle the addElectronics request
app.post('/addElectronics',async (req,res)=>{
  const { company,description,price,imageAddress } = req.body;
  const sql = `INSERT INTO electronics (company,description,price,imageAddress) VALUES (?,?,?,?)`;
  db.run(sql, [company,description,price,imageAddress], (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to add product' });
    }
    res.status(404).send('the product added');
  });
  });

app.post('/deleteElectronics/:id', (req, res) => {
  const ID = req.body.id;
  console.log(ID);
  const sql = `DELETE  FROM electronics WHERE id = ?`;
  db.run(sql, ID, (err) => { 
    if (!sql) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to delete this item' });
    }
    res.status(200).send('item deleted');
  });
});

//Electronics search functionality 
app.get('/searchElectronics', (req, res) => {
  const searchTerm  = req.query?.searchTerm;
  var sql = `SELECT * FROM electronics WHERE company LIKE '%${searchTerm}%'`;
  db.all(sql, (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.render('search-results-electronics', { electronics: rows })
  });
});

app.post('/updateElectronics/:id/:company', (req,res)=>{
  var ID  = req.body.id;
  var COMPANY = req.body.company;
  var sql= 'UPDATE electronics SET company = ? WHERE id = ?';
  db.run(sql, COMPANY,ID, (err) => { 
    if(err){
      res.send("Error encountered while updating");
      return console.error(err.message);
    }
    res.send("Entry updated successfully");
    console.log("Entry updated successfully");
  });
});

//MensFashion search functionality 
app.get('/searchMensFashion', (req, res) => {
  const searchTerm  = req.query?.searchTerm;
  var sql = `SELECT * FROM mensFashion WHERE brand LIKE '%${searchTerm}%'`;
  db.all(sql, (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    res.render('search-results-mensFashion', { mensFashion: rows })
  });
});

//Handle the addMensFashion request
app.post('/addMensFashion',async (req,res)=>{
const { brand,size,description,price,imageAddress } = req.body;
const sql = `INSERT INTO mensFashion (brand,size,description,price,imageAddress) VALUES (?,?,?,?,?)`;
db.run(sql, [brand,size,description,price,imageAddress], (err) => {
  if (err) {
    console.error(err.message);
    return res.status(500).json({ error: 'Failed to add product' });
  }
  res.status(404).send('the product added');
});
});

app.post('/updateMensFashion/:id/:brand', (req,res)=>{
  var ID  = req.body.id;
  var BRAND = req.body.brand;
  var sql= 'UPDATE mensFashion SET brand = ? WHERE id = ?';
  db.run(sql, BRAND,ID, (err) => { 
    if(err){
      res.send("Error encountered while updating");
      return console.error(err.message);
    }
    res.send("Entry updated successfully");
    console.log("Entry updated successfully");
  });
});


app.get('/cart',isAuthenticate, (req, res) => {
  
  const currentUser = req.session.user;
  const userId=JSON.stringify(currentUser.user_id);
    db.all('SELECT * FROM cart_items where user_id=?',userId, (err, rows) => {
      if (err) {
        console.log(err);
        res.status(500).send('Something went wrong');
      } else {
        res.render('cart', { items: rows });
      }
    });
  });

  app.get('/wishlist',isAuthenticate, (req, res) => {
    const currentUser = req.session.user;
    const userId=JSON.stringify(currentUser.user_id);
      db.all('SELECT * FROM wishlist_items where user_id=?',userId, (err, rows) => {
        if (err) {
          console.log(err);
          res.status(500).send('Something went wrong');
        } else {
          res.render('wishlist', { items: rows });
        }
      });
    });
    app.get('/delete-from-wishlist/:product_id', (req, res) => {
      const productId = req.params.product_id;
      const sql = `DELETE  FROM wishlist_items WHERE product_id = ?`;
      db.run(sql, productId, (err) => { 
        if (!sql) {
        console.error(err.message);
        return res.status(500).json({ error: 'Failed to delete this item from wishlist' });
        }
        res.redirect('/wishlist')
        });
    });
    app.post('/add-to-wishlist', (req, res) => {
      const currentUser = req.session.user;
      const userId=JSON.stringify(currentUser.user_id);
      const productId = req.body.productId;
      const quantity = req.body.quantity;
      const productName = req.body.productName;
      const productImage = req.body.productImage;
      const productPrice = req.body.productPrice;
      db.get('SELECT * FROM wishlist_items WHERE user_id = ? AND  product_image = ?',userId, productImage, (err, row) => {
        if (err) {
          console.error(err);
          res.sendStatus(500);
          return;
        }
        if (row) {
          res.redirect('/wishlist');
        }
        else{
          let product_Price = parseInt(productPrice);
          let newPrice = (product_Price * quantity);
          db.run('INSERT INTO wishlist_items (id,user_id, quantity,product_name,product_image,product_price) VALUES (?,?,?,?,?,?)', [productId,userId, quantity,productName,productImage,newPrice], (err) => {
            if (err) {
              console.log(err);
              res.status(500).send('Something went wrong');
            } else {
              res.redirect('/wishlist');
            }
          });
        }
      });
    });
  
    
  app.post('/add-to-cart', (req, res) => {
    const currentUser = req.session.user;
    const userId=JSON.stringify(currentUser.user_id);
    const productId = req.body.productId;
    const quantity = req.body.quantity;
    const productName = req.body.productName;
    const productImage = req.body.productImage;
    const productPrice = req.body.productPrice;
    db.get('SELECT * FROM cart_items WHERE user_id = ? AND  product_image = ?',userId, productImage, (err, row) => {
      if (err) {
        console.error(err);
        res.sendStatus(500);
        return;
      }
  
      if (row) {
        let newQuantity = row.quantity + (+quantity);
        let product_Price = parseInt(productPrice);
        let newPrice = (product_Price * newQuantity);
        db.run('UPDATE cart_items SET quantity = ? , product_price = ? WHERE  product_image = ? AND user_id = ?',newQuantity,newPrice,productImage,userId, (err) => {
          if (err) {
            console.error(err);
            res.sendStatus(500);
            return;
          }
          res.redirect('/cart');
        });
      } else {
        let product_Price = parseInt(productPrice);
        let newPrice = (product_Price * quantity);
        db.run('INSERT INTO cart_items (id,user_id, quantity,product_name,product_image,product_price) VALUES (?,?,?,?,?,?)', [productId,userId, quantity,productName,productImage,newPrice], (err) => {
          if (err) {
            console.log(err);
            res.status(500).send('Something went wrong');
          } else {
            res.redirect('/cart');
          }
        });
      }
    });
  });

  app.get('/delete-from-cart/:product_id', (req, res) => {
  const productId = req.params.product_id;
  const sql = `DELETE  FROM cart_items WHERE product_id = ?`;
  db.run(sql, productId, (err) => { 
    if (!sql) {
    console.error(err.message);
    return res.status(500).json({ error: 'Failed to delete this item' });
    }
    res.redirect('/cart')
    });
});
    
app.get('/AddDetails/:total', (req, res) => {
  const currentUser = req.session.user;
  const userId=JSON.stringify(currentUser.user_id);
  var total_amount=req.params.total;
  db.all('SELECT * FROM cart_items where user_id=?',userId, (err, rows) => {
    if (err) {
      console.log(err);  
      res.status(500).send('Something went wrong');
    } else {
      res.render('AddDetails', { items: rows });
    }
  });
});

app.get('/orderList',isAuthenticate,(req,res)=>{
  const currentUser = req.session.user;
  const userId=JSON.stringify(currentUser.user_id);
  db.all('SELECT * FROM order_history WHERE user_id=?',userId, (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).send('Something went wrong');
    } else {
      res.render('orderList', { items: rows });
    }
  });
})

app.get('/orderListForAdmin',(req,res)=>{
  db.all('SELECT * FROM order_history', (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).send('Something went wrong');
    } else {
      res.render('orderList', { items: rows });
    }
  });
})

app.get('/viewUsers',(req,res)=>{
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      console.log(err);
      res.status(500).send('Something went wrong');
    } else {
      res.render('users', { items: rows });
    }
  });
})

app.post('/payment' , (req,res)=>{
   res.status(201).redirect('/paymentDetails');
})
app.post('/paymentDetails' , (req,res)=>{
 
})

app.post('/AddDetails/:total', (req, res) => {
  const currentUser = req.session.user;
  const userId=JSON.stringify(currentUser.user_id);
  var total_amount=req.params.total;
  const { name,address,city,state,zip,name_on_card,cardno,exp_month,exp_year,cvv,card_type} = req.body;
  const sql = `INSERT INTO orders (user_id,name,address,city,state,zip,name_on_card,cardno,exp_month,exp_year,cvv,card_type,total_amount) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  db.run(sql, [userId,name,address,city,state,zip,name_on_card,cardno,exp_month,exp_year,cvv,card_type,total_amount], (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'some problem occurred while placing this order , have patience and try to order after sometime' });
    }
  db.all('SELECT * FROM cart_items WHERE user_id=?',userId, (err, rows) => {
    if (err) {
      throw err;
    }
     // iterate over the rows using a forEach loop
    rows.forEach(row => {
      const { user_id, product_name, product_price, quantity } = row;
        db.run('INSERT INTO order_history(user_id,name,price,quantity) VALUES(?,?,?,?)',[user_id,product_name,product_price,quantity],(err)=>{
          if(err){
            console.error(err.message);
          }
        })
    });
    
  });    
    db.run('DELETE FROM cart_items where user_id=?',userId,(err)=>{
      if(err){
        res.status(500).send('failed');
      }else{
        res.status(201).redirect('/payment');
      }
    })
  });
});

// Handle the GET request for the logout page
app.get('/logout', (req, res) => {
  if (req.session.user && req.cookies.token) {
    res.cookie("token","empty the key content", {maxAge: 0, domain:'http://localhost:3000', path:'/loginDashboard'});
    type= 'Log In';
    req.flash('value', type)
    res.redirect("/");
  } else {
    type= 'Log In';
    req.flash('value', type)
    res.redirect("/dashboard");
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}.`);
});

