class BabyManager {
    constructor() {
        this.currentDate = new Date(); // 添加当前日期属性
        this.init();
    }

    async init() {
        const searchParams = new URLSearchParams(window.location.search);
        const dateStr = searchParams.get('date');
        
        if (dateStr) {
            this.currentDate = new Date(dateStr);
        }
        
        await this.loadBabies();
        this.bindEvents();
        this.renderCalendar(this.currentDate);
        console.log('BabyManager 初始化完成');
    }

    async loadBabies() {
        try {
            console.log('开始加载宝贝列表...');
            const response = await fetch('/api/babies');
            
            if (!response.ok) {
                console.error('服务器返回错误状态码:', response.status);
                throw new Error(`服务器返回错误: ${response.status}`);
            }
            
            const babies = await response.json();
            console.log('成功加载宝贝列表:', babies);
            this.renderBabyList(babies);
        } catch (error) {
            console.error('加载宝贝列表失败:', error);
            this.showError();
        }
    }

    renderBabyList(babies) {
        const babyList = document.getElementById('babyList');
        
        if (!babyList) {
            console.error('找不到 babyList 元素');
            return;
        }
        
        if (babies.length === 0) {
            babyList.innerHTML = `
                <div class="no-babies">
                    <i class="fas fa-child"></i>
                    <p>还没有宝贝档案</p>
                    <p class="hint">点击下方按钮创建第一个宝贝档案</p>
                </div>
            `;
            return;
        }
        
        babyList.innerHTML = babies.map(baby => `
            <div class="baby-card">
                <div class="baby-card-header">
                    <div class="baby-info">
                        <div class="baby-avatar" data-id="${baby.id}">
                            ${baby.avatar 
                                ? `<img src="${baby.avatar}" alt="${baby.nickname}">`
                                : `<div class="avatar-placeholder"><i class="fas fa-user-circle"></i></div>`
                            }
                            <input type="file" class="avatar-upload" accept="image/*">
                        </div>
                        <div class="baby-details">
                            <div class="baby-name-row">
                                <span class="baby-name">${baby.nickname}</span>
                                <i class="fas ${baby.gender === 'male' ? 'fa-mars' : 'fa-venus'} gender-icon"></i>
                            </div>
                            <div class="baby-meta">
                                ${this.calculateAge(baby.birthDate)}
                            </div>
                        </div>
                    </div>
                    <div class="baby-stars">
                        <i class="fas fa-star"></i>
                        <span>${baby.stars || 0}</span>
                    </div>
                </div>
                <div class="baby-actions">
                    <a href="/pages/calendar.html?babyId=${baby.id}" class="btn-enter">
                        <i class="fas fa-calendar-alt"></i>
                        进入档案
                    </a>
                    <button class="btn-edit" data-id="${baby.id}">
                        <i class="fas fa-edit"></i>
                        编辑
                    </button>
                    <button class="btn-delete" data-id="${baby.id}">
                        <i class="fas fa-trash-alt"></i>
                        删除
                    </button>
                </div>
            </div>
        `).join('');
        
        // 绑定编辑和删除按钮事件
        this.bindBabyCardEvents();
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }

    showError() {
        const babyList = document.getElementById('babyList');
        babyList.innerHTML = `
            <div class="no-babies error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>加载失败</p>
                <button class="btn-retry" onclick="window.location.reload()">
                    <i class="fas fa-redo"></i>
                    点击重试
                </button>
            </div>
        `;
    }

    bindEvents() {
        console.log('绑定事件处理器');
        
        const createBabyBtn = document.getElementById('createBabyBtn');
        if (createBabyBtn) {
            createBabyBtn.addEventListener('click', () => {
                const modal = document.getElementById('createBabyModal');
                if (modal) modal.classList.add('active');
            });
        }
        
        const createCloseBtn = document.querySelector('#createBabyModal .btn-close');
        if (createCloseBtn) {
            createCloseBtn.addEventListener('click', () => {
                const modal = document.getElementById('createBabyModal');
                if (modal) modal.classList.remove('active');
            });
        }
        
        document.querySelector('#createBabyModal .btn-cancel').addEventListener('click', () => {
            document.getElementById('createBabyModal').classList.remove('active');
        });

        // 编辑弹窗相关事件
        const editCloseBtn = document.querySelector('#editBabyModal .btn-close');
        if (editCloseBtn) {
            editCloseBtn.addEventListener('click', () => {
                document.getElementById('editBabyModal').classList.remove('active');
            });
        }
        
        const editCancelBtn = document.querySelector('#editBabyModal .btn-cancel');
        if (editCancelBtn) {
            editCancelBtn.addEventListener('click', () => {
                document.getElementById('editBabyModal').classList.remove('active');
            });
        }
        
        const editSaveBtn = document.querySelector('#editBabyModal .btn-save');
        if (editSaveBtn) {
            editSaveBtn.addEventListener('click', async () => {
                await this.updateBaby();
            });
        }

        // 编辑弹窗中的星星数量调整
        const editDecreaseBtn = document.querySelector('#editBabyModal .btn-decrease');
        if (editDecreaseBtn) {
            editDecreaseBtn.addEventListener('click', () => {
                const input = document.getElementById('editStars');
                const value = parseInt(input.value) || 0;
                if (value > 0) input.value = value - 1;
            });
        }

        const editIncreaseBtn = document.querySelector('#editBabyModal .btn-increase');
        if (editIncreaseBtn) {
            editIncreaseBtn.addEventListener('click', () => {
                const input = document.getElementById('editStars');
                const value = parseInt(input.value) || 0;
                input.value = value + 1;
            });
        }

        // 星星数量调整
        document.querySelector('#createBabyModal .btn-decrease').addEventListener('click', () => {
            const input = document.getElementById('initialStars');
            const value = parseInt(input.value) || 0;
            if (value > 0) input.value = value - 1;
        });

        document.querySelector('#createBabyModal .btn-increase').addEventListener('click', () => {
            const input = document.getElementById('initialStars');
            const value = parseInt(input.value) || 0;
            input.value = value + 1;
        });

        // 性别选择处理
        document.querySelectorAll('.gender-option').forEach(option => {
            option.addEventListener('click', () => {
                // 移除所有选中状态
                document.querySelectorAll('.gender-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                // 添加选中状态
                option.classList.add('selected');
                // 选中单选框
                option.querySelector('input[type="radio"]').checked = true;
            });
        });

        // 提交表单
        document.querySelector('#createBabyModal .btn-submit').addEventListener('click', async () => {
            const formData = {
                nickname: document.getElementById('nickname').value.trim(),
                gender: document.querySelector('input[name="gender"]:checked').value,
                birthDate: document.getElementById('birthDate').value,
                stars: parseInt(document.getElementById('initialStars').value) || 0
            };
            
            if (!formData.nickname) {
                alert('请输入宝贝昵称');
                return;
            }
            
            if (!formData.birthDate) {
                alert('请选择出生日期');
                return;
            }
            
            await this.createBaby(formData);
        });

        // 进入档案
        document.getElementById('babyList').addEventListener('click', (e) => {
            const enterBtn = e.target.closest('.btn-enter');
            if (enterBtn) {
                const babyId = enterBtn.dataset.id;
                window.location.href = `/pages/dashboard.html?babyId=${babyId}`;
            }
        });

        // 头像上传处理
        document.getElementById('babyList').addEventListener('click', e => {
            const avatarDiv = e.target.closest('.baby-avatar');
            if (avatarDiv) {
                const fileInput = avatarDiv.querySelector('.avatar-upload');
                if (fileInput) {
                    fileInput.click();
                }
            }
        });

        // 文件选择处理
        document.getElementById('babyList').addEventListener('change', async e => {
            const fileInput = e.target;
            if (fileInput.classList.contains('avatar-upload')) {
                const file = fileInput.files[0];
                const babyId = fileInput.closest('.baby-avatar').dataset.id;
                
                if (file && babyId) {
                    console.log('选择文件:', {
                        name: file.name,
                        type: file.type,
                        size: file.size
                    });
                    
                    await this.uploadAvatar(babyId, file);
                    fileInput.value = ''; // 清空输入框
                }
            }
        });

        // 日历日期点击事件
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', () => {
                const date = day.dataset.date;
                if (date) {
                    window.location.href = `/pages/dashboard.html?date=${date}`;
                }
            });
        });
    }

    async uploadAvatar(babyId, file) {
        try {
            const formData = new FormData();
            formData.append('avatar', file);
            
            const response = await fetch(`/api/babies/${babyId}/avatar`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('上传头像失败');
            }
            
            // 重新加载宝贝列表以显示新头像
            await this.loadBabies();
        } catch (error) {
            console.error('上传头像失败:', error);
            alert('上传头像失败，请重试');
        }
    }

    renderCalendar(date = this.currentDate) {
        const calendar = document.getElementById('calendar');
        const year = date.getFullYear();
        const month = date.getMonth();
        
        // 获取月份的第一天和最后一天
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        
        // 生成日历HTML
        let calendarHTML = `
            <div class="calendar-header">
                <button class="btn-prev-month" onclick="babyManager.changeMonth(-1)">&lt;</button>
                <h3>${year}年${month + 1}月</h3>
                <button class="btn-next-month" onclick="babyManager.changeMonth(1)">&gt;</button>
            </div>
            <div class="calendar-grid">
                <div class="weekday">日</div>
                <div class="weekday">一</div>
                <div class="weekday">二</div>
                <div class="weekday">三</div>
                <div class="weekday">四</div>
                <div class="weekday">五</div>
                <div class="weekday">六</div>
        `;

        // 添加空白格子直到第一天
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }

        // 添加日期
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const currentDate = new Date(year, month, day);
            const dateStr = currentDate.toISOString().split('T')[0];
            const isToday = currentDate.toDateString() === new Date().toDateString();
            const isSelected = currentDate.toDateString() === this.currentDate.toDateString();
            
            calendarHTML += `
                <div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" 
                     data-date="${dateStr}" 
                     onclick="babyManager.selectDate('${dateStr}')">
                    <span class="day-number">${day}</span>
                    <div class="day-content">
                        <i class="fas fa-star"></i>
                        <span class="stars-count">-</span>
                    </div>
                </div>
            `;
        }

        calendarHTML += '</div>';
        calendar.innerHTML = calendarHTML;

        // 加载当前月份的数据
        this.loadMonthData(year, month);
    }

    // 添加月份切换方法
    changeMonth(delta) {
        this.currentDate = new Date(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth() + delta,
            this.currentDate.getDate()
        );
        this.renderCalendar(this.currentDate);
    }

    // 添加日期选择方法
    selectDate(dateStr) {
        this.currentDate = new Date(dateStr);
        this.renderCalendar(this.currentDate);
        
        // 更新 URL 并重新加载数据
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('date', dateStr);
        const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
        window.history.pushState({}, '', newUrl);
        
        // 如果在仪表板页面，重新加载数据
        if (window.location.pathname.includes('dashboard.html')) {
            this.loadDailyData(dateStr);
        }
    }

    // 加载月度数据
    async loadMonthData(year, month) {
        try {
            const startDate = new Date(year, month, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
            
            const response = await fetch(`/api/babies/stats?startDate=${startDate}&endDate=${endDate}`);
            const data = await response.json();
            
            // 更新日历上的星星数量
            data.forEach(stat => {
                const dayElement = document.querySelector(`.calendar-day[data-date="${stat.date}"]`);
                if (dayElement) {
                    const starsCount = dayElement.querySelector('.stars-count');
                    if (starsCount) {
                        starsCount.textContent = stat.stars || 0;
                    }
                }
            });
        } catch (error) {
            console.error('加载月度数据失败:', error);
        }
    }

    // 加载每日数据
    async loadDailyData(dateStr) {
        try {
            const response = await fetch(`/api/babies/daily?date=${dateStr}`);
            const data = await response.json();
            
            // 更新页面上的数据
            // 这里需要根据实际情况来更新页面上的数据
        } catch (error) {
            console.error('加载每日数据失败:', error);
        }
    }

    async createBaby(formData) {
        try {
            console.log('开始创建宝贝:', formData);
            const response = await fetch('/api/babies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            // 检查响应状态
            if (!response.ok) {
                const errorText = await response.text();
                console.error('创建宝贝失败, 服务器响应:', errorText);
                throw new Error(`创建失败: ${response.status} ${errorText}`);
            }

            // 尝试解析响应
            let data;
            try {
                data = await response.json();
                console.log('创建宝贝成功, 响应数据:', data);
            } catch (e) {
                console.log('响应不是JSON格式，可能是成功但没有返回数据');
            }

            // 关闭弹窗
            document.getElementById('createBabyModal').classList.remove('active');
            
            // 清空表单
            document.getElementById('nickname').value = '';
            document.getElementById('birthDate').value = '';
            document.getElementById('initialStars').value = '0';
            
            // 重新加载宝贝列表
            await this.loadBabies();
            
            // 显示成功消息
            alert('宝贝档案创建成功！');
        } catch (error) {
            console.error('创建宝贝失败:', error);
            alert(`创建失败，请重试: ${error.message}`);
        }
    }

    // 添加 calculateAge 方法
    calculateAge(birthDate) {
        if (!birthDate) return '年龄未知';
        
        const birth = new Date(birthDate);
        const now = new Date();
        
        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();
        
        if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
            years--;
            months += 12;
        }
        
        if (years < 1) {
            return `${months}个月`;
        } else if (months === 0) {
            return `${years}岁`;
        } else {
            return `${years}岁${months}个月`;
        }
    }

    // 添加绑定宝贝卡片事件的方法
    bindBabyCardEvents() {
        // 绑定编辑按钮事件
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // 阻止默认行为
                e.stopPropagation(); // 阻止事件冒泡
                const babyId = e.currentTarget.dataset.id;
                this.editBaby(babyId);
            });
        });
        
        // 绑定删除按钮事件
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // 阻止默认行为
                e.stopPropagation(); // 阻止事件冒泡
                const babyId = e.currentTarget.dataset.id;
                this.confirmDeleteBaby(babyId);
            });
        });
        
        // 绑定进入档案按钮事件
        document.querySelectorAll('.btn-enter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 不需要阻止默认行为，因为我们希望链接正常工作
                e.stopPropagation(); // 但阻止事件冒泡
            });
        });
        
        // 绑定头像上传事件
        document.querySelectorAll('.baby-avatar').forEach(avatar => {
            avatar.addEventListener('click', (e) => {
                e.preventDefault(); // 阻止默认行为
                e.stopPropagation(); // 阻止事件冒泡
                
                // 只有当点击的是头像区域而不是上传输入框时才触发
                if (e.target.classList.contains('avatar-upload')) {
                    return;
                }
                
                const fileInput = avatar.querySelector('.avatar-upload');
                if (fileInput) {
                    fileInput.click();
                }
            });
        });
        
        // 绑定头像文件选择事件
        document.querySelectorAll('.avatar-upload').forEach(input => {
            input.addEventListener('change', async (e) => {
                e.preventDefault(); // 阻止默认行为
                e.stopPropagation(); // 阻止事件冒泡
                
                const file = e.target.files[0];
                if (!file) return;
                
                const babyId = e.target.closest('.baby-avatar').dataset.id;
                await this.uploadAvatar(babyId, file);
            });
            
            // 阻止点击事件冒泡
            input.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }

    // 添加编辑宝贝方法
    async editBaby(babyId) {
        try {
            // 获取宝贝信息
            const response = await fetch(`/api/babies/${babyId}`);
            if (!response.ok) {
                throw new Error('获取宝贝信息失败');
            }
            
            const baby = await response.json();
            
            // 填充编辑表单
            document.getElementById('editNickname').value = baby.nickname;
            document.getElementById('editBirthDate').value = baby.birthDate;
            document.getElementById('editStars').value = baby.stars || 0;
            
            // 选择性别
            const genderRadios = document.querySelectorAll('input[name="editGender"]');
            genderRadios.forEach(radio => {
                if (radio.value === baby.gender) {
                    radio.checked = true;
                }
            });
            
            // 存储当前编辑的宝贝ID
            document.getElementById('editBabyForm').dataset.babyId = babyId;
            
            // 显示编辑弹窗
            document.getElementById('editBabyModal').classList.add('active');
        } catch (error) {
            console.error('编辑宝贝失败:', error);
            alert('获取宝贝信息失败，请重试');
        }
    }

    // 添加确认删除方法
    confirmDeleteBaby(babyId) {
        // 创建确认对话框
        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'confirm-dialog';
        confirmDialog.innerHTML = `
            <div class="confirm-content">
                <h3>确认删除</h3>
                <p>确定要删除这个宝贝档案吗？此操作不可恢复。</p>
                <div class="confirm-actions">
                    <button class="btn-cancel">取消</button>
                    <button class="btn-confirm">确认删除</button>
                </div>
            </div>
        `;
        
        // 添加到页面
        document.body.appendChild(confirmDialog);
        
        // 绑定事件
        confirmDialog.querySelector('.btn-cancel').addEventListener('click', () => {
            document.body.removeChild(confirmDialog);
        });
        
        confirmDialog.querySelector('.btn-confirm').addEventListener('click', async () => {
            try {
                document.body.removeChild(confirmDialog);
                await this.deleteBaby(babyId);
            } catch (error) {
                console.error('删除失败:', error);
            }
        });
        
        // 显示对话框
        setTimeout(() => {
            confirmDialog.classList.add('active');
        }, 10);
    }

    // 添加删除宝贝方法
    async deleteBaby(babyId) {
        try {
            const response = await fetch(`/api/babies/${babyId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('删除失败');
            }
            
            // 重新加载宝贝列表
            await this.loadBabies();
            
            // 显示成功消息
            alert('宝贝档案已删除');
        } catch (error) {
            console.error('删除宝贝失败:', error);
            alert('删除失败，请重试');
        }
    }

    // 添加更新宝贝方法
    async updateBaby() {
        try {
            const babyId = document.getElementById('editBabyForm').dataset.babyId;
            if (!babyId) {
                throw new Error('未找到宝贝ID');
            }
            
            // 获取表单数据
            const formData = {
                nickname: document.getElementById('editNickname').value.trim(),
                gender: document.querySelector('input[name="editGender"]:checked')?.value,
                birthDate: document.getElementById('editBirthDate').value,
                stars: parseInt(document.getElementById('editStars').value) || 0
            };
            
            // 验证数据
            if (!formData.nickname) {
                alert('请输入宝贝昵称');
                return;
            }
            
            if (!formData.gender) {
                alert('请选择宝贝性别');
                return;
            }
            
            if (!formData.birthDate) {
                alert('请选择出生日期');
                return;
            }
            
            // 发送请求
            const response = await fetch(`/api/babies/${babyId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error('更新失败');
            }
            
            // 关闭弹窗
            document.getElementById('editBabyModal').classList.remove('active');
            
            // 重新加载宝贝列表
            await this.loadBabies();
            
            // 显示成功消息
            alert('宝贝档案更新成功！');
        } catch (error) {
            console.error('更新宝贝失败:', error);
            alert(`更新失败，请重试: ${error.message}`);
        }
    }
}

// 初始化
const babyManager = new BabyManager(); 