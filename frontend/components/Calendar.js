class Calendar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentDate = new Date();
    this.selectedDate = new Date();
    this.currentFilter = {
      category: 'all',
      searchText: '',
      sortBy: 'time',
      view: 'list'
    };
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.loadTasks(this.selectedDate);
  }

  render() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 获取当月第一天是星期几（0-6）
    const firstDayWeek = firstDay.getDay();
    
    // 日历头部
    const header = `
      <div class="calendar-header">
        <button class="btn-prev-month">&lt;</button>
        <h2>${year}年${month + 1}月</h2>
        <button class="btn-next-month">&gt;</button>
      </div>
      <div class="calendar-weekdays">
        <div>一</div><div>二</div><div>三</div><div>四</div>
        <div>五</div><div>六</div><div>日</div>
      </div>
    `;

    // 日历格子
    let daysHtml = '<div class="calendar-days">';
    
    // 补充上月空白
    for (let i = 0; i < (firstDayWeek || 7) - 1; i++) {
      daysHtml += '<div class="calendar-day empty"></div>';
    }
    
    // 填充当月日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const isToday = this.isToday(date);
      const isSelected = this.isSameDate(date, this.selectedDate);
      
      daysHtml += `
        <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
             data-date="${date.toISOString()}">
          <div class="day-number">${day}</div>
          <div class="day-stars">
            <i class="fas fa-star"></i>
            <span class="stars-count" id="stars-${date.toISOString()}">-</span>
          </div>
          <div class="day-tasks-indicator" id="tasks-${date.toISOString()}"></div>
        </div>
      `;
    }
    
    daysHtml += '</div>';
    
    // 渲染日历
    this.container.innerHTML = `
      <div class="calendar">
        ${header}
        ${daysHtml}
      </div>
      <div class="daily-summary" id="dailySummary"></div>
      <div class="task-creator" style="display: none">
        <div class="no-tasks-message">
          <p>暂无目标可评分</p>
          <button class="btn-create-task">
            <i class="fas fa-plus"></i>
            创建目标
          </button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // 上一月
    this.container.querySelector('.btn-prev-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.render();
    });

    // 下一月
    this.container.querySelector('.btn-next-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.render();
    });

    // 选择日期
    this.container.querySelectorAll('.calendar-day:not(.empty)').forEach(day => {
      day.addEventListener('click', (e) => {
        const dateStr = e.currentTarget.dataset.date;
        this.selectedDate = new Date(dateStr);
        this.render();
        this.loadTasks(this.selectedDate);
      });
    });

    // 添加创建任务按钮事件
    this.container.querySelector('.btn-create-task')?.addEventListener('click', () => {
      window.location.href = `/pages/createTask.html?date=${this.selectedDate.toISOString()}`;
    });
  }

  async loadTasks(date) {
    try {
      const response = await fetch(`/api/tasks/daily/${date.toISOString()}`);
      const data = await response.json();
      
      // 更新日期格子中的星星数量
      const starsElement = document.getElementById(`stars-${date.toISOString()}`);
      const tasksIndicator = document.getElementById(`tasks-${date.toISOString()}`);
      
      if (data.tasks.length > 0) {
        starsElement.textContent = data.totalPoints;
        tasksIndicator.innerHTML = `<span class="task-count">${data.tasks.length}个任务</span>`;
      } else {
        starsElement.textContent = '-';
        tasksIndicator.innerHTML = '';
      }

      // 应用筛选
      const filteredTasks = this.filterTasks(data.tasks);
      data.tasks = filteredTasks;
      
      // 显示或隐藏任务创建区域
      const taskCreator = this.container.querySelector('.task-creator');
      if (data.tasks.length === 0) {
        taskCreator.style.display = 'block';
      } else {
        taskCreator.style.display = 'none';
      }

      this.renderDailySummary(data);
    } catch (error) {
      console.error('加载任务失败:', error);
    }
  }

  filterTasks(tasks) {
    return tasks.filter(task => {
      // 分类筛选
      if (this.currentFilter.category !== 'all' && 
          task.category !== this.currentFilter.category) {
        return false;
      }
      
      // 搜索筛选
      if (this.currentFilter.searchText && 
          !task.name.toLowerCase().includes(this.currentFilter.searchText.toLowerCase())) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      // 排序
      switch (this.currentFilter.sortBy) {
        case 'points':
          return b.points - a.points;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'time':
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });
  }

  renderDailySummary(data) {
    const summary = document.getElementById('dailySummary');
    const { tasks, totalPoints } = data;

    summary.innerHTML = `
      <div class="daily-header">
        <h3>${this.formatDate(this.selectedDate)} 任务总结</h3>
        <div class="total-points">总积分：${totalPoints}</div>
      </div>
      <div class="task-list">
        ${tasks.map(task => `
          <div class="task-item ${task.completed ? 'completed' : ''}">
            <img src="${task.icon}" alt="${task.name}" class="task-icon">
            <div class="task-info">
              <div class="task-name">${task.name}</div>
              <div class="task-points">+${task.points}分</div>
            </div>
            <div class="task-status">
              ${task.completed ? '已完成' : '未完成'}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 辅助方法
  isToday(date) {
    const today = new Date();
    return this.isSameDate(date, today);
  }

  isSameDate(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  formatDate(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }
} 