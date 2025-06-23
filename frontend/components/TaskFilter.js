class TaskFilter {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.categories = [
      { id: 'all', name: '全部任务' },
      { id: 'daily', name: '日常任务' },
      { id: 'study', name: '学习任务' },
      { id: 'behavior', name: '行为习惯' },
      { id: 'special', name: '特殊成就' }
    ];
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="task-filter">
        <div class="filter-header">
          <h3>任务分类</h3>
          <div class="view-toggle">
            <button class="btn-list-view active" title="列表视图">
              <i class="fas fa-list"></i>
            </button>
            <button class="btn-grid-view" title="网格视图">
              <i class="fas fa-th"></i>
            </button>
          </div>
        </div>
        
        <div class="category-list">
          ${this.categories.map(category => `
            <button class="category-item ${category.id === 'all' ? 'active' : ''}" 
                    data-category="${category.id}">
              ${this.getCategoryIcon(category.id)}
              <span>${category.name}</span>
              <span class="task-count">0</span>
            </button>
          `).join('')}
        </div>

        <div class="filter-options">
          <div class="search-box">
            <input type="text" placeholder="搜索任务..." id="taskSearch">
            <i class="fas fa-search"></i>
          </div>
          
          <div class="sort-options">
            <select id="taskSort">
              <option value="time">按时间</option>
              <option value="points">按积分</option>
              <option value="name">按名称</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  getCategoryIcon(categoryId) {
    const icons = {
      all: '<i class="fas fa-tasks"></i>',
      daily: '<i class="fas fa-sun"></i>',
      study: '<i class="fas fa-book"></i>',
      behavior: '<i class="fas fa-child"></i>',
      special: '<i class="fas fa-star"></i>'
    };
    return icons[categoryId] || icons.all;
  }

  bindEvents() {
    // 分类切换
    this.container.querySelectorAll('.category-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.container.querySelectorAll('.category-item').forEach(item => 
          item.classList.remove('active'));
        btn.classList.add('active');
        
        const category = btn.dataset.category;
        this.container.dispatchEvent(new CustomEvent('categoryChange', {
          detail: { category }
        }));
      });
    });

    // 视图切换
    const listViewBtn = this.container.querySelector('.btn-list-view');
    const gridViewBtn = this.container.querySelector('.btn-grid-view');
    
    listViewBtn.addEventListener('click', () => {
      listViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
      this.container.dispatchEvent(new CustomEvent('viewChange', {
        detail: { view: 'list' }
      }));
    });

    gridViewBtn.addEventListener('click', () => {
      gridViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
      this.container.dispatchEvent(new CustomEvent('viewChange', {
        detail: { view: 'grid' }
      }));
    });

    // 搜索功能
    let searchTimeout;
    this.container.querySelector('#taskSearch').addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const searchText = e.target.value.trim();
        this.container.dispatchEvent(new CustomEvent('searchChange', {
          detail: { searchText }
        }));
      }, 300);
    });

    // 排序方式
    this.container.querySelector('#taskSort').addEventListener('change', (e) => {
      const sortBy = e.target.value;
      this.container.dispatchEvent(new CustomEvent('sortChange', {
        detail: { sortBy }
      }));
    });
  }

  updateTaskCount(counts) {
    Object.entries(counts).forEach(([category, count]) => {
      const categoryBtn = this.container.querySelector(`[data-category="${category}"]`);
      if (categoryBtn) {
        categoryBtn.querySelector('.task-count').textContent = count;
      }
    });
  }
} 