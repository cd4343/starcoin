const express = require('express');
const router = express.Router();
const TaskService = require('../services/taskService');

// 获取指定日期的任务
router.get('/tasks/daily/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const tasks = await TaskService.getDailyTasks(date);
    const totalPoints = tasks.reduce((sum, task) => 
      sum + (task.completed ? task.points : 0), 0);

    res.json({
      tasks,
      totalPoints,
      date: date.toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: '获取任务失败' });
  }
});

// 更新任务状态
router.put('/tasks/:taskId/status', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { completed } = req.body;
    const task = await TaskService.updateTaskStatus(taskId, completed);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: '更新任务状态失败' });
  }
});

module.exports = router; 