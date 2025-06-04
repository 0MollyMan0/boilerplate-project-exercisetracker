const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

// Middleware
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Page d'accueil
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// Structure de données
const users = {};

// Générer un ID unique depuis le nom d'utilisateur
function generateId(username) {
  if (typeof username !== "string") {
    throw new TypeError("generateId attend une chaîne de caractères");
  }
  const hash = crypto.createHash("sha256").update(username).digest("hex");
  return hash.slice(0, 24); // Simule un ID MongoDB
}

// Ajouter un nouvel utilisateur
function addUser(username, _id, log = []) {
  users[_id] = { username, _id, log };
}

// Récupérer un utilisateur
function getUser(id) {
  return users[id] || null;
}

// Supprimer un utilisateur (pas strictement nécessaire ici)
function deleteUser(id) {
  delete users[id];
}

// Créer un nouvel utilisateur
app.post("/api/users", (req, res) => {
  const username = req.body.username;

  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Nom d'utilisateur invalide" });
  }

  const _id = generateId(username);
  const log = [];
  addUser(username, _id, log);

  res.json({
    username,
    _id,
  });
});

// Récupérer tous les utilisateurs
app.get("/api/users", (req, res) => {
  res.json(Object.values(users));
});

// Ajouter un exercice
app.post("/api/users/:_id/exercises", (req, res) => {
  const _id = req.params._id;
  const user = getUser(_id);

  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé" });
  }

  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  let date = req.body.date ? new Date(req.body.date) : new Date();

  if (!description || isNaN(duration)) {
    return res
      .status(400)
      .json({ error: "Champs description ou durée invalide" });
  }

  if (isNaN(date.getTime())) {
    date = new Date();
  }

  const formattedDate = date.toDateString();

  const exercise = {
    description: String(description),
    duration: Number(duration),
    date: formattedDate,
  };

  user.log.push(exercise);

  res.json({
    _id: user._id,
    username: user.username,
    date: formattedDate,
    duration: duration,
    description: description,
  });
});

// Récupérer le log d'exercices avec filtres
app.get("/api/users/:_id/logs", (req, res) => {
  const _id = req.params._id;
  const user = getUser(_id);

  if (!user) {
    return res.status(404).json({ error: "Utilisateur non trouvé" });
  }

  let log = user.log;

  // Filtres
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  const limit = req.query.limit ? parseInt(req.query.limit) : null;

  if (from instanceof Date && !isNaN(from)) {
    log = log.filter((entry) => new Date(entry.date) >= from);
  }

  if (to instanceof Date && !isNaN(to)) {
    log = log.filter((entry) => new Date(entry.date) <= to);
  }

  if (!isNaN(limit)) {
    log = log.slice(0, limit);
  }

  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
