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
function addUser(username, _id, count, log) {
  users[_id] = { username, _id, count, log};
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
  const count = 0;
  const log = [];
  addUser(username, id, count, log);
  res.json(getUser(id));
});

// Requete post pour ajouter un exercice
app.post('/api/users/:_id/exercises', (req, res) => {
  const _id = req.params._id;
  console.log("getUser pour", _id, ":", getUser(_id));
  console.log("Tous les users :", users);
  const user = getUser(_id);


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


  const count = 1;
  const log = user.log.push(exercise);

  addUser(username, id, count, log);
  res.json({
    _id: id,
    username: username,
    date: date,
    duration: duration,
    description: desc
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
