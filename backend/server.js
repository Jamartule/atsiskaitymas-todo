const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SECRET = 'supersecretkey';

const usersFilePath = path.join(__dirname, 'data', 'users.json');
const tasksFilePath = path.join(__dirname, 'data', 'tasks.json');

const readUsers = () => {
  if (!fs.existsSync(usersFilePath)) return [];
  const data = fs.readFileSync(usersFilePath, 'utf8');
  return JSON.parse(data);
};

const saveUsers = (users) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

const readTasks = () => {
  if (!fs.existsSync(tasksFilePath)) return [];
  const data = fs.readFileSync(tasksFilePath, 'utf8');
  return JSON.parse(data);
};

const saveTasks = (tasks) => {
  fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2));
};

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Trūksta duomenų' });

  const users = readUsers();
  if (users.find((u) => u.email === email))
    return res.status(400).json({ message: 'El. paštas jau užimtas' });

  const hashedPassword = await bcrypt.hash(password, 10);

  users.push({
    id: Date.now().toString(),
    name,
    email,
    password: hashedPassword,
  });

  saveUsers(users);
  res.json({ message: 'Registracija sėkminga' });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Trūksta duomenų' });

  const users = readUsers();
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(400).json({ message: 'Vartotojas nerastas' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return res.status(400).json({ message: 'Neteisingas slaptažodis' });

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token });
});

app.get('/api/tasks', authenticateToken, (req, res) => {
  const tasks = readTasks();
  const userTasks = tasks.filter((t) => t.userId === req.user.id);
  res.json(userTasks);
});

app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Reikia pavadinimo' });

  const tasks = readTasks();
  const newTask = {
    id: Date.now().toString(),
    userId: req.user.id,
    title,
    description: description || '',
  };
  tasks.push(newTask);
  saveTasks(tasks);
  res.json(newTask);
});

app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Reikia pavadinimo' });

  let tasks = readTasks();
  const taskIndex = tasks.findIndex(
    (t) => t.id === id && t.userId === req.user.id
  );
  if (taskIndex === -1)
    return res.status(404).json({ message: 'Užduotis nerasta' });

  tasks[taskIndex].title = title;
  tasks[taskIndex].description = description || '';
  saveTasks(tasks);

  res.json(tasks[taskIndex]);
});

app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  let tasks = readTasks();
  const index = tasks.findIndex((t) => t.id === id && t.userId === req.user.id);
  if (index === -1)
    return res.status(404).json({ message: 'Užduotis nerasta' });

  tasks.splice(index, 1);
  saveTasks(tasks);
  res.json({ message: 'Užduotis ištrinta' });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Serveris veikia http://localhost:${PORT}`));
