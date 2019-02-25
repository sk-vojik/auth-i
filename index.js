const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const db = require('./database/dbConfig');

const server = express();

server.use(helmet());
server.use(express.json());
server.use(cors());

//test get
server.get('/', (req, res) => {
  res.send("it's workinggggg!!!!")
});






const port = process.env.PORT || 5001;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));