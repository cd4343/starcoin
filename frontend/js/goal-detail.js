class GoalDetailManager {
    constructor() {
        this.goalId = null;
        this.goalData = null;
        this.selectedCategory = 'independent';
        this.selectedDays = [];
        this.uploadedImage = null;
        this.init();
    }

    async init() {
        try {
            // 从 URL 获取目标 ID
            const searchParams = new URLSearchParams(window.location.search);
            this.goalId = searchParams.get('id');
            
            // 如果有目标ID，加载目标详情
            if (this.goalId) {
                await this.loadGoalDetail();
            }
            
            // 绑定事件
            this.bindEvents();
            
            console.log('目标详情页面初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
        }
    }

    async loadGoalDetail() {
        try {
            // 尝试从localStorage获取自定义目标
            const customGoals = JSON.parse(localStorage.getItem('customGoals') || '[]');
            
            // 获取默认目标列表
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
            
            // 合并所有目标
            const allGoals = [...defaultGoals, ...customGoals.filter(g => !g.id.toString().startsWith('custom-override-'))];
            
            // 查找当前目标
            this.goalData = allGoals.find(goal => goal.id.toString() === this.goalId.toString());
            
            if (!this.goalData) {
                console.error('未找到目标数据:', this.goalId);
                return;
            }
            
            console.log('加载到目标数据:', this.goalData);
            
            // 更新页面标题
            document.querySelector('.page-header h1').textContent = '新目标';
            
            // 更新页面内容
            document.getElementById('goalTitle').value = this.goalData.title;
            
            const descriptionElem = document.getElementById('goalDescription');
            descriptionElem.value = this.goalData.description || '';
            this.updateCharCount(descriptionElem.value.length);
            
            // 设置图标
            const iconImg = document.getElementById('goalIconImage');
            const goalIcon = document.getElementById('goalIcon');
            
            // 先移除所有可能的图标类
            const iconClasses = goalIcon.className.split(' ').filter(c => !c.startsWith('goal-icon-'));
            goalIcon.className = iconClasses.join(' ');
            
            // 如果有iconClass，添加到goalIcon元素
            if (this.goalData.iconClass) {
                goalIcon.classList.add(this.goalData.iconClass);
                // 隐藏img元素，使用背景图片显示图标
                iconImg.style.opacity = '0';
            } else {
                // 如果没有iconClass，使用img元素显示图标
                iconImg.style.opacity = '1';
                iconImg.src = this.goalData.icon;
                iconImg.onerror = () => {
                    // 如果图标加载失败，使用默认图标
                    iconImg.src = '../images/goals/default.png';
                    // 或者使用默认的iconClass
                    goalIcon.classList.add('goal-icon-default');
                    iconImg.style.opacity = '0';
                };
            }
            
            // 设置分类
            this.selectedCategory = this.goalData.category || 'independent';
            this.updateCategoryUI();
            
            // 设置打卡频次
            this.selectedDays = this.goalData.days || [1, 2, 3, 4, 5];
            this.updateFrequencyUI();
            
        } catch (error) {
            console.error('加载目标详情失败:', error);
        }
    }

    bindEvents() {
        // 绑定图标编辑按钮点击事件
        const iconEditBtn = document.getElementById('iconEditBtn');
        const goalIcon = document.getElementById('goalIcon');
        
        // 增强点击区域，整个图标区域都可以点击
        goalIcon.addEventListener('click', (e) => {
            // 如果点击的是图标编辑按钮或其子元素，不做处理（避免重复触发）
            if (e.target === iconEditBtn || iconEditBtn.contains(e.target)) {
                return;
            }
            // 否则，触发图标编辑按钮的点击事件
            document.getElementById('uploadModal').style.display = 'flex';
        });
        
        iconEditBtn.addEventListener('click', () => {
            document.getElementById('uploadModal').style.display = 'flex';
        });
        
        // 绑定关闭上传弹窗事件
        document.getElementById('closeUploadModal').addEventListener('click', () => {
            document.getElementById('uploadModal').style.display = 'none';
        });
        
        // 绑定拍照按钮点击事件
        document.getElementById('takePhotoBtn').addEventListener('click', () => {
            // 检查是否支持getUserMedia
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                // 创建视频元素和拍照容器
                if (!document.getElementById('cameraContainer')) {
                    const cameraContainer = document.createElement('div');
                    cameraContainer.id = 'cameraContainer';
                    cameraContainer.style.marginTop = '20px';
                    cameraContainer.style.display = 'none';
                    
                    const video = document.createElement('video');
                    video.id = 'cameraVideo';
                    video.style.width = '100%';
                    video.style.borderRadius = '8px';
                    video.autoplay = true;
                    
                    const captureBtn = document.createElement('button');
                    captureBtn.id = 'captureBtn';
                    captureBtn.textContent = '拍照';
                    captureBtn.style.marginTop = '10px';
                    captureBtn.style.padding = '10px 20px';
                    captureBtn.style.background = '#7367f0';
                    captureBtn.style.color = 'white';
                    captureBtn.style.border = 'none';
                    captureBtn.style.borderRadius = '8px';
                    captureBtn.style.width = '100%';
                    
                    cameraContainer.appendChild(video);
                    cameraContainer.appendChild(captureBtn);
                    
                    document.querySelector('.upload-modal-body').insertBefore(
                        cameraContainer,
                        document.getElementById('imagePreviewContainer')
                    );
                    
                    // 绑定拍照按钮事件
                    captureBtn.addEventListener('click', () => {
                        const canvas = document.createElement('canvas');
                        const video = document.getElementById('cameraVideo');
                        
                        // 设置画布大小为视频的大小
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        
                        // 绘制视频帧到画布
                        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        // 获取图像数据
                        const imageData = canvas.toDataURL('image/jpeg', 0.8);
                        
                        // 显示预览
                        document.getElementById('imagePreview').src = imageData;
                        document.getElementById('imagePreviewContainer').style.display = 'block';
                        this.uploadedImage = imageData;
                        
                        // 停止视频流
                        const stream = video.srcObject;
                        const tracks = stream.getTracks();
                        tracks.forEach(track => track.stop());
                        
                        // 隐藏相机容器
                        document.getElementById('cameraContainer').style.display = 'none';
                    });
                }
                
                // 显示相机容器
                document.getElementById('cameraContainer').style.display = 'block';
                
                // 获取视频流
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                        const video = document.getElementById('cameraVideo');
                        video.srcObject = stream;
                    })
                    .catch(err => {
                        console.error('无法访问摄像头:', err);
                        alert('无法访问摄像头，请检查权限设置或使用相册选择图片');
                        // 如果无法访问摄像头，回退到文件选择
                        const photoInput = document.getElementById('photoInput');
                        photoInput.click();
                    });
            } else {
                // 如果不支持getUserMedia，回退到文件选择
                console.warn('浏览器不支持getUserMedia API');
                const photoInput = document.getElementById('photoInput');
                photoInput.click();
            }
        });
        
        // 绑定从相册选择按钮点击事件
        document.getElementById('choosePhotoBtn').addEventListener('click', () => {
            // 如果相机容器存在且显示，则隐藏并停止视频流
            const cameraContainer = document.getElementById('cameraContainer');
            if (cameraContainer && cameraContainer.style.display !== 'none') {
                const video = document.getElementById('cameraVideo');
                if (video.srcObject) {
                    const stream = video.srcObject;
                    const tracks = stream.getTracks();
                    tracks.forEach(track => track.stop());
                }
                cameraContainer.style.display = 'none';
            }
            
            // 打开文件选择器
            const photoInput = document.getElementById('photoInput');
            photoInput.click();
        });
        
        // 绑定文件选择事件
        document.getElementById('photoInput').addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    // 创建图片元素用于获取原始尺寸
                    const img = new Image();
                    img.onload = () => {
                        // 裁剪为正方形
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // 确定裁剪尺寸（取较小的一边）
                        const size = Math.min(img.width, img.height);
                        const startX = (img.width - size) / 2;
                        const startY = (img.height - size) / 2;
                        
                        // 设置画布大小为正方形
                        canvas.width = size;
                        canvas.height = size;
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, size, size);
                        // 绘制裁剪后的图像
                        ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);
                        // 设置画布背景为白色
                       
                        // 转换为数据URL
                        const croppedImage = canvas.toDataURL('image/jpeg', 0.8);
                        
                        // 显示预览
                        document.getElementById('imagePreview').src = croppedImage;
                        document.getElementById('imagePreviewContainer').style.display = 'block';
                        this.uploadedImage = croppedImage;
                    };
                    
                    img.src = event.target.result;
                };
                
                reader.readAsDataURL(file);
            }
        });
        
        // 绑定取消预览按钮点击事件
        document.getElementById('cancelPreviewBtn').addEventListener('click', () => {
            document.getElementById('imagePreviewContainer').style.display = 'none';
            document.getElementById('photoInput').value = '';
            this.uploadedImage = null;
        });
        
        // 绑定确认图片按钮点击事件
        document.getElementById('confirmImageBtn').addEventListener('click', () => {
            if (this.uploadedImage) {
                const goalIcon = document.getElementById('goalIcon');
                const iconImg = document.getElementById('goalIconImage');
                
                // 移除所有图标类
                const iconClasses = goalIcon.className.split(' ').filter(c => !c.startsWith('goal-icon-'));
                goalIcon.className = iconClasses.join(' ');
                
                // 使用img元素显示上传的图片
                iconImg.style.opacity = '1';
                iconImg.src = this.uploadedImage;
                
                // 更新goalData
                if (this.goalData) {
                    this.goalData.icon = this.uploadedImage;
                    delete this.goalData.iconClass; // 移除iconClass，因为使用自定义图片
                }
                
                document.getElementById('uploadModal').style.display = 'none';
                document.getElementById('imagePreviewContainer').style.display = 'none';
            }
        });
        
        // 绑定分类选项点击事件
        const categoryOptions = document.querySelectorAll('.category-option');
        categoryOptions.forEach(option => {
            option.addEventListener('click', () => {
                categoryOptions.forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                
                this.selectedCategory = option.dataset.category;
            });
        });
        
        // 绑定打卡频次选项点击事件
        const frequencyOptions = document.querySelectorAll('.frequency-option');
        frequencyOptions.forEach(option => {
            option.addEventListener('click', () => {
                option.classList.toggle('active');
                
                const day = option.dataset.day;
                
                if (option.classList.contains('active')) {
                    if (!this.selectedDays.includes(day)) {
                        this.selectedDays.push(day);
                    }
                } else {
                    this.selectedDays = this.selectedDays.filter(d => d !== day);
                }
            });
        });
        
        // 绑定保存按钮点击事件
        document.getElementById('saveGoalBtn').addEventListener('click', () => {
            this.saveGoal();
        });
        
        // 绑定描述文本框输入事件
        const descriptionElem = document.getElementById('goalDescription');
        descriptionElem.addEventListener('input', () => {
            this.updateCharCount(descriptionElem.value.length);
        });
    }

    updateCharCount(count) {
        document.getElementById('charCount').textContent = count;
    }

    updateCategoryUI() {
        const categoryOptions = document.querySelectorAll('.category-option');
        categoryOptions.forEach(option => {
            option.classList.remove('active');
            if (option.dataset.category === this.selectedCategory) {
                option.classList.add('active');
            }
        });
    }

    updateFrequencyUI() {
        const frequencyOptions = document.querySelectorAll('.frequency-option');
        frequencyOptions.forEach(option => {
            option.classList.remove('active');
            if (this.selectedDays.includes(option.dataset.day)) {
                option.classList.add('active');
            }
        });
    }

    saveGoal() {
        const title = document.getElementById('goalTitle').value;
        const description = document.getElementById('goalDescription').value;
        const iconSrc = document.getElementById('goalIconImage').src;
        const goalIcon = document.getElementById('goalIcon');
        
        if (!title) {
            alert('请输入目标名称');
            return;
        }
        
        if (this.selectedDays.length === 0) {
            alert('请选择至少一个打卡日期');
            return;
        }
        
        // 获取iconClass
        const iconClass = Array.from(goalIcon.classList).find(c => c.startsWith('goal-icon-'));
        
        // 更新或创建目标数据
        const goalData = {
            id: this.goalId || 'custom-' + Date.now(),
            title,
            description,
            icon: this.uploadedImage || iconSrc,
            iconClass: iconClass, // 保存iconClass
            category: this.selectedCategory,
            days: this.selectedDays
        };
        
        console.log('保存目标:', goalData);
        
        // 保存所有目标的修改到localStorage，包括默认目标
        const customGoals = JSON.parse(localStorage.getItem('customGoals') || '[]');
        
        // 检查是否已存在该目标
        const existingIndex = customGoals.findIndex(g => g.id.toString() === goalData.id.toString());
        
        if (existingIndex >= 0) {
            // 更新现有目标
            customGoals[existingIndex] = goalData;
        } else {
            // 添加新目标或默认目标的修改版本
            // 如果是默认目标，创建一个副本保存修改
            if (!goalData.id.toString().startsWith('custom-')) {
                // 为默认目标创建一个自定义副本，保留原始ID以便覆盖默认设置
                goalData.originalId = goalData.id;
                goalData.id = 'custom-override-' + goalData.id;
            }
            customGoals.push(goalData);
        }
        
        localStorage.setItem('customGoals', JSON.stringify(customGoals));
        
        // 显示成功提示
        alert('目标保存成功');
        
        // 返回上一页
        window.history.back();
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const goalDetailManager = new GoalDetailManager();
}); 