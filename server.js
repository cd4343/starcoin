const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const app = express();

// 确保在所有路由之前添加这些中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置 CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// 数据文件路径
const DATA_FILE = path.join(__dirname, 'data', 'babies.json');

// 目标数据文件路径
const GOALS_FILE = path.join(__dirname, 'data', 'goals.json');

// 确保数据目录存在
async function ensureDataDir() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.access(dataDir);
        console.log('数据目录已存在');
    } catch {
        console.log('创建数据目录');
        await fs.mkdir(dataDir);
    }
}

// 读取宝贝数据
async function loadBabiesData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // 如果文件不存在，返回空数组
        return [];
    }
}

// 保存宝贝数据
async function saveBabiesData(babies) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(babies, null, 2));
        console.log('数据保存成功');
    } catch (error) {
        console.error('保存数据失败:', error);
        throw error;
    }
}

// 目标数据存储
let goalsDatabase = [];

// 读取目标数据
async function loadGoalsData() {
    try {
        const data = await fs.readFile(GOALS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // 如果文件不存在或解析失败，返回空数组
        return [];
    }
}

// 保存目标数据
async function saveGoalsData(goals) {
    await fs.writeFile(GOALS_FILE, JSON.stringify(goals, null, 2));
}

// 初始化数据存储
let babiesDatabase = [];

// 初始化时加载数据
async function initializeDatabase() {
    await Promise.all([
        ensureDataDir(),
        ensureUploadDir()
    ]);
    babiesDatabase = await loadBabiesData();
    goalsDatabase = await loadGoalsData();
}

// 配置静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'frontend', 'uploads')));
app.use(express.static(path.join(__dirname, 'frontend')));

// 添加路径检查日志
console.log('项目根目录:', __dirname);
console.log('上传目录:', path.join(__dirname, 'frontend', 'uploads'));
console.log('静态文件目录:', path.join(__dirname, 'frontend'));

// 添加一个简单的路由来测试服务器是否正常工作
app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: '服务器正常工作' });
});

// API 路由
app.get('/api/babies', async (req, res) => {
    try {
        console.log('收到获取所有宝贝请求');
        // 确保数据已加载
        if (!babiesDatabase) {
            babiesDatabase = await loadBabiesData();
        }
        
        console.log(`返回 ${babiesDatabase.length} 个宝贝数据`);
        res.json(babiesDatabase || []);  // 确保返回数组，即使是空的
    } catch (error) {
        console.error('获取宝贝列表失败:', error);
        res.status(500).json({ error: '服务器错误', details: error.message });
    }
});

// 获取单个宝贝信息
app.get('/api/babies/:id', (req, res) => {
    const baby = babiesDatabase.find(b => b.id === req.params.id);
    if (!baby) {
        return res.status(404).json({ error: '宝贝不存在' });
    }
    res.json(baby);
});

// 创建新宝贝
app.post('/api/babies', express.json(), async (req, res) => {
    try {
        console.log('收到创建宝贝请求，请求体:', req.body);
        
        // 验证必填字段
        const { nickname, gender } = req.body;
        if (!nickname || !gender) {
            console.log('缺少必填字段');
            return res.status(400).json({ error: '昵称和性别为必填项' });
        }
        
        // 创建新宝贝
        const newBaby = {
            id: Date.now().toString(),
            ...req.body,
            createdAt: new Date().toISOString()
        };
        
        console.log('准备创建新宝贝档案:', newBaby);
        
        // 添加到数据库
        babiesDatabase.push(newBaby);
        
        // 保存到文件
        await saveBabiesData(babiesDatabase);
        
        console.log('宝贝创建成功:', newBaby.id);
        res.status(201).json(newBaby);
    } catch (error) {
        console.error('创建宝贝失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新宝贝信息
app.put('/api/babies/:id', express.json(), async (req, res) => {
    try {
        const index = babiesDatabase.findIndex(b => b.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: '宝贝不存在' });
        }

        babiesDatabase[index] = { ...babiesDatabase[index], ...req.body };
        await saveBabiesData(babiesDatabase);

        res.json(babiesDatabase[index]);
    } catch (error) {
        console.error('更新宝贝信息失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 确保上传目录存在
async function ensureUploadDir() {
    const uploadDir = path.join(__dirname, 'frontend', 'uploads');
    try {
        // 检查目录是否存在
        await fs.access(uploadDir);
    } catch {
        try {
            // 创建目录
            await fs.mkdir(uploadDir, { recursive: true });
            console.log('已创建上传目录:', uploadDir);
        } catch (error) {
            console.error('创建上传目录失败:', error);
            throw new Error('无法创建上传目录，请检查权限');
        }
    }

    // 测试目录是否可写
    try {
        const testFile = path.join(uploadDir, 'test.txt');
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
        console.log('上传目录权限正常');
    } catch (error) {
        console.error('上传目录权限不足:', error);
        throw new Error('上传目录没有写入权限');
    }

    return uploadDir;
}

// 修改文件上传配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'frontend', 'uploads');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'avatar-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        // 只允许上传图片
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只能上传图片文件'));
        }
    }
});

// 处理头像上传
app.post('/api/babies/:id/avatar', upload.single('avatar'), async (req, res) => {
    try {
        const babyId = req.params.id;
        const baby = babiesDatabase.find(b => b.id === babyId);
        
        if (!baby) {
            return res.status(404).json({ error: '宝贝不存在' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: '未上传文件' });
        }
        
        // 更新宝贝的头像路径
        baby.avatar = `/uploads/${req.file.filename}`;
        
        // 保存到文件
        await saveBabiesData(babiesDatabase);
        
        res.json({ success: true, avatar: baby.avatar });
    } catch (error) {
        console.error('上传头像失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取宝贝的目标列表
app.get('/api/babies/:id/goals', async (req, res) => {
    try {
        const babyId = req.params.id;
        const goals = goalsDatabase.filter(goal => goal.babyId === babyId);
        res.json(goals);
    } catch (error) {
        console.error('获取目标列表失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 创建新目标
app.post('/api/babies/:id/goals', express.json(), async (req, res) => {
    try {
        const babyId = req.params.id;
        // 兼容前端发送的数据格式
        const { 
            title, 
            text, 
            category, 
            description, 
            date, 
            stars = 1, 
            isPositive = true, 
            completed = false, 
            type = 'daily' 
        } = req.body;

        // 使用title或text作为目标内容
        const goalText = title || text;

        if (!goalText) {
            return res.status(400).json({ error: '目标内容不能为空' });
        }

        const newGoal = {
            id: Date.now().toString(),
            babyId,
            text: goalText,
            type,
            category: category || 'other',
            description: description || '',
            date: date || new Date().toISOString().split('T')[0],
            stars: stars,
            isPositive: isPositive,
            completed: completed,
            createdAt: new Date().toISOString(),
        };

        goalsDatabase.push(newGoal);
        await saveGoalsData(goalsDatabase);

        res.status(201).json(newGoal);
    } catch (error) {
        console.error('创建目标失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新目标状态
app.put('/api/goals/:id', express.json(), async (req, res) => {
    try {
        const goalId = req.params.id;
        const goal = goalsDatabase.find(g => g.id === goalId);

        if (!goal) {
            return res.status(404).json({ error: '目标不存在' });
        }

        Object.assign(goal, req.body);
        await saveGoalsData(goalsDatabase);

        res.json(goal);
    } catch (error) {
        console.error('更新目标失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除目标
app.delete('/api/goals/:id', async (req, res) => {
    try {
        const goalId = req.params.id;
        const index = goalsDatabase.findIndex(g => g.id === goalId);

        if (index === -1) {
            return res.status(404).json({ error: '目标不存在' });
        }

        goalsDatabase.splice(index, 1);
        await saveGoalsData(goalsDatabase);

        res.status(204).send();
    } catch (error) {
        console.error('删除目标失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取某天的目标完成情况
app.get('/api/babies/:id/goals/daily', async (req, res) => {
    try {
        const babyId = req.params.id;
        const date = req.query.date || new Date().toISOString().split('T')[0];

        // 找出符合条件的目标
        let dailyGoals = goalsDatabase.filter(goal => {
            // 检查是否为指定宝贝的目标
            const isBabyMatch = goal.babyId === babyId;
            
            // 检查日期是否匹配
            let isDateMatch = false;
            if (goal.date) {
                // 如果目标有明确的date字段，直接比较
                isDateMatch = goal.date === date;
            } else if (goal.createdAt) {
                // 如果没有date字段，则使用createdAt的日期部分
                isDateMatch = goal.createdAt.startsWith(date);
            }
            
            return isBabyMatch && isDateMatch;
        });

        // 格式化返回数据，确保每个目标都有统一的字段结构
        dailyGoals = dailyGoals.map(goal => {
            return {
                id: goal.id,
                title: goal.text || goal.title || "",
                description: goal.description || "",
                category: goal.category || "other",
                completed: goal.completed || goal.isCompleted || false,
                stars: goal.stars || 1,
                isPositive: goal.isPositive !== false, // 默认为正面
                date: goal.date || goal.createdAt.split('T')[0],
                icon: goal.icon || ""
            };
        });

        res.json(dailyGoals);
    } catch (error) {
        console.error('获取每日目标失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取宝贝的月度统计数据
app.get('/api/babies/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;
        
        // 验证日期参数
        if (!startDate || !endDate) {
            return res.status(400).json({ error: '缺少日期参数' });
        }

        // 验证宝贝ID
        if (id !== 'all') {
            const baby = babiesDatabase.find(b => b.id === id);
            if (!baby) {
                return res.status(404).json({ error: '宝贝不存在' });
            }
        }

        // 获取日期范围内的所有记录
        const stats = await loadBabyStatsData(id, startDate, endDate);
        
        res.json(stats);
    } catch (error) {
        console.error('获取月度统计失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取宝贝指定年月的统计数据
app.get('/api/babies/:id/stats/:year/:month', async (req, res) => {
    try {
        const { id, year, month } = req.params;
        
        // 验证宝贝ID
        const baby = babiesDatabase.find(b => b.id === id);
        if (!baby) {
            return res.status(404).json({ error: '宝贝不存在' });
        }
        
        // 构建日期范围
        const startDate = `${year}-${parseInt(month).toString().padStart(2, '0')}-01`;
        
        // 获取月份的最后一天
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${parseInt(month).toString().padStart(2, '0')}-${lastDay}`;
        
        // 获取日期范围内的所有记录
        const stats = await loadBabyStatsData(id, startDate, endDate);
        
        // 创建完整的月份数据，包括没有记录的日期
        const completeStats = [];
        const existingDates = {};
        
        // 创建日期到统计数据的映射
        stats.forEach(stat => {
            existingDates[stat.date] = stat;
        });
        
        // 填充所有日期
        for (let day = 1; day <= lastDay; day++) {
            const dateStr = `${year}-${parseInt(month).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            if (existingDates[dateStr]) {
                completeStats.push(existingDates[dateStr]);
            } else {
                // 为没有记录的日期创建一个空记录
                completeStats.push({
                    id: `empty-${id}-${dateStr}`,
                    babyId: id,
                    date: dateStr,
                    total_stars: 0,
                    completed_goals: 0,
                    total_goals: 0
                });
            }
        }
        
        // 计算总星星数和有星星的天数
        const totalStars = stats.reduce((sum, stat) => sum + (stat.total_stars || 0), 0);
        const daysWithStars = stats.filter(stat => (stat.total_stars || 0) > 0).length;
        
        res.json({
            totalStars: totalStars,
            daysWithStars: daysWithStars,
            dailyStats: completeStats
        });
    } catch (error) {
        console.error('获取指定月份统计失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 加载宝贝统计数据
async function loadBabyStatsData(babyId, startDate, endDate) {
    try {
        // 如果没有统计数据文件，创建一个空的
        const statsPath = path.join(__dirname, 'data', 'stats.json');
        let stats = [];
        
        try {
            const data = await fs.readFile(statsPath, 'utf8');
            stats = JSON.parse(data);
        } catch (error) {
            // 如果文件不存在，创建一个空数组
            await fs.writeFile(statsPath, JSON.stringify([]), 'utf8');
        }
        
        // 筛选数据
        return stats.filter(stat => 
            (babyId === 'all' || stat.babyId === babyId) && 
            stat.date >= startDate && 
            stat.date <= endDate
        );
    } catch (error) {
        console.error('加载统计数据失败:', error);
        return [];
    }
}

// 获取目标模板列表
app.get('/api/goal-templates', async (req, res) => {
    try {
        // 这里应该是从数据库或文件加载实际的目标模板
        // 为了演示，我们创建一些示例模板
        const templates = [
            {
                id: '1',
                title: '早上7点起床',
                description: '自己设闹钟起床，不需要家长催促',
                category: 'independent',
                stars: 3,
                isPositive: true,
                iconClass: 'goal-icon-morning'
            },
            {
                id: '2',
                title: '整理书桌',
                description: '将书本和文具整理好',
                category: 'labor',
                stars: 2,
                isPositive: true,
                iconClass: 'goal-icon-clean'
            },
            {
                id: '3',
                title: '阅读30分钟',
                description: '阅读一本有趣的书',
                category: 'study',
                stars: 3,
                isPositive: true,
                iconClass: 'goal-icon-book'
            },
            {
                id: '4',
                title: '自己刷牙',
                description: '早晚各刷一次牙',
                category: 'life',
                stars: 1,
                isPositive: true,
                iconClass: 'goal-icon-brush'
            },
            {
                id: '5',
                title: '写完数学作业',
                description: '完成老师布置的数学练习',
                category: 'study',
                stars: 3,
                isPositive: true,
                iconClass: 'goal-icon-math'
            },
            {
                id: '6',
                title: '帮妈妈摆餐具',
                description: '晚餐前帮忙摆好碗筷',
                category: 'labor',
                stars: 2,
                isPositive: true,
                iconClass: 'goal-icon-help'
            },
            {
                id: '7',
                title: '认真听课',
                description: '在课堂上专心听讲',
                category: 'study',
                stars: 2,
                isPositive: true,
                iconClass: 'goal-icon-listen'
            },
            {
                id: '8',
                title: '自己洗澡',
                description: '自己完成洗澡过程',
                category: 'independent',
                stars: 2,
                isPositive: true,
                iconClass: 'goal-icon-bath'
            }
        ];
        
        res.json(templates);
    } catch (error) {
        console.error('获取目标模板失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 所有其他请求都返回 index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'pages', 'index.html'));
});

// 删除宝贝
app.delete('/api/babies/:id', async (req, res) => {
    try {
        const babyId = req.params.id;
        const index = babiesDatabase.findIndex(b => b.id === babyId);
        
        if (index === -1) {
            return res.status(404).json({ error: '宝贝不存在' });
        }
        
        // 从数组中删除
        babiesDatabase.splice(index, 1);
        
        // 保存到文件
        await saveBabiesData(babiesDatabase);
        
        res.status(204).send();
    } catch (error) {
        console.error('删除宝贝失败:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 修改启动函数
async function startServer() {
    try {
        // 确保所需目录存在
        await Promise.all([
            ensureDataDir(),
            ensureUploadDir()
        ]);

        // 加载数据
        babiesDatabase = await loadBabiesData();
        goalsDatabase = await loadGoalsData();

        // 生成测试统计数据
        await generateTestStatsData();

        const port = 3000;
        app.listen(port, () => {
            console.log(`服务器运行在 http://localhost:${port}`);
            console.log('上传目录:', path.join(__dirname, 'frontend', 'uploads'));
        });
    } catch (error) {
        console.error('启动服务器失败:', error);
        process.exit(1);
    }
}

// 生成测试统计数据
async function generateTestStatsData() {
    try {
        // 检查是否已有数据
        const statsPath = path.join(__dirname, 'data', 'stats.json');
        let stats = [];
        
        try {
            const data = await fs.readFile(statsPath, 'utf8');
            stats = JSON.parse(data);
        } catch (error) {
            // 如果文件不存在或为空，创建一个空数组
            stats = [];
        }
        
        // 如果已有数据，不重新生成
        if (stats.length > 0) {
            console.log('已有统计数据，跳过生成测试数据');
            return;
        }
        
        // 获取所有宝贝ID
        const babyIds = babiesDatabase.map(baby => baby.id);
        
        if (babyIds.length === 0) {
            console.log('没有宝贝数据，跳过生成测试数据');
            return;
        }
        
        // 生成当前月份的测试数据
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        // 获取当前月的天数
        const daysInMonth = new Date(year, month, 0).getDate();
        
        // 为每个宝贝创建测试数据
        for (const babyId of babyIds) {
            // 随机选择1-10天有星星数据
            const daysWithStars = Math.floor(Math.random() * 10) + 1;
            const starDays = [];
            
            // 随机选择一些日期
            while (starDays.length < daysWithStars) {
                const day = Math.floor(Math.random() * daysInMonth) + 1;
                if (!starDays.includes(day)) {
                    starDays.push(day);
                }
            }
            
            // 为选定的日期创建星星数据
            for (const day of starDays) {
                const stars = Math.floor(Math.random() * 5) + 1; // 1-5颗星
                const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                
                stats.push({
                    id: `test-${babyId}-${dateStr}`,
                    babyId: babyId,
                    date: dateStr,
                    total_stars: stars,
                    completed_goals: stars,
                    total_goals: stars + Math.floor(Math.random() * 3) // 总目标数略多于完成的目标数
                });
            }
        }
        
        // 保存测试数据
        await fs.writeFile(statsPath, JSON.stringify(stats, null, 2), 'utf8');
        console.log(`已生成${stats.length}条测试统计数据`);
    } catch (error) {
        console.error('生成测试统计数据失败:', error);
    }
}

startServer(); 