class BabyProfile {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <div class="baby-profile-container">
        <h1 class="profile-title">添加宝贝</h1>
        
        <!-- 宝贝昵称输入 -->
        <div class="input-group">
          <label for="babyNickname">宝贝昵称</label>
          <input type="text" id="babyNickname" placeholder="小名/大名/英文名都可以">
        </div>

        <!-- 身份选择 -->
        <div class="identity-group">
          <label>你的身份</label>
          <div class="radio-group">
            ${['妈妈', '爸爸', '爷爷', '奶奶', '外公', '外婆', '亲人', '宝贝'].map(role => `
              <label class="radio-item">
                <input type="radio" name="identity" value="${role}">
                <span class="radio-label">${role}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- 性别选择 -->
        <div class="gender-group">
          <label>宝贝性别</label>
          <div class="radio-group">
            <label class="radio-item">
              <input type="radio" name="gender" value="male">
              <span class="radio-label">男</span>
            </label>
            <label class="radio-item">
              <input type="radio" name="gender" value="female">
              <span class="radio-label">女</span>
            </label>
          </div>
        </div>

        <!-- 初始星星设置 -->
        <div class="stars-group">
          <label>初始星星</label>
          <div class="stars-input">
            <button class="btn-decrease">-</button>
            <div class="stars-number">
              <input type="number" id="starsCount" value="0" min="0">
              <i class="fas fa-star star-icon"></i>
            </div>
            <button class="btn-increase">+</button>
          </div>
        </div>

        <!-- 提交按钮 -->
        <button class="btn-submit">保存</button>
      </div>
    `;
  }

  bindEvents() {
    // 星星数量调整
    const starsInput = this.container.querySelector('#starsCount');
    const decreaseBtn = this.container.querySelector('.btn-decrease');
    const increaseBtn = this.container.querySelector('.btn-increase');

    decreaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(starsInput.value) || 0;
      if (currentValue > 0) {
        starsInput.value = currentValue - 1;
      }
    });

    increaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(starsInput.value) || 0;
      starsInput.value = currentValue + 1;
    });

    // 直接输入星星数量
    starsInput.addEventListener('change', (e) => {
      const value = parseInt(e.target.value) || 0;
      if (value < 0) {
        e.target.value = 0;
      }
    });

    // 表单提交
    this.container.querySelector('.btn-submit').addEventListener('click', () => {
      this.handleSubmit();
    });
  }

  async handleSubmit() {
    const formData = {
      nickname: this.container.querySelector('#babyNickname').value,
      identity: this.container.querySelector('input[name="identity"]:checked')?.value,
      gender: this.container.querySelector('input[name="gender"]:checked')?.value,
      initialStars: parseInt(this.container.querySelector('#starsCount').value) || 0
    };

    // 表单验证
    if (!this.validateForm(formData)) {
      return;
    }

    try {
      const response = await fetch('/api/baby/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('保存成功！');
        // 可以跳转到其他页面或刷新当前页面
      } else {
        alert('保存失败，请重试');
      }
    } catch (error) {
      console.error('提交失败:', error);
      alert('网络错误，请重试');
    }
  }

  validateForm(formData) {
    if (!formData.nickname.trim()) {
      alert('请输入宝贝昵称');
      return false;
    }
    if (!formData.identity) {
      alert('请选择您的身份');
      return false;
    }
    if (!formData.gender) {
      alert('请选择宝贝性别');
      return false;
    }
    return true;
  }
} 