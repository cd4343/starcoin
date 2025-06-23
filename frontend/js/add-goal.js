class AddGoalManager {
    constructor() {
        this.goals = [];
        this.selectedCategory = 'independent';
        this.selectedIconId = null;
        this.uploadedImage = null;
        this.init();
    }

    async init() {
        try {
            // 加载目标数据
            await this.loadGoals();
            
            // 绑定事件
            this.bindEvents();
            
            // 加载图标选项
            this.loadIconOptions();
            
            console.log('添加目标页面初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
        }
    }

    async loadGoals() {
        try {
            // 尝试从localStorage获取自定义目标
            const customGoals = JSON.parse(localStorage.getItem('customGoals') || '[]');
            
            // 这里应该调用 API 获取目标模板
            // 模拟数据
            const defaultGoals = [
                { id: 1, title: '自己穿衣服', category: 'independent', icon: '../images/goals/dress.png', iconClass: 'goal-icon-dress' },
                { id: 2, title: '自己洗漱', category: 'independent', icon: '../images/goals/wash-face.png', iconClass: 'goal-icon-wash-face' },
                { id: 3, title: '早晚刷牙', category: 'independent', icon: '../images/goals/brush-teeth.png', iconClass: 'goal-icon-brush-teeth' },
                { id: 4, title: '自己上学', category: 'independent', icon: '../images/goals/go-school.png', iconClass: 'goal-icon-go-school' },
                { id: 5, title: '自己放学回家', category: 'independent', icon: '../images/goals/back-home.png', iconClass: 'goal-icon-back-home' },
                { id: 6, title: '自己洗饭盒', category: 'labor', icon: '../images/goals/wash-lunchbox.png', iconClass: 'goal-icon-wash-lunchbox' },
                { id: 7, title: '自己洗澡', category: 'independent', icon: '../images/goals/bath.png', iconClass: 'goal-icon-bath' },
                { id: 8, title: '自己上厕所', category: 'independent', icon: '../images/goals/toilet.png', iconClass: 'goal-icon-toilet' },
                { id: 9, title: '自己系鞋带', category: 'independent', icon: '../images/goals/shoelace.png', iconClass: 'goal-icon-shoelace' },
                { id: 10, title: '擦桌子', category: 'labor', icon: '../images/goals/clean-table.png', iconClass: 'goal-icon-clean-table' },
                { id: 11, title: '自己擦屁股', category: 'independent', icon: '../images/goals/wipe.png', iconClass: 'goal-icon-wipe' },
                { id: 12, title: '每天自己洗脚', category: 'independent', icon: '../images/goals/wash-feet.png', iconClass: 'goal-icon-wash-feet' },
                { id: 13, title: '自己吃药', category: 'independent', icon: '../images/goals/medicine.png', iconClass: 'goal-icon-medicine' },
                { id: 14, title: '自己穿袜袜', category: 'independent', icon: '../images/goals/socks.png', iconClass: 'goal-icon-socks' },
                { id: 15, title: '讲究个人卫生', category: 'life', icon: '../images/goals/hygiene.png', iconClass: 'goal-icon-hygiene' },
                { id: 16, title: '洗鼻子', category: 'independent', icon: '../images/goals/nose.png', iconClass: 'goal-icon-nose' },
                { id: 17, title: '贴睡巴', category: 'independent', icon: '../images/goals/sleep.png', iconClass: 'goal-icon-sleep' }
            ];
            
            // 检查是否有默认目标的自定义覆盖版本
            const overrideGoals = customGoals.filter(g => g.id.toString().startsWith('custom-override-'));
            
            // 应用覆盖
            for (const override of overrideGoals) {
                const originalId = override.originalId;
                const defaultIndex = defaultGoals.findIndex(g => g.id.toString() === originalId.toString());
                if (defaultIndex >= 0) {
                    // 使用自定义版本替换默认版本，但保留原始ID
                    const customVersion = {...override};
                    customVersion.id = originalId;
                    defaultGoals[defaultIndex] = customVersion;
                }
            }
            
            // 合并默认目标和自定义目标
            this.goals = [...defaultGoals, ...customGoals.filter(g => !g.id.toString().startsWith('custom-override-'))];
            
            // 更新目标计数
            document.getElementById('goalCount').textContent = this.goals.length;
            
            // 渲染目标
            this.renderGoals();
        } catch (error) {
            console.error('加载目标失败:', error);
        }
    }

    renderGoals() {
        const goalsGrid = document.getElementById('goalsGrid');
        const activeCategory = document.querySelector('.category-tab.active').dataset.category;
        const searchQuery = document.getElementById('goalSearchInput').value.toLowerCase();
        
        // 清空目标网格
        goalsGrid.innerHTML = '';
        
        // 过滤目标
        const filteredGoals = this.goals.filter(goal => {
            // 如果有搜索查询，按标题过滤
            if (searchQuery && !goal.title.toLowerCase().includes(searchQuery)) {
                return false;
            }
            
            // 按分类过滤
            return activeCategory === 'all' || goal.category === activeCategory;
        });
        
        // 渲染过滤后的目标
        filteredGoals.forEach(goal => {
            const goalCard = document.createElement('div');
            goalCard.className = 'goal-card';
            goalCard.dataset.id = goal.id;
            
            // 创建图标容器
            const goalIcon = document.createElement('div');
            goalIcon.className = 'goal-icon';
            
            // 如果有iconClass，使用背景图片显示图标
            if (goal.iconClass) {
                goalIcon.classList.add(goal.iconClass);
                goalCard.innerHTML = `
                    <div class="goal-icon ${goal.iconClass}"></div>
                    <div class="goal-title">${goal.title}</div>
                `;
            } else {
                // 否则使用img元素显示图标
                goalCard.innerHTML = `
                    <div class="goal-icon">
                        <img src="${goal.icon}" alt="${goal.title}" onerror="this.src='../images/goals/default.png'">
                    </div>
                    <div class="goal-title">${goal.title}</div>
                `;
            }
            
            // 绑定点击事件
            goalCard.addEventListener('click', () => {
                window.location.href = `goal-detail.html?id=${goal.id}`;
            });
            
            goalsGrid.appendChild(goalCard);
        });
    }

    selectGoal(goal) {
        // 跳转到目标详情页面
        window.location.href = `/pages/goal-detail.html?id=${goal.id}`;
    }

    bindEvents() {
        // 绑定分类标签点击事件
        const categoryTabs = document.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                this.selectedCategory = tab.dataset.category;
                this.renderGoals();
            });
        });
        
        // 绑定搜索输入事件
        document.getElementById('goalSearchInput').addEventListener('input', (e) => {
            this.searchGoals(e.target.value);
        });
        
        // 绑定自定义目标按钮点击事件
        document.getElementById('addCustomGoalBtn').addEventListener('click', () => {
            document.getElementById('customGoalModal').style.display = 'flex';
        });
        
        // 绑定关闭自定义目标弹窗事件
        document.getElementById('closeCustomGoalModal').addEventListener('click', () => {
            document.getElementById('customGoalModal').style.display = 'none';
        });
        
        // 绑定取消自定义目标按钮点击事件
        document.getElementById('cancelCustomGoalBtn').addEventListener('click', () => {
            document.getElementById('customGoalModal').style.display = 'none';
        });
        
        // 绑定保存自定义目标按钮点击事件
        document.getElementById('saveCustomGoalBtn').addEventListener('click', () => {
            this.saveCustomGoal();
        });
        
        // 绑定增加/减少星星数量按钮点击事件
        document.getElementById('decreasePoints').addEventListener('click', () => {
            const pointsInput = document.getElementById('customGoalPoints');
            let value = parseInt(pointsInput.value);
            if (value > 1) {
                pointsInput.value = value - 1;
            }
        });
        
        document.getElementById('increasePoints').addEventListener('click', () => {
            const pointsInput = document.getElementById('customGoalPoints');
            let value = parseInt(pointsInput.value);
            if (value < 10) {
                pointsInput.value = value + 1;
            }
        });
    }

    loadIconOptions() {
        const iconSelector = document.getElementById('iconSelector');
        
        // 默认图标列表
        const defaultIcons = [
            { id: 'dress', src: '../images/goals/dress.png' },
            { id: 'wash-face', src: '../images/goals/wash-face.png' },
            { id: 'brush-teeth', src: '../images/goals/brush-teeth.png' },
            { id: 'go-school', src: '../images/goals/go-school.png' },
            { id: 'back-home', src: '../images/goals/back-home.png' },
            { id: 'wash-lunchbox', src: '../images/goals/wash-lunchbox.png' },
            { id: 'bath', src: '../images/goals/bath.png' },
            { id: 'toilet', src: '../images/goals/toilet.png' }
        ];
        
        // 渲染图标选项
        defaultIcons.forEach(icon => {
            const iconOption = document.createElement('div');
            iconOption.className = 'icon-option';
            iconOption.dataset.id = icon.id;
            
            iconOption.innerHTML = `<img src="${icon.src}" alt="${icon.id}">`;
            
            iconOption.addEventListener('click', () => {
                document.querySelectorAll('.icon-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                iconOption.classList.add('selected');
                this.selectedIconId = icon.id;
                this.selectedIconSrc = icon.src;
            });
            
            iconSelector.appendChild(iconOption);
        });
        
        // 添加上传自定义图标选项
        const uploadOption = document.createElement('div');
        uploadOption.className = 'icon-option upload-icon-option';
        uploadOption.innerHTML = `
            <div class="upload-icon">
                <i class="fas fa-plus"></i>
                <span>上传</span>
            </div>
        `;
        
        uploadOption.addEventListener('click', () => {
            document.getElementById('iconUploadInput').click();
        });
        
        iconSelector.appendChild(uploadOption);
        
        // 处理图标上传
        document.getElementById('iconUploadInput').addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    // 创建新的图标选项
                    const newIconOption = document.createElement('div');
                    newIconOption.className = 'icon-option';
                    newIconOption.dataset.id = 'custom-' + Date.now();
                    
                    newIconOption.innerHTML = `<img src="${event.target.result}" alt="自定义图标">`;
                    
                    // 选中新上传的图标
                    document.querySelectorAll('.icon-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    newIconOption.classList.add('selected');
                    
                    this.selectedIconId = newIconOption.dataset.id;
                    this.selectedIconSrc = event.target.result;
                    this.uploadedImage = event.target.result;
                    
                    // 将新图标添加到选择器中
                    iconSelector.insertBefore(newIconOption, uploadOption);
                    
                    // 绑定点击事件
                    newIconOption.addEventListener('click', () => {
                        document.querySelectorAll('.icon-option').forEach(opt => {
                            opt.classList.remove('selected');
                        });
                        newIconOption.classList.add('selected');
                        this.selectedIconId = newIconOption.dataset.id;
                        this.selectedIconSrc = event.target.result;
                    });
                };
                
                reader.readAsDataURL(file);
            }
        });
    }

    saveCustomGoal() {
        const title = document.getElementById('customGoalTitle').value;
        const category = document.getElementById('customGoalCategory').value;
        const points = document.getElementById('customGoalPoints').value;
        const description = document.getElementById('customGoalDescription') ? document.getElementById('customGoalDescription').value : '';
        
        if (!title) {
            alert('请输入目标名称');
            return;
        }
        
        if (!this.selectedIconId && !this.uploadedImage) {
            alert('请选择一个图标');
            return;
        }
        
        // 创建自定义目标对象
        const customGoal = {
            id: 'custom-' + Date.now(),
            title,
            category,
            points: parseInt(points),
            icon: this.uploadedImage || this.selectedIconSrc,
            description: description,
            iconClass: this.selectedIconId ? `goal-icon-${this.selectedIconId}` : null
        };
        
        console.log('保存自定义目标:', customGoal);
        
        // 保存到localStorage
        const customGoals = JSON.parse(localStorage.getItem('customGoals') || '[]');
        
        // 将新目标添加到数组的开头，使其显示在该类别的第一位
        customGoals.unshift(customGoal);
        localStorage.setItem('customGoals', JSON.stringify(customGoals));
        
        // 显示成功提示
        alert(`已添加自定义目标: ${title}`);
        
        // 跳转到星目标页面
        window.location.href = '/pages/dashboard.html';
    }

    searchGoals(keyword) {
        if (!keyword) {
            this.renderGoals();
            return;
        }
        
        const lowerKeyword = keyword.toLowerCase();
        const goalsGrid = document.getElementById('goalsGrid');
        goalsGrid.innerHTML = '';
        
        // 过滤匹配关键字的目标
        const filteredGoals = this.goals.filter(goal => 
            goal.title.toLowerCase().includes(lowerKeyword) && 
            (this.selectedCategory === 'all' || goal.category === this.selectedCategory)
        );
        
        // 渲染过滤后的目标
        filteredGoals.forEach(goal => {
            const goalCard = document.createElement('div');
            goalCard.className = 'goal-card';
            goalCard.dataset.id = goal.id;
            
            goalCard.innerHTML = `
                <div class="goal-icon">
                    <img src="${goal.icon}" alt="${goal.title}">
                </div>
                <div class="goal-title">${goal.title}</div>
            `;
            
            goalCard.addEventListener('click', () => {
                this.selectGoal(goal);
            });
            
            goalsGrid.appendChild(goalCard);
        });
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const addGoalManager = new AddGoalManager();
}); 