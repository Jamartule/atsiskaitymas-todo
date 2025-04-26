const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.put('/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Užduotis nerasta' });

    task.title = title;
    task.description = description;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Klaida atnaujinant užduotį' });
  }
});

router.delete('/:id', taskController.deleteTask);

module.exports = router;
