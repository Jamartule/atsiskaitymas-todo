const fs = require('fs');
const path = require('path');

const tasksFilePath = path.join(__dirname, '../data/tasks.json');

const readTasks = () => {
  if (!fs.existsSync(tasksFilePath)) return [];
  const data = fs.readFileSync(tasksFilePath, 'utf8');
  return JSON.parse(data);
};

const saveTasks = (tasks) => {
  fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2));
};

exports.getTasks = (req, res) => {
  const tasks = readTasks();
  const userTasks = tasks.filter((t) => t.userId === req.user.id);
  res.json(userTasks);
};

exports.createTask = (req, res) => {
  const { title, description, status } = req.body;
  if (!title) return res.status(400).json({ message: 'Reikia pavadinimo' });

  const tasks = readTasks();
  const newTask = {
    id: Date.now().toString(),
    title,
    description: description || '',
    status: status || 'nebaigta',
    userId: req.user.id,
  };
  tasks.push(newTask);
  saveTasks(tasks);
  res.status(201).json(newTask);
};

exports.updateTask = (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;

  const tasks = readTasks();
  const task = tasks.find((t) => t.id === id && t.userId === req.user.id);
  if (!task) return res.status(404).json({ message: 'Užduotis nerasta' });

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;

  saveTasks(tasks);
  res.json(task);
};

exports.deleteTask = (req, res) => {
  const { id } = req.params;

  let tasks = readTasks();
  const index = tasks.findIndex((t) => t.id === id && t.userId === req.user.id);
  if (index === -1)
    return res.status(404).json({ message: 'Užduotis nerasta' });

  tasks.splice(index, 1);
  saveTasks(tasks);
  res.json({ message: 'Užduotis pašalinta' });
};
