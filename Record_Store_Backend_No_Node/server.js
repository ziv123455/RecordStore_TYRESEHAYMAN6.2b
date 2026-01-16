const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ===== In-memory data (for teaching / demo) =====

// Fake users for login
const users = [
  {
    id: 1,
    email: 'clerk@recordshop.com',
    password: 'password',      // in real life: hash it!
    role: 'clerk',             // Sales Clerk: view + add
    name: 'Chris Clerk'
  },
  {
    id: 2,
    email: 'manager@recordshop.com',
    password: 'password',
    role: 'manager',           // Store Manager: view + add + update
    name: 'Mandy Manager'
  },
  {
    id: 3,
    email: 'admin@recordshop.com',
    password: 'password',
    role: 'admin',             // System Admin: full CRUD
    name: 'Alex Admin'
  }
];

// Formats & genres (to be fetched via API on frontend)
const formats = ['Vinyl', 'CD'];
const genres = ['Rock', 'Pop', 'Jazz', 'Hip-Hop', 'Classical', 'Electronic'];

// Simple in-memory records array
let nextRecordId = 7;

let records = [
  {
    id: 1,
    title: "Californication",
    artist: "Red Hot Chili Peppers",
    format: "Vinyl",
    genre: "Rock",
    releaseYear: 1999,
    price: 29.99,
    stockQty: 8,
    customerId: "",
    customerFirstName: "",
    customerLastName: "",
    customerContact: "",
    customerEmail: ""
  },
  {
    id: 2,
    title: "Black Summer",
    artist: "Red Hot Chili Peppers",
    format: "CD",
    genre: "Rock",
    releaseYear: 2022,
    price: 14.99,
    stockQty: 12,
    customerId: "",
    customerFirstName: "",
    customerLastName: "",
    customerContact: "",
    customerEmail: ""
  },
  {
    id: 3,
    title: "Audioslave",
    artist: "Audioslave",
    format: "Vinyl",
    genre: "Rock",
    releaseYear: 2002,
    price: 27.99,
    stockQty: 6,
    customerId: "",
    customerFirstName: "",
    customerLastName: "",
    customerContact: "",
    customerEmail: ""
  },
  {
    id: 4,
    title: "Stony Hill",
    artist: "Damian Marley",
    format: "CD",
    genre: "Reggae",
    releaseYear: 2017,
    price: 12.99,
    stockQty: 9,
    customerId: "",
    customerFirstName: "",
    customerLastName: "",
    customerContact: "",
    customerEmail: ""
  },
  {
    id: 5,
    title: "The Bends",
    artist: "Radiohead",
    format: "Vinyl",
    genre: "Alternative",
    releaseYear: 1995,
    price: 26.99,
    stockQty: 5,
    customerId: "",
    customerFirstName: "",
    customerLastName: "",
    customerContact: "",
    customerEmail: ""
  },
  {
    id: 6,
    title: "OK Computer",
    artist: "Radiohead",
    format: "Vinyl",
    genre: "Alternative",
    releaseYear: 1997,
    price: 28.99,
    stockQty: 4,
    customerId: "",
    customerFirstName: "",
    customerLastName: "",
    customerContact: "",
    customerEmail: ""
  }
];

// ===== Routes =====

// Health check
app.get('/', (req, res) => {
  res.send('Record Shop API is running');
});

// ---- Auth: POST /api/login ----
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  // In a real app, you would return a JWT. For this assignment we just return user info.
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });
});

// ---- Formats & Genres ----
app.get('/api/formats', (req, res) => {
  res.json(formats);
});

app.get('/api/genres', (req, res) => {
  res.json(genres);
});

// ---- Records CRUD ----

// GET all records (list view)
app.get('/api/records', (req, res) => {
  res.json(records);
});

// GET single record by id (view details)
app.get('/api/records/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const record = records.find(r => r.id === id);

  if (!record) {
    return res.status(404).json({ message: 'Record not found.' });
  }

  res.json(record);
});

// POST create new record
app.post('/api/records', (req, res) => {
  const body = req.body;

  const newRecord = {
    id: nextRecordId++,
    title: body.title,
    artist: body.artist,
    format: body.format,
    genre: body.genre,
    releaseYear: body.releaseYear,
    price: body.price,
    stockQty: body.stockQty,
    customerId: body.customerId || '',
    customerFirstName: body.customerFirstName || '',
    customerLastName: body.customerLastName || '',
    customerContact: body.customerContact || '',
    customerEmail: body.customerEmail || ''
  };

  records.push(newRecord);
  res.status(201).json(newRecord);
});

// PUT update record
app.put('/api/records/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = records.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Record not found.' });
  }

  const body = req.body;

  records[index] = {
    ...records[index],
    title: body.title,
    artist: body.artist,
    format: body.format,
    genre: body.genre,
    releaseYear: body.releaseYear,
    price: body.price,
    stockQty: body.stockQty,
    customerId: body.customerId || '',
    customerFirstName: body.customerFirstName || '',
    customerLastName: body.customerLastName || '',
    customerContact: body.customerContact || '',
    customerEmail: body.customerEmail || ''
  };

  res.json(records[index]);
});

// DELETE record
app.delete('/api/records/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = records.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Record not found.' });
  }

  const deleted = records.splice(index, 1)[0];
  res.json({ message: 'Record deleted.', record: deleted });
});

// Start server
app.listen(PORT, () => {
  console.log(`Record Shop API listening on port ${PORT}`);
});
