class TaskCreator {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeForm();
    }

    initializeForm() {
        // 从URL获取日期参数
        const params = new URLSearchParams(window.location.search);
        const date = params.get('date');
        if (date) {
            const weekday = new Date(date).getDay();
            // 自动选中对应的星期几
            document.querySelector(`.weekday-selector input[value="${weekday}"]`).checked = true;
        }
    }

    bindEvents() {
        // 星星数量加减
        document.querySelector('.btn-decrease').addEventListener('click', () => {
            const input = document.getElementById('taskPoints');
            const value = parseInt(input.value) || 0;
            if (value > 1) input.value = value - 1;
        });

        document.querySelector('.btn-increase').addEventListener('click', () => {
            const input = document.getElementById('taskPoints');
            const value = parseInt(input.value) || 0;
            if (value < 100) input.value = value + 1;
        });

        // 表单提交
        document.getElementById('taskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('taskName').value,
                category: document.getElementById('taskCategory').value,
                points: parseInt(document.getElementById('taskPoints').value),
                description: document.getElementById('taskDescription').value,
                weekdays: Array.from(document.querySelectorAll('.weekday-selector input:checked'))
                    .map(input => parseInt(input.value))
            };

            try {
                const response = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert('目标创建成功！');
                    history.back();
                } else {
                    alert('创建失败，请重试');
                }
            } catch (error) {
                console.error('创建任务失败:', error);
                alert('网络错误，请重试');
            }
        });
    }
}

// 初始化
const taskCreator = new TaskCreator(); 