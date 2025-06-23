// 全局变量
let currentUser = null;
let tasks = [];
let starBalance = 0;

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化用户数据
    initUserData();
    
    // 加载任务列表
    loadTasks();
    
    // 加载星星币余额
    loadStarBalance();
    
    // 设置事件监听器
    setupEventListeners();
});

// 初始化用户数据
async function initUserData() {
    try {
        const response = await fetch('/api/user/current');
        if (response.ok) {
            currentUser = await response.json();
            updateUserInfo();
        }
    } catch (error) {
        console.error('获取用户数据失败:', error);
    }
}

// 加载任务列表
async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (response.ok) {
            tasks = await response.json();
            renderTasks();
        }
    } catch (error) {
        console.error('加载任务失败:', error);
    }
}

// 加载星星币余额
async function loadStarBalance() {
    try {
        const response = await fetch('/api/stars/balance');
        if (response.ok) {
            const data = await response.json();
            starBalance = data.balance;
            updateStarBalance();
        }
    } catch (error) {
        console.error('加载星星币余额失败:', error);
    }
}

// 渲染任务列表
function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    
    tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
}

// 创建任务元素
function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'list-group-item';
    div.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <div>
                <h5 class="mb-1">${task.title}</h5>
                <p class="mb-1">${task.description}</p>
                <small>奖励: ${task.reward} 星星币</small>
            </div>
            <div>
                <button class="btn btn-success btn-sm" onclick="completeTask(${task.id})">
                    完成
                </button>
            </div>
        </div>
    `;
    return div;
}

// 完成任务
async function completeTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}/complete`, {
            method: 'POST'
        });
        
        if (response.ok) {
            // 重新加载任务和余额
            await Promise.all([
                loadTasks(),
                loadStarBalance()
            ]);
            
            // 显示完成动画
            showSuccessMessage('任务完成！');
        }
    } catch (error) {
        console.error('完成任务失败:', error);
        showErrorMessage('完成任务失败，请重试');
    }
}

// 显示添加任务模态框
function showAddTaskModal() {
    const modal = new bootstrap.Modal(document.getElementById('addTaskModal'));
    modal.show();
}

// 添加新任务
async function addNewTask(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: formData.get('title'),
                description: formData.get('description'),
                reward: parseInt(formData.get('reward'))
            })
        });
        
        if (response.ok) {
            // 重新加载任务列表
            await loadTasks();
            
            // 关闭模态框
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTaskModal'));
            modal.hide();
            
            // 显示成功消息
            showSuccessMessage('任务添加成功！');
            
            // 重置表单
            form.reset();
        }
    } catch (error) {
        console.error('添加任务失败:', error);
        showErrorMessage('添加任务失败，请重试');
    }
}

// 更新星星币余额显示
function updateStarBalance() {
    const balanceElement = document.getElementById('starBalance');
    if (balanceElement) {
        balanceElement.textContent = starBalance;
    }
}

// 显示成功消息
function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// 显示错误消息
function showErrorMessage(message) {
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-danger';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 添加任务表单提交
    const addTaskForm = document.getElementById('addTaskForm');
    if (addTaskForm) {
        addTaskForm.addEventListener('submit', addNewTask);
    }
    
    // 导航切换
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
} 