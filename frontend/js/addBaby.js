class BabyCreator {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('addBabyForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                nickname: document.getElementById('nickname').value,
                gender: document.querySelector('input[name="gender"]:checked').value,
                birthDate: document.getElementById('birthDate').value,
                createdAt: new Date().toISOString()
            };

            try {
                const response = await fetch('/api/babies', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert('宝贝档案创建成功！');
                    window.location.href = '/';
                } else {
                    throw new Error('创建失败');
                }
            } catch (error) {
                console.error('创建宝贝档案失败:', error);
                alert('创建失败，请重试');
            }
        });
    }
}

// 初始化
const babyCreator = new BabyCreator(); 