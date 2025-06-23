class Dashboard {
    constructor() {
        this.babyId = new URLSearchParams(window.location.search).get('babyId');
        if (!this.babyId) {
            window.location.href = '/';
            return;
        }
        this.init();
    }

    async init() {
        await this.loadBabyInfo();
        this.initComponents();
    }

    async loadBabyInfo() {
        try {
            const response = await fetch(`/api/babies/${this.babyId}`);
            this.babyInfo = await response.json();
            this.updateHeader();
        } catch (error) {
            console.error('加载宝贝信息失败:', error);
        }
    }

    updateHeader() {
        const header = document.querySelector('.dashboard-header');
        header.innerHTML = `
            <div class="baby-profile">
                <img src="${this.babyInfo.avatar}" alt="${this.babyInfo.nickname}" class="baby-avatar">
                <div class="baby-details">
                    <h2>${this.babyInfo.nickname}</h2>
                    <div class="stars-total">
                        <i class="fas fa-star"></i>
                        总计 ${this.babyInfo.stars} 颗星星
                    </div>
                </div>
            </div>
            <nav class="nav-links">
                <a href="/" class="nav-link">
                    <i class="fas fa-home"></i>
                    首页
                </a>
                <a href="/pages/addBaby.html" class="nav-link">
                    <i class="fas fa-user-plus"></i>
                    添加宝贝
                </a>
            </nav>
        `;
    }

    initComponents() {
        // 初始化任务筛选器和日历组件
        this.taskFilter = new TaskFilter('taskFilterContainer');
        this.calendar = new Calendar('calendarContainer');
        
        // 绑定事件监听
        this.bindEvents();
    }

    // 可以添加任务完成状态更新的处理
    bindEvents() {
        document.getElementById('dailySummary').addEventListener('click', async (e) => {
            const taskItem = e.target.closest('.task-item');
            if (taskItem) {
                const taskId = taskItem.dataset.taskId;
                const completed = !taskItem.classList.contains('completed');
                
                try {
                    await fetch(`/api/tasks/${taskId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ completed })
                    });
                    
                    // 重新加载当天任务
                    this.calendar.loadTasks(this.calendar.selectedDate);
                } catch (error) {
                    console.error('更新任务状态失败:', error);
                }
            }
        });

        // 监听筛选事件
        document.getElementById('taskFilterContainer').addEventListener('categoryChange', (e) => {
            this.calendar.currentFilter.category = e.detail.category;
            this.calendar.loadTasks(this.calendar.selectedDate);
        });

        document.getElementById('taskFilterContainer').addEventListener('searchChange', (e) => {
            this.calendar.currentFilter.searchText = e.detail.searchText;
            this.calendar.loadTasks(this.calendar.selectedDate);
        });

        document.getElementById('taskFilterContainer').addEventListener('sortChange', (e) => {
            this.calendar.currentFilter.sortBy = e.detail.sortBy;
            this.calendar.loadTasks(this.calendar.selectedDate);
        });

        document.getElementById('taskFilterContainer').addEventListener('viewChange', (e) => {
            this.calendar.currentFilter.view = e.detail.view;
            this.calendar.loadTasks(this.calendar.selectedDate);
        });
    }
}

// 初始化仪表板
const dashboard = new Dashboard(); 