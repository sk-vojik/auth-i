const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const KnexSessionStore = require('connect-session-knex')(session);

const db = require('./database/dbConfig');
const Users = require('./users/users-module.js');

const server = express();

const sessionConfig = {
  name: 'cookie',    //cookie name. change it from standard sid(session id)
  secret: 'keep it secret, keep it safe',      //usually would keep this in .env file
  cookie: {
    maxAge: 1000 * 60 * 15,      //1 second times 60 - 1 minute * 15 = 15 minute session length
    secure: false,      //used only for https or not. would be true after development
  },
  httpOnly: true,      //cannot access the cookie from js.
  resave: false,
  saveUninitialized: false,    // laws against setting cookies automatically

  store: new KnexSessionStore({ 
    knex: db,
    tablename: 'sessions',      //all lower case
    sidfieldname: 'sid',       //all lower case
    createtable: true,        //all lower case
    clearInterval: 1000 * 60 * 60       //clean it every hour
  })
}

server.use(helmet());
server.use(express.json());
server.use(cors());
server.use(session(sessionConfig));

//test get
server.get('/', (req, res) => {
  res.send("it's workinggggg!!!!")
});


//post resgister
server.post('/api/register', (req, res) => {
  let user = req.body;

  const hash = bcrypt.hashSync(user.password, 14);   //generate hash from user's password

  user.password = hash;    //override user.password with hash

  Users.add(user)
    .then(saved => {
      req.session.user = user; //registered, so stays logged in
      res.status(201).json(saved);
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

//post login
server.post('/api/login', (req, res) => {
  let { username, password } = req.body;

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        console.log("worked");
        res.status(200).json({ message: `Welcome ${user.username}!` });
      } else {
        res.status(401).json({ message: 'You shall not pass' });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    })
});


//restriction middleware


function restricted (req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'you shall not pass!' })
  }
}

// function restricted (req, res, next) {
//   const { username, password } = req.headers;

//   if (username && password) {
//     Users.findBy({ username })
//       .first()
//       .then(user => {
//         // check that passwords match
//         if (user && bcrypt.compareSync(password, user.password)) {
//             next()
//         } else {
//           res.status(401).json({ message: 'Invalid Credentials' });
//         }
//       })
//       .catch(error => {
//         res.status(500).json({ message: 'No creds provided' });
//       });
//   } else {
//     res.status(400).json({ message: 'No creds provided' });
//   }

// }

//get users

server.get('/api/users', restricted, (req, res) => {   //add back restricted later
  Users.find()
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
});


//LOGOUT

server.get('/api/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.send('error')
      } else {
        res.send('bye, thanks for coming')
      }
    });
  } else {
    res.end();
  }
});



const port = process.env.PORT || 5001;
server.listen(port, () => console.log(`\n** Running on port ${port} **\n`));