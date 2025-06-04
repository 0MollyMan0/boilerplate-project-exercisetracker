const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");
const { log } = require("console");
require("dotenv").config();

// Middleware
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json()); // Pour JSON
app.use(bodyParser.urlencoded({ extended: true }));

// Index
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Objet pour stocker les users
const users = {};

// Fonction qui génère un id à partir d'un username
function generateId(username) {
  if (typeof username !== "string") {
    throw new TypeError("generateId attend une chaîne de caractères");
  }
  const hash = crypto.createHash("sha256").update(username).digest("hex");
  return hash.slice(0, 24);
}

// Fonction pour ajouter un user
function addUser(username, _id, log = [], count = 0) {
  users[_id] = { username, _id, log, count };
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
app.post("/api/users", (req, res) => {
  const username = req.body.username;
  // Vérifie qu'un username est reçu
  if (!username) {
    return res.status(400).json({ error: "need username" });
  }

  const id = generateId(username);
  addUser(username, id);
  const user = getUser(id);
  res.json({
    username: user.username,
    _id: user._id,
  });
});

// Requete post pour ajouter un exercice
app.post("/api/users/:_id/exercises", (req, res) => {
  const _id = req.params._id;
  const user = getUser(_id);

  // Test si l'user existe
  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  // Initialisation des valeurs déjà présente
  const username = user.username;
  const id = user._id;

  // Ajout de l'exercice dans le tableau
  const desc = String(req.body.description);
  const duration = Number(req.body.duration);
  const date = req.body.date ? new Date(req.body.date) : new Date();

  if (desc === "undefined" || isNaN(duration)) {
    return res.status(400).json({ error: "missing field" });
  }

  const exercise = {
    description: desc,
    duration: duration,
    date: date.toDateString(),
  };

  // Ajoute l'exercice au tableau d'exercices
  user.log.push(exercise);

  console.log(user);
  res.json({
    _id: user._id,
    username: user.username,
    date: date,
    duration: duration,
    description: desc,
  });
});

// Affiche tout les user
app.get("/api/users/", (req, res) => {
  const usersList = Object.values(users).map((user) => ({
    _id: user._id,
    username: user.username,
  }));
  res.json(usersList);
});

// Requete get pour voir tout les exercices d'un user
app.get("/api/users/:_id/logs", (req, res) => {
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
    log = log.filter((entry) => new Date(entry.date) >= from);
  }
  if (to) {
    log = log.filter((entry) => new Date(entry.date) <= to);
  }

  // Limite
  if (limit) {
    log = log.slice(0, limit);
  }

  res.json({
    _id: user.id,
    username: user.username,
    count: user.log.length,
    log: log,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
