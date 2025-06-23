class StarWheelManager {
    constructor() {
        this.prizes = []; // 将从API获取奖品数据
        this.isSpinning = false;
        this.spinCost = 10; // 每次抽奖消耗的星星数
        this.totalStars = 0;
        this.wonPrizes = [];
        
        this.init();
    }
    
    async init() {
        try {
            // 加载星星数量
            this.loadStars();
            
            // 加载已获得的奖品
            this.loadWonPrizes();
            
            // 获取奖品数据
            await this.loadPrizes();
            
            // 创建转盘
            this.createWheel();
            
            // 绑定事件
            this.bindEvents();
            
            console.log('星愿池初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
        }
    }

    async loadPrizes() {
        try {
            console.log('开始加载奖品列表...');
            
            // 检查是否使用本地模式
            const useLocalMode = true; // 暂时使用本地模式
            
            if (!useLocalMode) {
                // 调用API获取奖品列表
                const apiUrl = window.location.origin + '/api/draw_prize.php?action=list';
                console.log('请求URL:', apiUrl);
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const text = await response.text();
                console.log('API响应:', text);
                
                let data;
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    console.error('解析JSON失败:', e);
                    console.error('收到的响应:', text);
                    throw new Error('服务器返回的数据格式不正确');
                }
                
                if (data.code === 200 && Array.isArray(data.data)) {
                    console.log('获取到奖品列表:', data.data);
                    this.prizes = data.data.map(prize => ({
                        id: prize.id,
                        name: prize.name,
                        description: prize.description,
                        icon: this.getPrizeIcon(prize.prize_type),
                        color: this.getPrizeColor(prize.prize_type),
                        prize_type: prize.prize_type,
                        points_cost: prize.points_cost
                    }));
                } else {
                    throw new Error(data.message || '获取奖品列表失败');
                }
            } else {
                // 使用本地测试数据
                console.log('使用本地测试数据');
                this.prizes = [
                    { 
                        id: 1, 
                        name: '玩具', 
                        icon: 'gift', 
                        color: '#FF6B6B', 
                        prize_type: 1, 
                        description: '精美玩具',
                        probability: 0.15
                    },
                    { 
                        id: 2, 
                        name: '故事书', 
                        icon: 'book', 
                        color: '#4ECDC4', 
                        prize_type: 2, 
                        description: '精彩故事书',
                        probability: 0.15
                    },
                    { 
                        id: 3, 
                        name: '星星', 
                        icon: 'star', 
                        color: '#FFD166', 
                        prize_type: 3, 
                        description: '获得5颗星星', 
                        points_cost: 5,
                        probability: 0.2
                    },
                    { 
                        id: 4, 
                        name: '画笔', 
                        icon: 'paint-brush', 
                        color: '#6A0572', 
                        prize_type: 1, 
                        description: '彩色画笔',
                        probability: 0.15
                    },
                    { 
                        id: 5, 
                        name: '积木', 
                        icon: 'cubes', 
                        color: '#F8961E', 
                        prize_type: 1, 
                        description: '创意积木',
                        probability: 0.15
                    },
                    { 
                        id: 6, 
                        name: '谢谢参与', 
                        icon: 'smile', 
                        color: '#577590', 
                        prize_type: 1, 
                        description: '谢谢参与，下次再来',
                        probability: 0.2
                    }
                ];
            }
            
            console.log('处理后的奖品列表:', this.prizes);
            return true;
        } catch (error) {
            console.error('获取奖品列表出错:', error);
            return false;
        }
    }
    
    getPrizeIcon(prizeType) {
        const icons = {
            1: 'gift', // 实物
            2: 'cloud', // 虚拟物品
            3: 'star', // 积分
        };
        return icons[prizeType] || 'gift';
    }
    
    getPrizeColor(prizeType) {
        const colors = {
            1: '#FF6B6B', // 实物
            2: '#4ECDC4', // 虚拟物品
            3: '#FFD166', // 积分
        };
        return colors[prizeType] || '#577590';
    }
    
    loadStars() {
        // 从localStorage获取星星数量
        const totalStarsElement = document.getElementById('totalStars');
        
        // 尝试从localStorage获取星星数量
        const stars = localStorage.getItem('totalStars');
        this.totalStars = stars ? parseInt(stars) : 100;
        
        // 更新UI
        if (totalStarsElement) {
            totalStarsElement.textContent = this.totalStars;
        }
    }
    
    loadWonPrizes() {
        // 从localStorage获取已获得的奖品
        const wonPrizes = localStorage.getItem('wonPrizes');
        this.wonPrizes = wonPrizes ? JSON.parse(wonPrizes) : [];
        
        // 更新UI
        this.renderPrizeHistory();
    }
    
    createWheel() {
        const wheel = document.getElementById('wheel');
        if (!wheel || this.prizes.length === 0) return;
        
        // 清空转盘
        wheel.innerHTML = '';
        
        // 计算每个奖品的角度
        const totalPrizes = this.prizes.length;
        const anglePerPrize = 360 / totalPrizes;
        
        // 创建转盘项
        this.prizes.forEach((prize, index) => {
            const angle = anglePerPrize * index;
            
            const wheelItem = document.createElement('div');
            wheelItem.className = 'wheel-item';
            wheelItem.style.transform = `rotate(${angle}deg)`;
            wheelItem.style.backgroundColor = prize.color;
            
            const content = document.createElement('div');
            content.className = 'wheel-item-content';
            content.innerHTML = `
                <i class="fas fa-${prize.icon}"></i>
                <div>${prize.name}</div>
            `;
            
            wheelItem.appendChild(content);
            wheel.appendChild(wheelItem);
        });
    }
    
    bindEvents() {
        // 绑定抽奖按钮点击事件
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.addEventListener('click', () => {
                this.spin();
            });
        }
        
        // 绑定关闭中奖弹窗事件
        const closePrizeModal = document.getElementById('closePrizeModal');
        if (closePrizeModal) {
            closePrizeModal.addEventListener('click', () => {
                document.getElementById('prizeModal').classList.remove('active');
            });
        }
        
        // 绑定领取奖励按钮点击事件
        const claimPrize = document.getElementById('claimPrize');
        if (claimPrize) {
            claimPrize.addEventListener('click', () => {
                document.getElementById('prizeModal').classList.remove('active');
            });
        }
    }
    
    async spin() {
        // 如果正在旋转，则不响应点击
        if (this.isSpinning) return;
        
        // 检查星星是否足够
        if (this.totalStars < this.spinCost) {
            alert('星星不足，无法抽奖');
            return;
        }
        
        // 设置旋转状态
        this.isSpinning = true;
        const spinButton = document.getElementById('spinButton');
        if (spinButton) {
            spinButton.disabled = true;
        }

        try {
            let result;
            const useLocalMode = true; // 暂时使用本地模式
            
            if (!useLocalMode) {
                // 调用抽奖API
                const apiUrl = window.location.origin + '/api/draw_prize.php';
                console.log('抽奖请求URL:', apiUrl);
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        stars: this.spinCost
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const text = await response.text();
                console.log('抽奖API响应:', text);

                try {
                    result = JSON.parse(text);
                } catch (e) {
                    console.error('解析抽奖结果失败:', e);
                    throw new Error('服务器返回的数据格式不正确');
                }
            } else {
                // 本地抽奖逻辑
                console.log('使用本地抽奖逻辑');
                const prize = this.getRandomPrize();
                result = {
                    code: 200,
                    message: '抽奖成功',
                    data: prize
                };
            }

            if (result.code === 200) {
                // 扣除星星
                this.totalStars -= this.spinCost;
                localStorage.setItem('totalStars', this.totalStars);
                
                // 更新UI
                const totalStarsElement = document.getElementById('totalStars');
                if (totalStarsElement) {
                    totalStarsElement.textContent = this.totalStars;
                }

                // 获取中奖奖品信息
                const prize = result.data;

                // 执行转盘动画
                this.spinToPrice(prize);
            } else {
                alert(result.message || '抽奖失败，请稍后再试');
                this.isSpinning = false;
                if (spinButton) {
                    spinButton.disabled = false;
                }
            }
        } catch (error) {
            console.error('抽奖请求失败:', error);
            alert('网络错误，请稍后再试');
            this.isSpinning = false;
            if (spinButton) {
                spinButton.disabled = false;
            }
        }
    }

    getRandomPrize() {
        // 计算概率总和
        const totalProbability = this.prizes.reduce((sum, prize) => sum + (prize.probability || 0), 0);
        
        // 生成随机数
        const random = Math.random() * totalProbability;
        
        // 根据概率选择奖品
        let currentSum = 0;
        for (const prize of this.prizes) {
            currentSum += prize.probability || 0;
            if (random <= currentSum) {
                return prize;
            }
        }
        
        // 默认返回最后一个奖品
        return this.prizes[this.prizes.length - 1];
    }

    spinToPrice(prize) {
        const wheel = document.getElementById('wheel');
        if (!wheel) return;
        
        // 获取当前旋转角度
        const currentRotation = this.getCurrentRotation(wheel);
        
        // 计算目标奖品的角度
        const prizeIndex = this.prizes.findIndex(p => p.id === prize.id);
        const anglePerPrize = 360 / this.prizes.length;
        const targetAngle = 360 - (prizeIndex * anglePerPrize) - (anglePerPrize / 2);
        
        // 计算需要旋转的角度（多转几圈再停在目标奖品上）
        const rotations = 5; // 转5圈
        const rotationAngle = currentRotation + (360 * rotations) + targetAngle;
        
        // 设置旋转动画
        wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        wheel.style.transform = `rotate(${rotationAngle}deg)`;
        
        // 旋转结束后显示中奖信息
        setTimeout(() => {
            this.showPrizeModal(prize);
            this.isSpinning = false;
            
            const spinButton = document.getElementById('spinButton');
            if (spinButton) {
                spinButton.disabled = false;
            }
            
            // 保存中奖记录
            this.savePrize(prize);
        }, 4000);
    }
    
    getCurrentRotation(element) {
        const style = window.getComputedStyle(element);
        const matrix = new WebKitCSSMatrix(style.transform);
        return Math.round(Math.atan2(matrix.m21, matrix.m11) * (180 / Math.PI)) || 0;
    }
    
    showPrizeModal(prize) {
        const prizeModal = document.getElementById('prizeModal');
        const prizeName = document.getElementById('prizeName');
        const prizeDesc = document.getElementById('prizeDesc');
        const prizeIcon = document.querySelector('.prize-icon i');
        
        if (prizeName) prizeName.textContent = prize.name;
        if (prizeDesc) prizeDesc.textContent = prize.description;
        if (prizeIcon) {
            prizeIcon.className = `fas fa-${prize.icon}`;
            prizeIcon.style.color = prize.color;
        }
        
        if (prizeModal) {
            prizeModal.classList.add('active');
        }
        
        // 如果是积分奖品，增加星星数量
        if (prize.prize_type === 3) {
            const stars = parseInt(prize.points_cost) || 5;
            this.totalStars += stars;
            localStorage.setItem('totalStars', this.totalStars);
            
            // 更新UI
            const totalStarsElement = document.getElementById('totalStars');
            if (totalStarsElement) {
                totalStarsElement.textContent = this.totalStars;
            }
        }
    }
    
    savePrize(prize) {
        // 保存中奖记录
        const now = new Date();
        const prizeRecord = {
            id: prize.id,
            name: prize.name,
            icon: prize.icon,
            color: prize.color,
            date: now.toISOString(),
            description: prize.description
        };
        
        this.wonPrizes.unshift(prizeRecord);
        localStorage.setItem('wonPrizes', JSON.stringify(this.wonPrizes));
        
        // 更新UI
        this.renderPrizeHistory();
    }
    
    renderPrizeHistory() {
        const prizeList = document.getElementById('prizeList');
        if (!prizeList) return;
        
        // 清空列表
        prizeList.innerHTML = '';
        
        if (this.wonPrizes.length === 0) {
            // 如果没有奖品，显示空状态
            prizeList.innerHTML = `
                <div class="empty-prizes">
                    <i class="fas fa-gift"></i>
                    <p>还没有抽中奖品</p>
                    <p>快去转动星愿转盘吧</p>
                </div>
            `;
            return;
        }
        
        // 显示最近的10个奖品
        const recentPrizes = this.wonPrizes.slice(0, 10);
        
        recentPrizes.forEach(prize => {
            const prizeDate = new Date(prize.date);
            const formattedDate = `${prizeDate.getFullYear()}-${String(prizeDate.getMonth() + 1).padStart(2, '0')}-${String(prizeDate.getDate()).padStart(2, '0')} ${String(prizeDate.getHours()).padStart(2, '0')}:${String(prizeDate.getMinutes()).padStart(2, '0')}`;
            
            const prizeItem = document.createElement('div');
            prizeItem.className = 'prize-item';
            prizeItem.innerHTML = `
                <div class="prize-item-icon" style="color: ${prize.color}">
                    <i class="fas fa-${prize.icon}"></i>
                </div>
                <div class="prize-item-info">
                    <div class="prize-item-name">${prize.name}</div>
                    <div class="prize-item-date">${formattedDate}</div>
                </div>
            `;
            
            prizeList.appendChild(prizeItem);
        });
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const starWheelManager = new StarWheelManager();
}); 