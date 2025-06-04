const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const cors = require('cors')
const crypto = require("crypto");
require('dotenv').config()

// Middleware
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json()); // Pour JSON
app.use(bodyParser.urlencoded({ extended: true }));

// Index
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Objet pour stocker les users
const users = {};

// Fonction qui génère un id à partir d'un username
function generateId(username) {
  if (typeof username !== 'string') {
    throw new TypeError("generateId attend une chaîne de caractères");
  }
  const hash = crypto.createHash("sha256").update(username).digest("hex");
  return hash.slice(0, 24);
}

// Fonction pour ajouter un user
function addUser(username, _id, log) {
  users[_id] = { username, _id, log};
}

// Trouver un user 
function getUser(id) {
  return users[id] || null;
}

// Fonction pour supprimer un user
function deleteUser(id) {
  delete users[id];
}

// Requete post pour créer un User
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  const id = generateId(username);
  const log = [];
  addUser(username, id, log);
  res.json({
    username: username,
    _id: id,
  });
});

// Requete post pour ajouter un exercice
app.post('/api/users/:_id/exercises', (req, res) => {
  const _id = req.params._id;
  const user = getUser(_id);

  // Test si l'user existe
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé" });
  }

  deleteUser(_id);

  // Initialisation des valeurs déjà en présente
  const username = user.username;
  const id = user._id;

  // Ajout de l'exercice dans le tableau
  const desc = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date;
  const exercise = {desc, duration, date};
  user.log.push(exercise);


  const log = user.log;

  addUser(username, id, log);
  res.json({
    _id: id,
    username: username,
    date: date,
    duration: duration,
    description: desc
  });
});

// Requete get pour voir tout les exercices d'un user
app.get('/api/users/:_id/logs', (req, res) => {
  const _id = req.params._id;
  const user = getUser(_id);

  // Test si l'user existe
  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé" });
  }

  let log = user.log || [];

  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  const limit = req.query.limit ? parseInt(req.query.limit) : null;

  // Filtrage par date
  if (from) {
    log = log.filter(entry => new Date(entry.date) >= from);
  }
  if (to) {
    log = log.filter(entry => new Date(entry.date) <= to);
  }

  // Limite 
  if (limit){
    log = log.slice(0, limit);
  }

  res.json({
    _id: user.id,
    username: user.username,
    date: user.log.length,
    log: log
  })
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
