const fs = require('fs');
const path = require('path');

const tasksFilePath = path.join(__dirname, '../data/tasks.json');

function readTasks() {
  if (!fs.existsSync(tasksFilePath)) return [];
  const data = fs.readFileSync(tasksFilePath, 'utf8');
  return JSON.parse(data);
}

function saveTasks(tasks) {
  fs.writeFileSync(tasksFilePath, JSON.stringify(tasks, null, 2));
}

// Gauti visas užduotis
exports.getTasks = (req, res) => {
  const tasks = readTasks();
  res.json(tasks);
};

// Sukurti užduotį
exports.createTask = (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Reikia pavadinimo' });

  const tasks = readTasks();

  const newTask = {
    id: Date.now().toString(),
    title,
    description: description || '',
    userId: req.user.id,
  };

  tasks.push(newTask);
  saveTasks(tasks);

  res.status(201).json(newTask);
};

// Pašalinti užduotį pagal id
exports.deleteTask = (req, res) => {
  const { id } = req.params;
  let tasks = readTasks();

  const taskIndex = tasks.findIndex(
    (t) => t.id === id && t.userId === req.user.id
  );
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Užduotis nerasta' });
  }

  tasks.splice(taskIndex, 1);
  saveTasks(tasks);

  res.json({ message: 'Užduotis pašalinta' });
};

// Atnaujinti užduotį pagal id
exports.updateTask = (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  let tasks = readTasks();

  const taskIndex = tasks.findIndex(
    (t) => t.id === id && t.userId === req.user.id
  );
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Užduotis nerasta' });
  }

  if (title) tasks[taskIndex].title = title;
  if (description !== undefined) tasks[taskIndex].description = description;

  saveTasks(tasks);

  res.json(tasks[taskIndex]);
};
