class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.events = {};
        this.babyId = null;
        this.init();
    }

    async init() {
        try {
            // 从 URL 获取日期和宝宝ID参数
            const searchParams = new URLSearchParams(window.location.search);
            const dateStr = searchParams.get('date');
            this.babyId = searchParams.get('babyId');
            
            // 如果没有宝宝ID，尝试从localStorage获取最后使用的宝宝ID
            if (!this.babyId) {
                this.babyId = localStorage.getItem('lastBabyId');
                
                // 如果仍然没有宝宝ID，尝试获取第一个宝宝
                if (!this.babyId) {
                    await this.loadFirstBaby();
                }
            }
            
            if (dateStr) {
                this.currentDate = new Date(dateStr);
            }
            
            // 加载宝贝信息
            await this.loadBabyInfo();
            
            // 初始化日历
            this.renderCalendar();
            
            // 加载月度统计数据（这会调用loadMonthStars获取实际数据）
            await this.loadMonthStats();
            
            // 绑定事件
            this.bindEvents();
            
            // 初始化目标进度条和分类统计
            this.initializeGoalStats();
            
            console.log('日历初始化完成，宝宝ID:', this.babyId);
        } catch (error) {
            console.error('初始化日历失败:', error);
        }
    }

    async loadBabyInfo() {
        try {
            // 从API获取宝贝信息
            const response = await fetch(`/api/babies/${this.babyId}`);
            if (!response.ok) {
                throw new Error('获取宝贝信息失败');
            }
            
            const babyInfo = await response.json();
            
            // 更新宝贝信息
            document.getElementById('calendarBabyName').textContent = babyInfo.nickname || 'Morning';
            document.getElementById('calendarBabyStreak').textContent = babyInfo.streak || 1;
            
            // 更新宝贝头像
            const avatarImg = document.getElementById('calendarBabyAvatar');
            if (babyInfo.avatar) {
                avatarImg.src = babyInfo.avatar;
            }
            
            console.log('宝贝信息加载完成:', babyInfo);
        } catch (error) {
            console.error('加载宝贝信息失败:', error);
        }
    }

    async loadFirstBaby() {
        try {
            // 获取所有宝宝列表
            const response = await fetch('/api/babies');
            if (!response.ok) {
                throw new Error('获取宝宝列表失败');
            }
            
            const babies = await response.json();
            if (babies && babies.length > 0) {
                // 使用第一个宝宝的ID
                this.babyId = babies[0].id;
                // 保存到localStorage
                localStorage.setItem('lastBabyId', this.babyId);
                console.log('已自动选择第一个宝宝:', this.babyId);
            }
        } catch (error) {
            console.error('加载第一个宝宝失败:', error);
        }
    }

    renderCalendar() {
        // 设置当前月份标题
        const monthYear = this.formatMonthYear(this.currentDate);
        document.getElementById('currentMonth').textContent = monthYear;
        
        // 获取当前月的第一天
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        
        // 获取当前月的最后一天
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        
        // 获取当前月第一天是星期几 (0-6)
        const firstDayIndex = firstDay.getDay();
        
        // 获取当前月的总天数
        const daysInMonth = lastDay.getDate();
        
        // 获取日历容器
        const calendarGrid = document.getElementById('calendar');
        
        // 清空日历
        calendarGrid.innerHTML = '';
        
        // 添加上个月的日期
        for (let i = 0; i < firstDayIndex; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day', 'empty');
            calendarGrid.appendChild(dayElement);
        }
        
        // 获取今天的日期
        const today = new Date();
        const isCurrentMonth = today.getMonth() === this.currentDate.getMonth() && 
                               today.getFullYear() === this.currentDate.getFullYear();
        
        // 添加当前月的日期
        for (let i = 1; i <= daysInMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.dataset.day = i;
            
            // 检查是否是今天
            if (isCurrentMonth && i === today.getDate()) {
                dayElement.classList.add('today');
            }
            
            // 检查是否是选中的日期
            if (this.selectedDate && 
                i === this.selectedDate.getDate() && 
                this.currentDate.getMonth() === this.selectedDate.getMonth() && 
                this.currentDate.getFullYear() === this.selectedDate.getFullYear()) {
                dayElement.classList.add('selected');
            }
            
            // 设置日期
            dayElement.innerHTML = `
                <div class="day-number">${i}</div>
                <div class="day-star">
                    <i class="fas fa-star"></i>
                </div>
                <div class="star-count">0</div>
            `;
            
            // 添加点击事件
            dayElement.addEventListener('click', () => {
                this.selectDate(i);
            });
            
            // 添加到日历
            calendarGrid.appendChild(dayElement);
        }
        
        // 添加下个月的日期（如果需要填充网格）
        const totalCells = 42; // 6行 x 7列
        const remainingCells = totalCells - (firstDayIndex + daysInMonth);
        
        if (remainingCells > 0 && remainingCells < 7) {
            for (let i = 1; i <= remainingCells; i++) {
                const dayElement = document.createElement('div');
                dayElement.classList.add('calendar-day', 'empty');
                calendarGrid.appendChild(dayElement);
            }
        }
        
        // 加载当月的星星数据
        this.loadMonthStars();
    }

    async loadMonthStars() {
        if (!this.babyId) return;
        
        try {
            // 获取当前月的年份和月份
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth() + 1; // JavaScript月份从0开始
            
            // 从API获取月度统计数据
            console.log(`加载宝宝 ${this.babyId} 的 ${year}年${month}月 星星数据`);
            
            const response = await fetch(`/api/babies/${this.babyId}/stats/${year}/${month}`);
            if (!response.ok) {
                throw new Error('获取月度统计数据失败');
            }
            
            const data = await response.json();
            
            // 创建日期到统计数据的映射
            const statsMap = {};
            if (data.dailyStats && Array.isArray(data.dailyStats)) {
                data.dailyStats.forEach(stat => {
                    const day = new Date(stat.date).getDate();
                    statsMap[day] = stat;
                });
            }
            
            // 获取当前月的总天数
            const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
            const daysInMonth = lastDay.getDate();
            
            // 更新日历上的星星数量
            for (let day = 1; day <= daysInMonth; day++) {
                const dayElement = document.querySelector(`.calendar-day[data-day="${day}"]`);
                if (dayElement) {
                    const starCount = dayElement.querySelector('.star-count');
                    if (starCount) {
                        // 如果有该日期的统计数据，使用实际星星数；否则显示0
                        const stars = statsMap[day] ? (statsMap[day].total_stars || 0) : 0;
                        starCount.textContent = stars;
                        
                        // 星星图标始终显示，不隐藏
                        const starIcon = dayElement.querySelector('.day-star');
                        if (starIcon) {
                            starIcon.style.visibility = 'visible';
                        }
                    }
                }
            }
            
            // 更新月度统计数据显示
            const totalStarsElement = document.getElementById('totalStars');
            const bestDayElement = document.getElementById('bestDay');
            
            if (totalStarsElement) {
                totalStarsElement.textContent = data.totalStars || 0;
                console.log(`更新总星星数: ${data.totalStars || 0}`);
            }
            
            if (bestDayElement) {
                bestDayElement.textContent = data.daysWithStars || 0;
                console.log(`更新打卡天数: ${data.daysWithStars || 0}`);
            }
            
        } catch (error) {
            console.error('加载月度星星数据失败:', error);
            
            // 出错时，确保所有日期显示0颗星星
            const dayElements = document.querySelectorAll('.calendar-day:not(.empty)');
            dayElements.forEach(dayElement => {
                const starCount = dayElement.querySelector('.star-count');
                if (starCount) {
                    starCount.textContent = '0';
                }
            });
            
            // 出错时，确保本月统计显示0
            const totalStarsElement = document.getElementById('totalStars');
            const bestDayElement = document.getElementById('bestDay');
            
            if (totalStarsElement) {
                totalStarsElement.textContent = '0';
            }
            
            if (bestDayElement) {
                bestDayElement.textContent = '0';
            }
        }
    }

    selectDate(day) {
        // 移除之前选中的日期
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // 设置新的选中日期
        this.selectedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
        
        // 找到对应的日期元素并添加选中样式
        const dayElements = document.querySelectorAll('.calendar-day:not(.empty)');
        const selectedElement = Array.from(dayElements).find(el => parseInt(el.dataset.day) === day);
        if (selectedElement) {
            selectedElement.classList.add('selected');
            
            // 更新月度统计数据
            this.loadMonthStats();
        }
        
        // 跳转到对应宝宝的当天目标页面
        this.navigateToDayView(this.selectedDate);
    }

    navigateToDayView(date) {
        try {
            // 检查是否有宝宝ID
            if (!this.babyId) {
                // 尝试从localStorage获取上次使用的宝宝ID
                const savedBabyId = localStorage.getItem('lastBabyId');
                if (savedBabyId) {
                    this.babyId = savedBabyId;
                    console.log('从localStorage恢复宝宝ID:', this.babyId);
                } else {
                    // 如果仍然没有宝宝ID，提示用户并跳转到首页
                    alert('请先选择一个宝宝档案');
                    window.location.href = '/';
                    return;
                }
            }
            
            // 格式化日期为 YYYY-MM-DD
            const dateStr = this.formatDate(date);
            
            // 检查是否是历史日期
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const selectedDate = new Date(date);
            selectedDate.setHours(0, 0, 0, 0);
            
            // 保存当前宝宝ID到localStorage
            localStorage.setItem('lastBabyId', this.babyId);
            console.log('保存宝宝ID到localStorage:', this.babyId);
            
            // 跳转到宝宝的当天目标页面
            window.location.href = `/pages/dashboard.html?babyId=${this.babyId}&date=${dateStr}`;
            
        } catch (error) {
            console.error('跳转到日期视图失败:', error);
            alert('跳转失败，请重试');
        }
    }

    async loadMonthStats() {
        try {
            // 检查是否有宝宝ID
            if (!this.babyId) {
                console.log('没有宝宝ID，无法加载统计数据');
                return;
            }
            
            // 获取当前月的年份和月份
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth() + 1; // JavaScript月份从0开始
            
            console.log(`加载宝宝 ${this.babyId} 的 ${year}年${month}月 统计数据`);
            
            // 调用loadMonthStars函数加载星星数据
            // 这个函数会从API获取数据并更新日历
            await this.loadMonthStars();
            
            // 不再需要重新计算，因为loadMonthStars已经更新了统计数据
            
        } catch (error) {
            console.error('加载月度统计失败:', error);
        }
    }

    // 更新目标进度条
    updateGoalProgress() {
        try {
            console.log('开始更新目标进度条...');
            
            // 首先尝试从DOM直接计算分类统计
            const categoryStats = this.calculateCategoryStatsFromDOM();
            
            // 如果从DOM计算到了分类统计，直接使用
            if (Object.keys(categoryStats).length > 0) {
                console.log('使用从DOM计算的分类统计更新进度条');
                
                // 更新总进度
                this.updateTotalProgressFromStats(categoryStats);
                
                // 计算并更新总星星数
                this.calculateTotalStarsFromGoals();
                
                return;
            }
            
            // 如果无法从DOM计算，则使用localStorage中的数据
            console.log('从DOM计算分类统计失败，使用localStorage数据');
            
            // 获取目标数据
            const goalsData = this.getGoalsData();
            const goalCategories = goalsData.categories;
            
            // 计算总目标数和已完成目标数
            let totalGoals = 0;
            let completedGoals = 0;
            
            // 遍历所有分类，累计目标数和完成数
            Object.values(goalCategories).forEach(category => {
                totalGoals += category.total;
                completedGoals += category.completed;
            });
            
            // 更新进度文本
            const goalProgressElement = document.getElementById('goalProgress');
            if (goalProgressElement) {
                const oldText = goalProgressElement.textContent;
                const newText = `${completedGoals}/${totalGoals}`;
                
                if (oldText !== newText) {
                    goalProgressElement.textContent = newText;
                    console.log(`目标进度更新: ${oldText} -> ${newText}`);
                }
            }
            
            // 更新进度条
            const progressBarElement = document.getElementById('goalProgressBar');
            if (progressBarElement) {
                const progressPercentage = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
                progressBarElement.style.width = `${progressPercentage}%`;
            }
            
            // 计算并更新总星星数
            this.calculateTotalStarsFromGoals();
            
        } catch (error) {
            console.error('更新目标进度失败:', error);
        }
    }
    
    // 从目标卡片中计算总星星数
    calculateTotalStarsFromGoals() {
        try {
            // 获取已完成的目标数据
            const goalsData = this.getGoalsData();
            const completedGoals = goalsData.completedGoals;
            
            // 计算总星星数
            let totalStars = completedGoals.reduce((sum, goal) => sum + (goal.stars || 0), 0);
            
            // 更新星星数量显示
            const progressStarsElement = document.getElementById('progressStars');
            if (progressStarsElement) {
                progressStarsElement.textContent = totalStars;
            }
            
        } catch (error) {
            console.error('计算目标星星总数失败:', error);
        }
    }

    formatMonthYear(date) {
        return `${date.getFullYear()}年${date.getMonth() + 1}月`;
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    bindEvents() {
        // 绑定上个月按钮
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.changeMonth(-1);
        });
        
        // 绑定下个月按钮
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.changeMonth(1);
        });
        
        // 处理底部导航栏的活跃状态
        this.updateActiveNavItem();
        
        // 添加窗口历史状态变化事件监听
        window.addEventListener('popstate', () => {
            this.handlePopState();
        });
        
        // 绑定返回按钮
        const backButton = document.querySelector('.btn-back');
        if (backButton) {
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = `/?babyId=${this.babyId}`;
            });
        }
        
        // 绑定目标添加按钮事件
        this.bindGoalAdditionEvents();
    }

    changeMonth(offset) {
        // 更新当前日期
        this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + offset, 1);
        
        // 重新渲染日历
        this.renderCalendar();
        
        // 加载新月份的统计数据
        this.loadMonthStats();
    }

    updateActiveNavItem() {
        // 移除所有导航项的活跃状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 添加当前页面的活跃状态
        const calendarNavItem = document.querySelector('.nav-item[href="/pages/calendar.html"]');
        if (calendarNavItem) {
            calendarNavItem.classList.add('active');
        }
    }

    handlePopState() {
        // 从 URL 获取日期参数
        const searchParams = new URLSearchParams(window.location.search);
        const dateStr = searchParams.get('date');
        const newBabyId = searchParams.get('babyId');
        
        // 更新宝宝ID
        if (newBabyId) {
            this.babyId = newBabyId;
        }
        
        if (dateStr) {
            const date = new Date(dateStr);
            
            // 如果月份不同，更新日历
            if (date.getMonth() !== this.currentDate.getMonth() || 
                date.getFullYear() !== this.currentDate.getFullYear()) {
                this.currentDate = new Date(date.getFullYear(), date.getMonth(), 1);
                this.renderCalendar();
                this.loadMonthStats();
            }
            
            // 选中日期
            this.selectDate(date.getDate());
        } else {
            // 如果没有日期参数，重置选中状态
            this.selectedDate = null;
            document.querySelectorAll('.calendar-day.selected').forEach(el => {
                el.classList.remove('selected');
            });
        }
    }

    // 处理目标卡片的完成状态
    handleGoalCompletion(goalId, isCompleted, stars) {
        try {
            console.log(`处理目标 ${goalId} 的完成状态: ${isCompleted}, 星星: ${stars}`);
            
            // 获取当前目标数据
            const goalsData = localStorage.getItem('goals');
            const completedGoalsData = localStorage.getItem('completedGoals');
            
            let goals = goalsData ? JSON.parse(goalsData) : [];
            let completedGoals = completedGoalsData ? JSON.parse(completedGoalsData) : [];
            
            // 查找目标
            const goalIndex = goals.findIndex(g => g.id === goalId);
            
            if (goalIndex === -1) {
                console.error(`未找到ID为${goalId}的目标`);
                return;
            }
            
            const goal = goals[goalIndex];
            const category = goal.category;
            
            // 如果完成状态没有变化，直接返回
            if (goal.completed === isCompleted) {
                console.log(`目标 ${goalId} 完成状态未变化`);
                return;
            }
            
            // 更新目标完成状态
            goal.completed = isCompleted;
            
            // 更新completedGoals数组
            if (isCompleted) {
                // 如果目标已完成，添加到completedGoals数组
                if (!completedGoals.some(cg => cg.goalId === goalId)) {
                    completedGoals.push({
                        goalId: goalId,
                        stars: stars || 0,
                        completedAt: new Date().toISOString()
                    });
                }
            } else {
                // 如果目标未完成，从completedGoals数组中移除
                completedGoals = completedGoals.filter(cg => cg.goalId !== goalId);
            }
            
            // 保存更新后的数据
            localStorage.setItem('goals', JSON.stringify(goals));
            localStorage.setItem('completedGoals', JSON.stringify(completedGoals));
            
            console.log(`目标 ${goalId} ${isCompleted ? '已完成' : '未完成'}, 获得 ${stars} 颗星星`);
            
            // 更新DOM中的目标卡片状态
            this.updateGoalCardStatus(goalId, isCompleted, stars);
            
            // 直接更新分类统计
            this.updateCategoryCount(category, isCompleted);
            
            // 重新计算总进度
            this.recalculateTotalProgress();
            
            // 更新目标进度条
            this.updateGoalProgress();
            
            // 更新月度统计数据
            this.loadMonthStats();
            
        } catch (error) {
            console.error('处理目标完成状态失败:', error);
        }
    }
    
    // 更新DOM中的目标卡片状态
    updateGoalCardStatus(goalId, isCompleted, stars) {
        try {
            // 查找目标卡片
            const goalCard = document.querySelector(`.goal-card[data-id="${goalId}"]`);
            if (!goalCard) {
                console.log(`未找到ID为${goalId}的目标卡片`);
                return;
            }
            
            // 更新完成状态
            if (isCompleted) {
                goalCard.classList.add('completed');
            } else {
                goalCard.classList.remove('completed');
            }
            
            // 更新星星显示
            const ratingPlaceholder = goalCard.querySelector('.rating-placeholder');
            const ratingStars = goalCard.querySelector('.rating-stars');
            const starValue = goalCard.querySelector('.star-value');
            
            if (isCompleted) {
                // 显示星星评分
                if (ratingPlaceholder) ratingPlaceholder.style.display = 'none';
                if (ratingStars) {
                    ratingStars.style.display = 'flex';
                    if (starValue) {
                        starValue.textContent = `+${stars}`;
                    }
                }
            } else {
                // 显示占位符
                if (ratingPlaceholder) ratingPlaceholder.style.display = 'flex';
                if (ratingStars) ratingStars.style.display = 'none';
            }
            
            console.log(`更新目标卡片 ${goalId} 的状态: ${isCompleted}, 星星: ${stars}`);
            
        } catch (error) {
            console.error('更新目标卡片状态失败:', error);
        }
    }
    
    // 更新分类计数
    updateCategoryCount(category, isCompleted) {
        try {
            const categoryElement = document.querySelector(`.category-title[data-category="${category}"]`);
            if (categoryElement) {
                // 从元素文本中提取完成数和总数
                const text = categoryElement.textContent.trim();
                const match = text.match(/(\d+)\/(\d+)/);
                
                if (match && match.length === 3) {
                    let completed = parseInt(match[1]);
                    const total = parseInt(match[2]);
                    
                    // 根据完成状态更新完成数
                    if (isCompleted) {
                        completed++;
                    } else {
                        completed = Math.max(0, completed - 1);
                    }
                    
                    // 更新分类标题文本
                    categoryElement.textContent = `${this.getCategoryName(category)} ${completed}/${total}`;
                    console.log(`直接更新${category}分类统计: ${completed}/${total}`);
                }
            }
        } catch (error) {
            console.error('更新分类计数失败:', error);
        }
    }
    
    // 从localStorage或API获取目标数据
    getGoalsData() {
        try {
            // 从localStorage获取目标数据
            const goalsData = localStorage.getItem('goals');
            const completedGoalsData = localStorage.getItem('completedGoals');
            
            // 如果没有数据，返回默认值
            if (!goalsData) {
                console.log('未找到目标数据，使用默认值');
                return this.getDefaultGoalsData();
            }
            
            // 解析目标数据
            const goals = JSON.parse(goalsData);
            const completedGoals = completedGoalsData ? JSON.parse(completedGoalsData) : [];
            
            // 按分类统计目标数量和完成情况
            const categories = {
                independent: { total: 0, completed: 0 },  // 独立
                labor: { total: 0, completed: 0 },        // 劳动
                study: { total: 0, completed: 0 },        // 学习
                life: { total: 0, completed: 0 },         // 生活
                criticism: { total: 0, completed: 0 },    // 批评
                praise: { total: 0, completed: 0 }        // 表扬
            };
            
            // 统计每个分类的目标总数
            goals.forEach(goal => {
                if (categories[goal.category]) {
                    categories[goal.category].total++;
                    
                    // 检查目标是否已完成
                    if (goal.completed) {
                        categories[goal.category].completed++;
                    }
                }
            });
            
            // 统计每个分类的已完成目标数（从completedGoals数组）
            if (completedGoals && completedGoals.length > 0) {
                completedGoals.forEach(completedGoal => {
                    const goal = goals.find(g => g.id === completedGoal.goalId);
                    if (goal && categories[goal.category] && !goal.completed) {
                        // 只有当目标本身没有标记为已完成时，才增加计数
                        // 这是为了避免重复计数
                        categories[goal.category].completed++;
                        
                        // 标记目标为已完成
                        goal.completed = true;
                    }
                });
            }
            
            // 直接从DOM获取分类统计数据（作为备用方案）
            this.updateCategoriesFromDOM(categories);
            
            console.log('获取到的目标数据:', { categories, completedGoals });
            
            return {
                categories: categories,
                completedGoals: completedGoals,
                goals: goals
            };
        } catch (error) {
            console.error('获取目标数据失败:', error);
            return this.getDefaultGoalsData();
        }
    }
    
    // 从DOM元素获取分类统计数据
    updateCategoriesFromDOM(categories) {
        try {
            // 获取所有分类标题元素
            const categoryElements = document.querySelectorAll('.category-title[data-category]');
            
            // 遍历每个分类标题元素
            categoryElements.forEach(element => {
                const category = element.dataset.category;
                if (category && categories[category]) {
                    // 从元素文本中提取完成数和总数
                    const text = element.textContent.trim();
                    const match = text.match(/(\d+)\/(\d+)/);
                    
                    if (match && match.length === 3) {
                        const completed = parseInt(match[1]);
                        const total = parseInt(match[2]);
                        
                        // 如果DOM中的数据与计算的数据不一致，使用DOM中的数据
                        if (!isNaN(completed) && !isNaN(total) && 
                            (categories[category].completed !== completed || 
                             categories[category].total !== total)) {
                            console.log(`从DOM更新${category}分类数据: ${completed}/${total}`);
                            categories[category].completed = completed;
                            categories[category].total = total;
                        }
                    }
                }
            });
        } catch (error) {
            console.error('从DOM更新分类数据失败:', error);
        }
    }
    
    // 获取默认的目标数据（用于测试或当没有实际数据时）
    getDefaultGoalsData() {
        return {
            categories: {
                independent: { total: 7, completed: 5 },  // 独立
                labor: { total: 4, completed: 4 },        // 劳动
                study: { total: 5, completed: 3 },        // 学习
                life: { total: 3, completed: 2 },         // 生活
                criticism: { total: 1, completed: 0 },    // 批评
                praise: { total: 2, completed: 1 }        // 表扬
            },
            completedGoals: [
                { goalId: 1, stars: 1 },
                { goalId: 2, stars: 2 },
                { goalId: 3, stars: 2 },
                { goalId: 4, stars: 3 },
                { goalId: 5, stars: 3 },
                { goalId: 6, stars: 2 },
                { goalId: 7, stars: 2 },
                { goalId: 8, stars: 3 }
            ]
        };
    }

    // 更新分类目标的统计数据
    updateCategoryStats() {
        try {
            // 获取所有分类容器
            const categoryContainers = document.querySelectorAll('.category-container');
            if (!categoryContainers || categoryContainers.length === 0) {
                console.log('未找到分类容器，使用数据计算分类统计');
                // 如果没有找到分类容器，使用数据计算
                const goalsData = this.getGoalsData();
                const categories = goalsData.categories;
                
                // 更新每个分类的统计数据
                Object.keys(categories).forEach(category => {
                    const categoryElement = document.querySelector(`.category-title[data-category="${category}"]`);
                    if (categoryElement) {
                        const { total, completed } = categories[category];
                        
                        // 更新分类标题文本
                        const newText = `${this.getCategoryName(category)} ${completed}/${total}`;
                        
                        // 只有当文本发生变化时才更新
                        if (categoryElement.textContent !== newText) {
                            categoryElement.textContent = newText;
                            console.log(`更新${category}分类统计: ${completed}/${total}`);
                        }
                    }
                });
                
                return;
            }
            
            console.log(`找到 ${categoryContainers.length} 个分类容器，开始计算分类统计`);
            
            // 遍历每个分类容器
            categoryContainers.forEach(container => {
                const categoryTitleElement = container.querySelector('.category-title');
                if (!categoryTitleElement || !categoryTitleElement.dataset.category) {
                    console.log('分类容器缺少分类标题或分类属性，跳过');
                    return;
                }
                
                const category = categoryTitleElement.dataset.category;
                
                // 获取该分类下的所有目标卡片
                const goalCards = container.querySelectorAll('.goal-card');
                const totalGoals = goalCards.length;
                const completedGoals = Array.from(goalCards).filter(card => card.classList.contains('completed')).length;
                
                // 更新分类标题文本
                const newText = `${this.getCategoryName(category)} ${completedGoals}/${totalGoals}`;
                
                // 只有当文本发生变化时才更新
                if (categoryTitleElement.textContent !== newText) {
                    categoryTitleElement.textContent = newText;
                    console.log(`从DOM更新${category}分类统计: ${completedGoals}/${totalGoals}`);
                }
            });
            
            // 重新计算总进度
            this.recalculateTotalProgress();
            
        } catch (error) {
            console.error('更新分类统计失败:', error);
        }
    }
    
    // 重新计算总进度
    recalculateTotalProgress() {
        try {
            // 获取所有分类标题元素
            const categoryElements = document.querySelectorAll('.category-title[data-category]');
            
            // 计算总目标数和已完成目标数
            let totalGoals = 0;
            let completedGoals = 0;
            
            // 记录每个分类的统计数据
            const categoryStats = {};
            
            // 遍历每个分类标题元素
            categoryElements.forEach(element => {
                const category = element.dataset.category;
                
                // 从元素文本中提取完成数和总数
                const text = element.textContent.trim();
                const match = text.match(/(\d+)\/(\d+)/);
                
                if (match && match.length === 3) {
                    const completed = parseInt(match[1]);
                    const total = parseInt(match[2]);
                    
                    if (!isNaN(completed) && !isNaN(total)) {
                        completedGoals += completed;
                        totalGoals += total;
                        
                        // 记录分类统计
                        categoryStats[category] = { completed, total };
                    }
                }
            });
            
            console.log('从DOM计算的分类统计:', categoryStats);
            
            // 更新进度文本
            const goalProgressElement = document.getElementById('goalProgress');
            if (goalProgressElement) {
                const oldText = goalProgressElement.textContent;
                const newText = `${completedGoals}/${totalGoals}`;
                
                if (oldText !== newText) {
                    goalProgressElement.textContent = newText;
                    console.log(`总进度更新: ${oldText} -> ${newText}`);
                }
            }
            
            // 更新进度条
            const progressBarElement = document.getElementById('goalProgressBar');
            if (progressBarElement) {
                const progressPercentage = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
                progressBarElement.style.width = `${progressPercentage}%`;
            }
            
            // 更新localStorage中的分类统计数据
            this.updateLocalStorageCategoryStats(categoryStats);
            
            return { completedGoals, totalGoals, categoryStats };
            
        } catch (error) {
            console.error('重新计算总进度失败:', error);
            return { completedGoals: 0, totalGoals: 0, categoryStats: {} };
        }
    }
    
    // 更新localStorage中的分类统计数据
    updateLocalStorageCategoryStats(categoryStats) {
        try {
            // 获取当前目标数据
            const goalsData = localStorage.getItem('goals');
            if (!goalsData) return;
            
            let goals = JSON.parse(goalsData);
            
            // 遍历每个分类
            Object.keys(categoryStats).forEach(category => {
                const { completed, total } = categoryStats[category];
                
                // 获取该分类的所有目标
                const categoryGoals = goals.filter(goal => goal.category === category);
                
                // 如果目标数量与总数不一致，可能需要添加或删除目标
                if (categoryGoals.length !== total) {
                    console.log(`分类 ${category} 的目标数量不一致: localStorage=${categoryGoals.length}, DOM=${total}`);
                    // 这里可以添加逻辑来同步目标数量，但需要谨慎处理
                }
                
                // 检查已完成目标数量是否一致
                const completedInStorage = categoryGoals.filter(goal => goal.completed).length;
                if (completedInStorage !== completed) {
                    console.log(`分类 ${category} 的已完成目标数量不一致: localStorage=${completedInStorage}, DOM=${completed}`);
                    // 这里可以添加逻辑来同步已完成目标数量，但需要谨慎处理
                }
            });
            
        } catch (error) {
            console.error('更新localStorage中的分类统计数据失败:', error);
        }
    }
    
    // 获取分类名称
    getCategoryName(category) {
        const categoryNames = {
            independent: '独立',
            labor: '劳动',
            study: '学习',
            life: '生活',
            criticism: '批评',
            praise: '表扬'
        };
        
        return categoryNames[category] || category;
    }

    // 处理目标的添加
    handleGoalAddition(goal) {
        try {
            // 获取当前目标数据
            const goalsData = localStorage.getItem('goals');
            let goals = goalsData ? JSON.parse(goalsData) : [];
            
            // 确保目标有唯一ID
            if (!goal.id) {
                goal.id = Date.now();
            }
            
            // 确保目标有完成状态字段
            goal.completed = goal.completed || false;
            
            // 添加新目标
            goals.push(goal);
            
            // 保存更新后的目标数据
            localStorage.setItem('goals', JSON.stringify(goals));
            
            console.log(`添加新目标: ${goal.title}, 分类: ${goal.category}, ID: ${goal.id}`);
            
            // 直接更新分类统计
            this.updateCategoryTotal(goal.category);
            
            // 重新计算总进度
            this.recalculateTotalProgress();
            
            // 更新目标进度条和分类统计
            this.updateGoalProgress();
            
        } catch (error) {
            console.error('处理目标添加失败:', error);
        }
    }
    
    // 更新分类总数
    updateCategoryTotal(category) {
        try {
            const categoryElement = document.querySelector(`.category-title[data-category="${category}"]`);
            if (categoryElement) {
                // 从元素文本中提取完成数和总数
                const text = categoryElement.textContent.trim();
                const match = text.match(/(\d+)\/(\d+)/);
                
                if (match && match.length === 3) {
                    const completed = parseInt(match[1]);
                    const total = parseInt(match[2]) + 1; // 增加总数
                    
                    // 更新分类标题文本
                    categoryElement.textContent = `${this.getCategoryName(category)} ${completed}/${total}`;
                    console.log(`直接更新${category}分类总数: ${completed}/${total}`);
                } else {
                    // 如果没有匹配到数字，创建新的分类标题
                    categoryElement.textContent = `${this.getCategoryName(category)} 0/1`;
                    console.log(`创建新的${category}分类统计: 0/1`);
                }
            }
        } catch (error) {
            console.error('更新分类总数失败:', error);
        }
    }

    // 绑定目标添加按钮事件
    bindGoalAdditionEvents() {
        // 获取所有添加目标按钮
        const addGoalButtons = document.querySelectorAll('.btn-add-goal');
        
        // 为每个按钮添加点击事件
        addGoalButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const category = button.dataset.category;
                if (category) {
                    // 这里应该打开添加目标的表单或模态框
                    // 在实际应用中，这里应该调用相应的UI组件
                    console.log(`打开添加${this.getCategoryName(category)}目标的表单`);
                    
                    // 模拟添加一个新目标
                    this.simulateAddGoal(category);
                }
            });
        });
    }
    
    // 模拟添加一个新目标（仅用于测试）
    simulateAddGoal(category) {
        // 生成一个新的目标ID
        const newId = Date.now();
        
        // 创建一个新目标对象
        const newGoal = {
            id: newId,
            title: `新的${this.getCategoryName(category)}目标`,
            category: category,
            description: '这是一个新添加的目标',
            points: 3
        };
        
        // 处理目标添加
        this.handleGoalAddition(newGoal);
    }

    // 初始化目标统计数据
    initializeGoalStats() {
        try {
            console.log('初始化目标统计数据...');
            
            // 首先从DOM中获取目标卡片的状态
            const hasUpdates = this.syncGoalCardsWithData();
            
            if (!hasUpdates) {
                console.log('没有目标卡片更新，尝试直接从DOM计算统计数据');
                
                // 直接从DOM计算分类统计
                const categoryStats = this.calculateCategoryStatsFromDOM();
                
                // 更新分类标题
                this.updateCategoryStatsFromData(categoryStats);
                
                // 更新总进度
                this.updateTotalProgressFromStats(categoryStats);
            }
            
            // 计算并更新总星星数
            this.calculateTotalStarsFromGoals();
            
            console.log('目标统计数据初始化完成');
            
        } catch (error) {
            console.error('初始化目标统计数据失败:', error);
        }
    }
    
    // 直接从DOM计算分类统计
    calculateCategoryStatsFromDOM() {
        try {
            // 获取所有分类容器
            const categoryContainers = document.querySelectorAll('.category-container');
            const categoryStats = {};
            
            if (!categoryContainers || categoryContainers.length === 0) {
                console.log('未找到分类容器，无法计算分类统计');
                return categoryStats;
            }
            
            console.log(`找到 ${categoryContainers.length} 个分类容器，开始计算分类统计`);
            
            // 遍历每个分类容器
            categoryContainers.forEach(container => {
                const categoryTitleElement = container.querySelector('.category-title');
                if (!categoryTitleElement || !categoryTitleElement.dataset.category) {
                    console.log('分类容器缺少分类标题或分类属性，跳过');
                    return;
                }
                
                const category = categoryTitleElement.dataset.category;
                
                // 获取该分类下的所有目标卡片
                const goalCards = container.querySelectorAll('.goal-card');
                const totalGoals = goalCards.length;
                const completedGoals = Array.from(goalCards).filter(card => card.classList.contains('completed')).length;
                
                // 记录分类统计
                categoryStats[category] = { total: totalGoals, completed: completedGoals };
                
                console.log(`从DOM计算${category}分类统计: ${completedGoals}/${totalGoals}`);
            });
            
            return categoryStats;
            
        } catch (error) {
            console.error('从DOM计算分类统计失败:', error);
            return {};
        }
    }
    
    // 从DOM中同步目标卡片状态到数据
    syncGoalCardsWithData() {
        try {
            // 获取所有目标卡片
            const goalCards = document.querySelectorAll('.goal-card');
            if (!goalCards || goalCards.length === 0) {
                console.log('未找到目标卡片，跳过同步');
                return false; // 返回false表示没有找到目标卡片
            }
            
            console.log(`找到 ${goalCards.length} 个目标卡片，开始同步状态`);
            
            // 获取当前目标数据
            const goalsData = localStorage.getItem('goals');
            const completedGoalsData = localStorage.getItem('completedGoals');
            
            let goals = goalsData ? JSON.parse(goalsData) : [];
            let completedGoals = completedGoalsData ? JSON.parse(completedGoalsData) : [];
            
            // 记录是否有更新
            let hasUpdates = false;
            
            // 记录每个分类的目标数量和完成情况
            const categoryStats = {};
            
            // 遍历所有目标卡片
            goalCards.forEach(card => {
                const goalId = parseInt(card.dataset.id);
                const isCompleted = card.classList.contains('completed');
                
                if (!goalId) {
                    console.log('目标卡片缺少ID，跳过');
                    return;
                }
                
                // 获取目标所属分类
                let category = 'independent'; // 默认分类
                const categoryContainer = card.closest('.category-container');
                if (categoryContainer) {
                    const categoryTitle = categoryContainer.querySelector('.category-title');
                    if (categoryTitle && categoryTitle.dataset.category) {
                        category = categoryTitle.dataset.category;
                    }
                }
                
                // 更新分类统计
                if (!categoryStats[category]) {
                    categoryStats[category] = { total: 0, completed: 0 };
                }
                categoryStats[category].total++;
                if (isCompleted) {
                    categoryStats[category].completed++;
                }
                
                // 查找目标在数据中的索引
                const goalIndex = goals.findIndex(g => g.id === goalId);
                
                // 如果目标不在数据中，添加它
                if (goalIndex === -1) {
                    // 获取目标信息
                    const titleElement = card.querySelector('.goal-title');
                    const descElement = card.querySelector('.goal-description');
                    
                    if (!titleElement) {
                        console.log(`目标卡片 ${goalId} 缺少标题元素，跳过`);
                        return;
                    }
                    
                    // 创建新目标对象
                    const newGoal = {
                        id: goalId,
                        title: titleElement.textContent.trim(),
                        description: descElement ? descElement.textContent.trim() : '',
                        category: category,
                        completed: isCompleted
                    };
                    
                    // 添加到目标数组
                    goals.push(newGoal);
                    console.log(`从DOM添加新目标: ${newGoal.title}, ID: ${goalId}, 完成状态: ${isCompleted}`);
                    hasUpdates = true;
                    
                    // 如果目标已完成，添加到completedGoals数组
                    if (isCompleted) {
                        // 获取星星数量
                        const starValueElement = card.querySelector('.star-value');
                        let stars = 0;
                        if (starValueElement) {
                            const starText = starValueElement.textContent.trim();
                            const starMatch = starText.match(/\+(\d+)/);
                            if (starMatch && starMatch.length > 1) {
                                stars = parseInt(starMatch[1]);
                            }
                        }
                        
                        // 添加到completedGoals数组
                        if (!completedGoals.some(cg => cg.goalId === goalId)) {
                            completedGoals.push({
                                goalId: goalId,
                                stars: stars,
                                completedAt: new Date().toISOString()
                            });
                            console.log(`从DOM添加已完成目标: ${goalId}, 星星: ${stars}`);
                            hasUpdates = true;
                        }
                    }
                } else {
                    // 如果目标在数据中，更新其完成状态和分类
                    const goal = goals[goalIndex];
                    let updated = false;
                    
                    // 更新完成状态
                    if (goal.completed !== isCompleted) {
                        goal.completed = isCompleted;
                        console.log(`更新目标 ${goalId} 的完成状态: ${isCompleted}`);
                        updated = true;
                    }
                    
                    // 更新分类（如果不一致）
                    if (goal.category !== category) {
                        console.log(`更新目标 ${goalId} 的分类: ${goal.category} -> ${category}`);
                        goal.category = category;
                        updated = true;
                    }
                    
                    if (updated) {
                        hasUpdates = true;
                        
                        // 更新completedGoals数组
                        if (isCompleted) {
                            // 获取星星数量
                            const starValueElement = card.querySelector('.star-value');
                            let stars = 0;
                            if (starValueElement) {
                                const starText = starValueElement.textContent.trim();
                                const starMatch = starText.match(/\+(\d+)/);
                                if (starMatch && starMatch.length > 1) {
                                    stars = parseInt(starMatch[1]);
                                }
                            }
                            
                            // 添加到completedGoals数组
                            if (!completedGoals.some(cg => cg.goalId === goalId)) {
                                completedGoals.push({
                                    goalId: goalId,
                                    stars: stars,
                                    completedAt: new Date().toISOString()
                                });
                                console.log(`添加已完成目标: ${goalId}, 星星: ${stars}`);
                            }
                        } else {
                            // 从completedGoals数组中移除
                            const initialLength = completedGoals.length;
                            completedGoals = completedGoals.filter(cg => cg.goalId !== goalId);
                            if (initialLength !== completedGoals.length) {
                                console.log(`从已完成目标中移除: ${goalId}`);
                            }
                        }
                    }
                }
            });
            
            // 如果有更新，保存数据
            if (hasUpdates) {
                localStorage.setItem('goals', JSON.stringify(goals));
                localStorage.setItem('completedGoals', JSON.stringify(completedGoals));
                console.log('目标数据已更新并保存到localStorage');
                
                // 直接更新分类统计
                this.updateCategoryStatsFromData(categoryStats);
                
                // 直接更新总进度
                this.updateTotalProgressFromStats(categoryStats);
            } else {
                console.log('目标数据无变化，跳过保存');
            }
            
            return hasUpdates; // 返回是否有更新
            
        } catch (error) {
            console.error('同步目标卡片状态失败:', error);
            return false;
        }
    }
    
    // 直接从计算的分类统计更新分类标题
    updateCategoryStatsFromData(categoryStats) {
        try {
            // 遍历每个分类
            Object.keys(categoryStats).forEach(category => {
                const { total, completed } = categoryStats[category];
                
                // 查找分类标题元素
                const categoryElement = document.querySelector(`.category-title[data-category="${category}"]`);
                if (categoryElement) {
                    // 更新分类标题文本
                    const newText = `${this.getCategoryName(category)} ${completed}/${total}`;
                    
                    // 只有当文本发生变化时才更新
                    if (categoryElement.textContent !== newText) {
                        categoryElement.textContent = newText;
                        console.log(`从同步数据更新${category}分类统计: ${completed}/${total}`);
                    }
                }
            });
        } catch (error) {
            console.error('从数据更新分类统计失败:', error);
        }
    }
    
    // 直接从分类统计更新总进度
    updateTotalProgressFromStats(categoryStats) {
        try {
            // 计算总目标数和已完成目标数
            let totalGoals = 0;
            let completedGoals = 0;
            
            // 遍历每个分类
            Object.keys(categoryStats).forEach(category => {
                const { total, completed } = categoryStats[category];
                totalGoals += total;
                completedGoals += completed;
            });
            
            // 更新进度文本
            const goalProgressElement = document.getElementById('goalProgress');
            if (goalProgressElement) {
                const oldText = goalProgressElement.textContent;
                const newText = `${completedGoals}/${totalGoals}`;
                
                if (oldText !== newText) {
                    goalProgressElement.textContent = newText;
                    console.log(`从同步数据更新总进度: ${oldText} -> ${newText}`);
                }
            }
            
            // 更新进度条
            const progressBarElement = document.getElementById('goalProgressBar');
            if (progressBarElement) {
                const progressPercentage = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
                progressBarElement.style.width = `${progressPercentage}%`;
            }
            
        } catch (error) {
            console.error('从分类统计更新总进度失败:', error);
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const calendarManager = new CalendarManager();
}); 