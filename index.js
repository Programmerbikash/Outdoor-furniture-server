const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors());
app.use(express.json());


app.get('/', async (req, res) => {
    res.send('Outdoor-furniture is running');
})

app.listen(port, () => console.log(`Outdoor-furniture running on ${port}`))