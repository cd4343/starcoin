class DashboardManager {
    constructor() {
        this.babyId = null;
        this.selectedDate = new Date();
        this.goals = [];
        this.init();
    }

    async init() {
        try {
            // 从URL获取参数
            const urlParams = new URLSearchParams(window.location.search);
            this.babyId = urlParams.get('babyId');
            const dateStr = urlParams.get('date');
            
            // 如果URL中没有babyId，尝试从localStorage获取
            if (!this.babyId) {
                this.babyId = localStorage.getItem('lastBabyId');
                console.log('从localStorage获取babyId:', this.babyId);
                
                // 如果成功从localStorage获取到babyId，更新URL
                if (this.babyId) {
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.set('babyId', this.babyId);
                    window.history.replaceState({}, '', newUrl);
                    console.log('已更新URL包含babyId');
                } else {
                    console.error('无法获取babyId，可能导致加载失败');
                }
            }
            
            if (dateStr) {
                this.selectedDate = new Date(dateStr);
            }
            
            // 更新日期显示
            this.updateDateDisplay();
            
            // 加载目标数据
            await this.loadGoals();
            
            // 绑定事件
            this.bindEvents();
        } catch (error) {
            console.error('初始化仪表板失败:', error);
            alert('加载数据失败，请重试');
        }
    }

    updateDateDisplay() {
        const dateDay = document.getElementById('currentDay');
        const dateDate = document.getElementById('currentDate');
        
        // 设置日期显示
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const dayIndex = this.selectedDate.getDay();
        
        // 更新顶部日期显示（如果元素存在）
        if (dateDay) {
            dateDay.textContent = weekdays[dayIndex];
        }
        
        // 格式化日期
        const year = this.selectedDate.getFullYear();
        const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(this.selectedDate.getDate()).padStart(2, '0');
        
        if (dateDate) {
            dateDate.textContent = `${year}-${month}-${day}`;
        }
        
        // 更新日期导航中的日期
        // 找到当前日期相关的元素并更新显示
        const dateItems = document.querySelectorAll('.date-item');
        if (dateItems && dateItems.length > 0) {
            // 默认当天在中间位置（索引为2）
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // 计算选中日期与今天的差值（天数）
            const diffDays = Math.round((this.selectedDate - today) / (1000 * 60 * 60 * 24));
            
            // 根据差值设置active状态
            dateItems.forEach((item, index) => {
                const offset = parseInt(item.dataset.offset || '0');
                
                // 更新日期项的active状态
                if (offset === diffDays) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
                
                // 更新日期显示
                const dayElement = item.querySelector('.date-day');
                const dateElement = item.querySelector('.date-date');
                
                if (dayElement && dateElement) {
                    const itemDate = new Date(today);
                    itemDate.setDate(today.getDate() + offset);
                    
                    // 判断是否是今天
                    if (offset === 0) {
                        dayElement.textContent = '今天';
                    } else if (offset === 1) {
                        dayElement.textContent = '明天';
                    } else if (offset === -1) {
                        dayElement.textContent = '昨天';
                    } else {
                        dayElement.textContent = weekdays[itemDate.getDay()];
                    }
                    
                    dateElement.textContent = itemDate.getDate();
                }
            });
        }
        
        // 检查是否是历史日期
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(this.selectedDate);
        selectedDate.setHours(0, 0, 0, 0);
        
        // 更新按钮状态
        const nextDayBtn = document.getElementById('nextDay');
        if (nextDayBtn) {
            nextDayBtn.disabled = selectedDate >= today;
        }
    }

    async loadGoals() {
        try {
            if (!this.babyId) {
                console.error('未选择宝宝ID');
                
                // 显示更友好的提示，而不仅仅是显示"暂无目标"信息
                const noGoalsMessage = document.getElementById('noGoalsMessage');
                if (noGoalsMessage) {
                    // 替换原有暂无目标消息的内容
                    noGoalsMessage.innerHTML = `
                        <div class="message-content">
                            <i class="fas fa-child"></i>
                            <h3>请先选择宝宝</h3>
                            <p>需要选择一个宝宝才能查看和管理目标</p>
                            <button class="btn-add-goal" onclick="window.location.href='/'">
                                <i class="fas fa-user"></i>
                                选择宝宝
                            </button>
                        </div>
                    `;
                }
                
                this.showNoGoalsMessage();
                return;
            }
            
            // 格式化日期
            const dateStr = this.formatDate(this.selectedDate);
            
            console.log(`正在加载宝宝 ${this.babyId} 在 ${dateStr} 的目标数据...`);
            
            try {
                // 从API获取目标数据
                const url = `/api/babies/${this.babyId}/goals/daily?date=${dateStr}`;
                console.log('请求URL:', url);
                
                const response = await fetch(url);
                console.log('API响应状态:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('API错误响应:', errorText);
                    throw new Error(`获取目标数据失败: ${response.status} ${errorText}`);
                }
                
                let data;
                try {
                    const text = await response.text();
                    console.log('API原始响应:', text);
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('解析响应数据失败:', e);
                    throw new Error('服务器返回的数据格式不正确');
                }
                
                console.log('解析后的目标数据:', data);
                
                // 确保data是数组
                if (!Array.isArray(data)) {
                    console.error('服务器返回的数据不是数组:', data);
                    // 使用模拟数据
                    data = this.getMockGoals();
                }
                
                this.goals = data;
            } catch (error) {
                console.error('从API加载目标失败，使用模拟数据:', error);
                // 使用模拟数据
                this.goals = this.getMockGoals();
            }
            
            // 更新UI显示
            this.updateGoalsDisplay();
            
            // 更新进度条
            this.updateProgress();
        } catch (error) {
            console.error('加载目标失败:', error);
            this.showNoGoalsMessage();
        }
    }

    updateGoalsDisplay() {
        const goalsContainer = document.getElementById('goalsContainer');
        const noGoalsMessage = document.getElementById('noGoalsMessage');
        
        if (!this.goals || this.goals.length === 0) {
            console.log('没有找到目标数据，显示暂无目标消息');
            this.showNoGoalsMessage();
            return;
        }
        
        console.log(`找到 ${this.goals.length} 个目标，开始渲染目标列表`);
        
        // 隐藏暂无目标消息
        if (noGoalsMessage) {
            noGoalsMessage.style.display = 'none';
        }
        
        // 显示目标列表
        if (goalsContainer) {
            goalsContainer.style.display = 'block';
            
            // 清空现有内容
            goalsContainer.innerHTML = '';
            
            // 按分类对目标进行分组
            const goalsByCategory = this.groupGoalsByCategory(this.goals);
            
            // 渲染每个分类的目标
            Object.entries(goalsByCategory).forEach(([category, goals]) => {
                const categoryContainer = document.createElement('div');
                categoryContainer.className = 'category-container';
                
                // 添加分类标题
                categoryContainer.innerHTML = `
                    <div class="category-header">
                        <div class="category-title" data-category="${category}">
                            ${this.getCategoryName(category)} ${goals.length}
                        </div>
                    </div>
                `;
                
                // 创建目标列表容器
                const goalsList = document.createElement('div');
                goalsList.className = 'goals-list';
                
                // 添加每个目标
                goals.forEach(goal => {
                    const goalCard = this.createGoalCard(goal);
                    goalsList.appendChild(goalCard);
                });
                
                categoryContainer.appendChild(goalsList);
                goalsContainer.appendChild(categoryContainer);
            });
        }
    }
    
    // 创建目标卡片
    createGoalCard(goal) {
        const card = document.createElement('div');
        card.className = 'goal-card';
        card.dataset.id = goal.id;
        
        if (goal.completed) {
            card.classList.add('completed');
        }
        
        card.innerHTML = `
            <div class="goal-card-left">
                <div class="goal-icon ${goal.iconClass || ''}">
                    ${goal.icon ? `<img src="${goal.icon}" alt="${goal.title}">` : ''}
                </div>
                <div class="goal-info">
                    <div class="goal-title">${goal.title}</div>
                    <div class="goal-description">${goal.description || ''}</div>
                </div>
            </div>
            <div class="goal-rating">
                ${goal.completed ? `
                    <div class="rating-stars ${goal.isPositive ? 'positive' : 'negative'}">
                        <i class="fas ${goal.isPositive ? 'fa-star' : 'fa-angry'}"></i>
                        <span class="star-value">${goal.isPositive ? '+' : ''}${goal.stars || 0}</span>
                    </div>
                ` : `
                    <div class="rating-placeholder">
                        <i class="far fa-meh"></i>
                    </div>
                `}
            </div>
        `;
        
        return card;
    }
    
    // 按分类对目标进行分组
    groupGoalsByCategory(goals) {
        return goals.reduce((groups, goal) => {
            const category = goal.category || 'other';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(goal);
            return groups;
        }, {});
    }
    
    // 获取分类名称
    getCategoryName(category) {
        const categoryNames = {
            independent: '独立',
            labor: '劳动',
            study: '学习',
            life: '生活',
            criticism: '批评',
            praise: '表扬',
            other: '其他'
        };
        return categoryNames[category] || category;
    }

    showNoGoalsMessage() {
        const noGoalsMessage = document.getElementById('noGoalsMessage');
        const goalsContainer = document.getElementById('goalsContainer');
        
        if (noGoalsMessage) {
            noGoalsMessage.style.display = 'flex';
        }
        
        if (goalsContainer) {
            goalsContainer.style.display = 'none';
        }
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    bindEvents() {
        // 绑定日期导航按钮事件
        const prevDayBtn = document.getElementById('prevDay');
        const nextDayBtn = document.getElementById('nextDay');
        
        if (prevDayBtn) {
            prevDayBtn.addEventListener('click', () => {
                const newDate = new Date(this.selectedDate);
                newDate.setDate(newDate.getDate() - 1);
                this.selectedDate = newDate;
                this.updateDateDisplay();
                this.loadGoals();
            });
        }
        
        if (nextDayBtn) {
            nextDayBtn.addEventListener('click', () => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (this.selectedDate < today) {
                    const newDate = new Date(this.selectedDate);
                    newDate.setDate(newDate.getDate() + 1);
                    this.selectedDate = newDate;
                    this.updateDateDisplay();
                    this.loadGoals();
                }
            });
        }
        
        // 绑定添加目标按钮事件
        const addGoalBtn = document.getElementById('addGoalBtn');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => {
                // 跳转到添加目标页面
                const dateStr = this.formatDate(this.selectedDate);
                window.location.href = `add-goal.html?babyId=${this.babyId}&date=${dateStr}`;
            });
        }
        
        // 绑定目标管理按钮事件
        const manageGoalsBtn = document.getElementById('manageGoalsBtn');
        if (manageGoalsBtn) {
            manageGoalsBtn.addEventListener('click', () => {
                // 跳转到添加目标页面
                const dateStr = this.formatDate(this.selectedDate);
                window.location.href = `add-goal.html?babyId=${this.babyId}&date=${dateStr}`;
            });
        }
        
        // 绑定关闭目标管理弹窗按钮事件
        const closeGoalModal = document.getElementById('closeGoalModal');
        if (closeGoalModal) {
            closeGoalModal.addEventListener('click', () => {
                this.closeGoalManagementModal();
            });
        }
        
        // 绑定添加自定义目标按钮事件
        const addCustomGoalBtn = document.getElementById('addCustomGoalBtn');
        if (addCustomGoalBtn) {
            addCustomGoalBtn.addEventListener('click', () => {
                this.openCustomGoalModal();
            });
        }
        
        // 绑定关闭自定义目标弹窗按钮事件
        const closeCustomGoalModal = document.getElementById('closeCustomGoalModal');
        if (closeCustomGoalModal) {
            closeCustomGoalModal.addEventListener('click', () => {
                this.closeCustomGoalModal();
            });
        }
        
        // 绑定保存自定义目标按钮事件
        const saveCustomGoalBtn = document.getElementById('saveCustomGoalBtn');
        if (saveCustomGoalBtn) {
            saveCustomGoalBtn.addEventListener('click', () => {
                this.saveCustomGoal();
            });
        }
        
        // 绑定取消自定义目标按钮事件
        const cancelCustomGoalBtn = document.getElementById('cancelCustomGoalBtn');
        if (cancelCustomGoalBtn) {
            cancelCustomGoalBtn.addEventListener('click', () => {
                this.closeCustomGoalModal();
            });
        }
        
        // 绑定星星数量增减按钮事件
        const decreasePointsBtn = document.getElementById('decreasePoints');
        const increasePointsBtn = document.getElementById('increasePoints');
        
        if (decreasePointsBtn) {
            decreasePointsBtn.addEventListener('click', () => {
                const pointsInput = document.getElementById('customGoalPoints');
                if (pointsInput) {
                    let value = parseInt(pointsInput.value) || 1;
                    value = Math.max(1, value - 1);
                    pointsInput.value = value;
                }
            });
        }
        
        if (increasePointsBtn) {
            increasePointsBtn.addEventListener('click', () => {
                const pointsInput = document.getElementById('customGoalPoints');
                if (pointsInput) {
                    let value = parseInt(pointsInput.value) || 1;
                    value = Math.min(10, value + 1);
                    pointsInput.value = value;
                }
            });
        }
    }
    
    // 打开目标管理弹窗
    openGoalManagementModal() {
        const modal = document.getElementById('goalModal');
        if (modal) {
            modal.style.display = 'flex';
            // 加载目标列表
            this.loadGoalList();
        }
    }
    
    // 关闭目标管理弹窗
    closeGoalManagementModal() {
        const modal = document.getElementById('goalModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // 打开添加自定义目标弹窗
    openCustomGoalModal() {
        // 关闭目标管理弹窗
        this.closeGoalManagementModal();
        
        // 打开自定义目标弹窗
        const modal = document.getElementById('customGoalModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    // 关闭添加自定义目标弹窗
    closeCustomGoalModal() {
        const modal = document.getElementById('customGoalModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // 保存自定义目标
    async saveCustomGoal() {
        try {
            // 获取表单数据
            const title = document.getElementById('customGoalTitle').value;
            const category = document.getElementById('customGoalCategory').value;
            const points = parseInt(document.getElementById('customGoalPoints').value) || 1;
            const description = document.getElementById('customGoalDescription').value;
            
            // 表单验证
            if (!title) {
                alert('请输入目标名称');
                return;
            }
            
            // 构建目标对象
            const newGoal = {
                title,
                category,
                description,
                stars: points,
                isPositive: true,
                completed: false,
                date: this.formatDate(this.selectedDate)
            };
            
            console.log('创建新目标:', newGoal);
            
            // 发送请求保存目标
            const response = await fetch(`/api/babies/${this.babyId}/goals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newGoal)
            });
            
            if (response.ok) {
                // 关闭弹窗
                this.closeCustomGoalModal();
                
                // 重新加载目标列表
                await this.loadGoals();
                
                // 显示成功提示
                alert('目标添加成功');
            } else {
                const error = await response.text();
                throw new Error(`添加目标失败: ${error}`);
            }
        } catch (error) {
            console.error('保存自定义目标失败:', error);
            alert('添加目标失败，请重试');
        }
    }
    
    // 加载目标列表
    async loadGoalList() {
        try {
            const goalList = document.getElementById('goalList');
            if (!goalList) return;
            
            // 清空现有内容
            goalList.innerHTML = '<div class="loading-message">加载中...</div>';
            
            // 获取目标模板列表
            const response = await fetch(`/api/goal-templates?babyId=${this.babyId}`);
            
            if (!response.ok) {
                throw new Error(`获取目标模板失败: ${response.status}`);
            }
            
            let templates = [];
            try {
                templates = await response.json();
            } catch (e) {
                console.error('解析目标模板数据失败:', e);
                templates = [];
            }
            
            // 清空加载提示
            goalList.innerHTML = '';
            
            // 如果没有模板
            if (!templates || templates.length === 0) {
                goalList.innerHTML = '<div class="no-goals-message">暂无目标模板</div>';
                return;
            }
            
            // 渲染模板列表
            templates.forEach(template => {
                const templateElement = document.createElement('div');
                templateElement.className = 'goal-template-item';
                templateElement.dataset.id = template.id;
                templateElement.dataset.category = template.category;
                
                templateElement.innerHTML = `
                    <div class="goal-template-icon ${template.iconClass || ''}">
                        ${template.icon ? `<img src="${template.icon}" alt="${template.title}">` : ''}
                    </div>
                    <div class="goal-template-info">
                        <div class="goal-template-title">${template.title}</div>
                        <div class="goal-template-description">${template.description || ''}</div>
                    </div>
                    <div class="goal-template-add">
                        <button class="btn-add-template" data-id="${template.id}">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                `;
                
                // 添加点击事件
                templateElement.querySelector('.btn-add-template').addEventListener('click', () => {
                    this.addGoalFromTemplate(template);
                });
                
                goalList.appendChild(templateElement);
            });
            
        } catch (error) {
            console.error('加载目标列表失败:', error);
            const goalList = document.getElementById('goalList');
            if (goalList) {
                goalList.innerHTML = '<div class="error-message">加载失败，请重试</div>';
            }
        }
    }
    
    // 从模板添加目标
    async addGoalFromTemplate(template) {
        try {
            // 构建目标对象
            const newGoal = {
                title: template.title,
                category: template.category,
                description: template.description,
                stars: template.stars || 1,
                isPositive: template.isPositive !== false,
                completed: false,
                date: this.formatDate(this.selectedDate),
                templateId: template.id
            };
            
            console.log('从模板创建新目标:', newGoal);
            
            // 发送请求保存目标
            const response = await fetch(`/api/babies/${this.babyId}/goals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newGoal)
            });
            
            if (response.ok) {
                // 关闭弹窗
                this.closeGoalManagementModal();
                
                // 重新加载目标列表
                await this.loadGoals();
                
                // 显示成功提示
                alert('目标添加成功');
            } else {
                const error = await response.text();
                throw new Error(`添加目标失败: ${error}`);
            }
        } catch (error) {
            console.error('从模板添加目标失败:', error);
            alert('添加目标失败，请重试');
        }
    }

    updateProgress() {
        const progressText = document.getElementById('goalProgress');
        const progressBar = document.getElementById('goalProgressBar');
        const dailyStars = document.getElementById('dailyStars');
        
        if (!this.goals) {
            progressText.textContent = '0/0';
            progressBar.style.width = '0%';
            dailyStars.textContent = '0';
            return;
        }
        
        const totalGoals = this.goals.length;
        const completedGoals = this.goals.filter(goal => goal.completed).length;
        const totalStars = this.goals.reduce((sum, goal) => sum + (goal.completed ? (goal.stars || 0) : 0), 0);
        
        progressText.textContent = `${completedGoals}/${totalGoals}`;
        progressBar.style.width = totalGoals > 0 ? `${(completedGoals / totalGoals) * 100}%` : '0%';
        dailyStars.textContent = totalStars.toString();
    }

    // 获取模拟目标数据
    getMockGoals() {
        return [
            {
                id: 1,
                title: '早上7点起床',
                description: '自己设闹钟起床，不需要家长催促',
                category: 'independent',
                completed: false,
                stars: 3,
                isPositive: true,
                iconClass: 'goal-icon-morning'
            },
            {
                id: 2,
                title: '整理书桌',
                description: '将书本和文具整理好',
                category: 'labor',
                completed: true,
                stars: 2,
                isPositive: true,
                iconClass: 'goal-icon-clean'
            },
            {
                id: 3,
                title: '阅读30分钟',
                description: '阅读一本有趣的书',
                category: 'study',
                completed: false,
                stars: 3,
                isPositive: true,
                iconClass: 'goal-icon-book'
            },
            {
                id: 4,
                title: '自己刷牙',
                description: '早晚各刷一次牙',
                category: 'life',
                completed: true,
                stars: 1,
                isPositive: true,
                iconClass: 'goal-icon-brush'
            },
            {
                id: 5,
                title: '写完数学作业',
                description: '完成老师布置的数学练习',
                category: 'study',
                completed: false,
                stars: 3,
                isPositive: true,
                iconClass: 'goal-icon-math'
            },
            {
                id: 6,
                title: '帮妈妈摆餐具',
                description: '晚餐前帮忙摆好碗筷',
                category: 'labor',
                completed: true,
                stars: 2,
                isPositive: true,
                iconClass: 'goal-icon-help'
            }
        ];
    }
}

// 初始化仪表板
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
}); 