import pymysql
import json
import os
from datetime import datetime, timedelta

# 数据库连接配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root',  # 您的MySQL密码
    'db': 'ttt',  # 您的数据库名称
    'charset': 'utf8mb4'
}

def create_tables():
    """创建数据库表"""
    try:
        # 连接到MySQL服务器
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 创建宝宝信息表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS babies (
            id VARCHAR(20) PRIMARY KEY,
            nickname VARCHAR(50) NOT NULL,
            gender VARCHAR(10),
            birth_date DATE,
            stars INT DEFAULT 0,
            avatar VARCHAR(255),
            created_at DATETIME
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        # 创建目标分类表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS goal_categories (
            id VARCHAR(20) PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            icon VARCHAR(50),
            description TEXT,
            display_order INT DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        # 创建目标表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS goals (
            id VARCHAR(20) PRIMARY KEY,
            baby_id VARCHAR(20) NOT NULL,
            category_id VARCHAR(20) NOT NULL,
            title VARCHAR(100) NOT NULL,
            description TEXT,
            icon VARCHAR(50),
            points INT DEFAULT 1,
            is_default BOOLEAN DEFAULT 0,
            created_at DATETIME,
            FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES goal_categories(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        # 创建目标完成记录表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS goal_completions (
            id VARCHAR(20) PRIMARY KEY,
            goal_id VARCHAR(20) NOT NULL,
            baby_id VARCHAR(20) NOT NULL,
            completion_date DATE NOT NULL,
            stars INT DEFAULT 0,
            notes TEXT,
            created_at DATETIME,
            FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
            FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        # 创建每日统计表
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_stats (
            id VARCHAR(20) PRIMARY KEY,
            baby_id VARCHAR(20) NOT NULL,
            date DATE NOT NULL,
            total_stars INT DEFAULT 0,
            completed_goals INT DEFAULT 0,
            total_goals INT DEFAULT 0,
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE,
            UNIQUE(baby_id, date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        
        # 插入默认分类
        categories = [
            ('independent', '独立', 'fa-child', 1),
            ('labor', '劳动', 'fa-broom', 2),
            ('study', '学习', 'fa-book', 3),
            ('life', '生活', 'fa-home', 4),
            ('criticism', '批评', 'fa-comment-alt', 5),
            ('praise', '表扬', 'fa-thumbs-up', 6)
        ]
        
        # 检查分类表是否为空
        cursor.execute("SELECT COUNT(*) FROM goal_categories")
        count = cursor.fetchone()[0]
        if count == 0:
            for category in categories:
                cursor.execute(
                    "INSERT INTO goal_categories (id, name, icon, display_order) VALUES (%s, %s, %s, %s)",
                    category
                )
            print("默认分类数据插入成功")
        
        conn.commit()
        print("数据库表创建成功")
        
    except Exception as e:
        print(f"创建数据库表出错: {e}")
    finally:
        cursor.close()
        conn.close()

def import_babies_data():
    """导入babies.json数据"""
    try:
        # 检查babies.json文件是否存在
        if not os.path.exists('data/babies.json'):
            print("未找到babies.json文件，请确保文件位于data目录下")
            return
        
        # 读取babies.json文件
        with open('data/babies.json', 'r', encoding='utf-8') as f:
            babies_data = json.load(f)
        
        # 连接到数据库
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 检查babies表是否为空
        cursor.execute("SELECT COUNT(*) FROM babies")
        count = cursor.fetchone()[0]
        
        if count > 0:
            print("babies表已有数据，跳过导入")
            cursor.close()
            conn.close()
            return
        
        # 导入宝宝数据
        for baby in babies_data:
            # 转换日期格式
            birth_date = baby.get('birthDate', None)
            created_at = baby.get('createdAt', datetime.now().isoformat())
            
            # 插入宝宝数据
            cursor.execute(
                "INSERT INTO babies (id, nickname, gender, birth_date, stars, avatar, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (
                    baby['id'],
                    baby['nickname'],
                    baby.get('gender', 'unknown'),
                    birth_date,
                    baby.get('stars', 0),
                    baby.get('avatar', None),
                    created_at
                )
            )
            print(f"宝宝 {baby['nickname']} (ID: {baby['id']}) 导入成功")
            
            # 为每个宝宝创建默认目标
            create_default_goals(cursor, baby['id'])
        
        conn.commit()
        print("宝宝数据导入成功")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"导入宝宝数据出错: {e}")

def create_default_goals(cursor, baby_id):
    """为宝宝创建默认目标"""
    try:
        # 默认目标
        default_goals = [
            ('independent', '自己放学回家', '自己回家', 'goal-icon-back-home', 3),
            ('labor', '自己洗饭盒', '自己清洗午餐饭盒', 'goal-icon-wash-lunchbox', 2),
            ('labor', '擦桌子', '帮忙擦桌子', 'goal-icon-clean-table', 2)
        ]
        
        for goal in default_goals:
            goal_id = f"{int(datetime.now().timestamp() * 1000)}"
            cursor.execute(
                "INSERT INTO goals (id, baby_id, category_id, title, description, icon, points, is_default, created_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (goal_id, baby_id, goal[0], goal[1], goal[2], goal[3], goal[4], 1, datetime.now())
            )
            # 等待一毫秒以确保ID唯一
            import time
            time.sleep(0.001)
        
        print(f"为宝宝 {baby_id} 创建默认目标成功")
    except Exception as e:
        print(f"创建默认目标出错: {e}")

def create_api_files():
    """创建API相关文件"""
    try:
        # 创建api目录
        os.makedirs('api', exist_ok=True)
        
        # 创建db.py
        with open('api/db.py', 'w', encoding='utf-8') as f:
            f.write('''import pymysql
from datetime import datetime

# 数据库连接配置
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root',
    'db': 'ttt',
    'charset': 'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_connection():
    """获取数据库连接"""
    return pymysql.connect(**DB_CONFIG)

def generate_id():
    """生成唯一ID"""
    return f"{int(datetime.now().timestamp() * 1000)}"

def execute_query(query, params=None):
    """执行查询并返回结果"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            result = cursor.fetchall()
        return result
    finally:
        conn.close()

def execute_update(query, params=None):
    """执行更新操作并返回影响的行数"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            affected_rows = cursor.execute(query, params)
            conn.commit()
        return affected_rows
    finally:
        conn.close()

def execute_insert(query, params=None):
    """执行插入操作并返回最后插入的ID"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()
''')
        
        # 创建goal_service.py
        with open('api/goal_service.py', 'w', encoding='utf-8') as f:
            f.write('''from api.db import execute_query, execute_update, execute_insert, generate_id
from datetime import datetime, timedelta

def get_goal_categories():
    """获取所有目标分类"""
    return execute_query("SELECT * FROM goal_categories ORDER BY display_order")

def get_baby_goals(baby_id):
    """获取宝宝的所有目标"""
    return execute_query("SELECT * FROM goals WHERE baby_id = %s", (baby_id,))

def get_baby_goals_by_date(baby_id, date):
    """获取宝宝特定日期的目标和完成情况"""
    # 获取所有目标
    goals = execute_query(\'\'\'
        SELECT g.*, 
               CASE WHEN gc.id IS NOT NULL THEN 1 ELSE 0 END as completed,
               IFNULL(gc.stars, 0) as stars
        FROM goals g
        LEFT JOIN goal_completions gc ON g.id = gc.goal_id 
            AND gc.baby_id = %s AND gc.completion_date = %s
        WHERE g.baby_id = %s
    \'\'\', (baby_id, date, baby_id))
    
    # 获取已完成的目标
    completed_goals = execute_query(\'\'\'
        SELECT gc.*, g.category_id as category
        FROM goal_completions gc
        JOIN goals g ON gc.goal_id = g.id
        WHERE gc.baby_id = %s AND gc.completion_date = %s
    \'\'\', (baby_id, date))
    
    return {
        "goals": goals,
        "completedGoals": completed_goals
    }

def complete_goal(baby_id, goal_id, date, stars):
    """标记目标为已完成"""
    # 检查是否已经完成
    existing = execute_query(
        "SELECT * FROM goal_completions WHERE baby_id = %s AND goal_id = %s AND completion_date = %s",
        (baby_id, goal_id, date)
    )
    
    if existing:
        # 更新星星数
        execute_update(
            "UPDATE goal_completions SET stars = %s WHERE baby_id = %s AND goal_id = %s AND completion_date = %s",
            (stars, baby_id, goal_id, date)
        )
        completion_id = existing[0]['id']
    else:
        # 添加新的完成记录
        completion_id = generate_id()
        execute_insert(
            "INSERT INTO goal_completions (id, goal_id, baby_id, completion_date, stars, created_at) VALUES (%s, %s, %s, %s, %s, %s)",
            (completion_id, goal_id, baby_id, date, stars, datetime.now())
        )
    
    # 更新每日统计
    update_daily_stats(baby_id, date)
    
    # 返回完成记录
    completions = execute_query("SELECT * FROM goal_completions WHERE id = %s", (completion_id,))
    return completions[0] if completions else None

def uncomplete_goal(baby_id, goal_id, date):
    """取消目标完成标记"""
    execute_update(
        "DELETE FROM goal_completions WHERE baby_id = %s AND goal_id = %s AND completion_date = %s",
        (baby_id, goal_id, date)
    )
    
    # 更新每日统计
    update_daily_stats(baby_id, date)
    
    return {"success": True}

def update_daily_stats(baby_id, date):
    """更新每日统计"""
    # 获取当天完成的目标数和星星数
    stats = execute_query(\'\'\'
        SELECT SUM(stars) as total_stars, COUNT(*) as completed_goals
        FROM goal_completions
        WHERE baby_id = %s AND completion_date = %s
    \'\'\', (baby_id, date))
    
    total_stars = stats[0]['total_stars'] or 0
    completed_goals = stats[0]['completed_goals'] or 0
    
    # 获取总目标数
    total_goals_result = execute_query(
        "SELECT COUNT(*) as total_goals FROM goals WHERE baby_id = %s",
        (baby_id,)
    )
    total_goals = total_goals_result[0]['total_goals'] if total_goals_result else 0
    
    # 检查是否已有当天的统计
    existing = execute_query(
        "SELECT * FROM daily_stats WHERE baby_id = %s AND date = %s",
        (baby_id, date)
    )
    
    if existing:
        # 更新现有统计
        execute_update(
            "UPDATE daily_stats SET total_stars = %s, completed_goals = %s, total_goals = %s, updated_at = %s WHERE baby_id = %s AND date = %s",
            (total_stars, completed_goals, total_goals, datetime.now(), baby_id, date)
        )
    else:
        # 添加新统计
        stat_id = generate_id()
        execute_insert(
            "INSERT INTO daily_stats (id, baby_id, date, total_stars, completed_goals, total_goals, created_at, updated_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (stat_id, baby_id, date, total_stars, completed_goals, total_goals, datetime.now(), datetime.now())
        )
    
    # 更新宝宝的总星星数
    update_baby_stars(baby_id)
    
    # 更新宝宝的连续打卡天数
    update_baby_streak(baby_id, date)

def update_baby_stars(baby_id):
    """更新宝宝的总星星数"""
    # 计算宝宝的总星星数
    stars_result = execute_query(
        "SELECT SUM(stars) as total_stars FROM goal_completions WHERE baby_id = %s",
        (baby_id,)
    )
    total_stars = stars_result[0]['total_stars'] or 0
    
    # 更新宝宝信息
    execute_update(
        "UPDATE babies SET stars = %s WHERE id = %s",
        (total_stars, baby_id)
    )

def update_baby_streak(baby_id, date):
    """更新宝宝的连续打卡天数"""
    try:
        # 获取宝宝当前的连续打卡天数
        baby_info = execute_query("SELECT streak FROM babies WHERE id = %s", (baby_id,))
        if not baby_info:
            return
        
        current_streak = baby_info[0]['streak']
        
        # 将日期转换为datetime对象
        current_date = datetime.strptime(date, '%Y-%m-%d').date()
        yesterday = current_date - timedelta(days=1)
        yesterday_str = yesterday.strftime('%Y-%m-%d')
        
        # 检查昨天是否有打卡记录
        yesterday_stats = execute_query(
            "SELECT * FROM daily_stats WHERE baby_id = %s AND date = %s AND completed_goals > 0",
            (baby_id, yesterday_str)
        )
        
        # 检查今天是否有完成的目标
        today_completions = execute_query(
            "SELECT COUNT(*) as count FROM goal_completions WHERE baby_id = %s AND completion_date = %s",
            (baby_id, date)
        )
        today_completed = today_completions[0]['count'] > 0
        
        # 更新连续打卡天数
        if today_completed:
            if yesterday_stats:
                # 昨天有打卡，连续天数+1
                new_streak = current_streak + 1
            else:
                # 昨天没打卡，重置为1
                new_streak = 1
                
            # 更新数据库
            execute_update(
                "UPDATE babies SET streak = %s WHERE id = %s",
                (new_streak, baby_id)
            )
            
            print(f"更新宝宝 {baby_id} 的连续打卡天数: {current_streak} -> {new_streak}")
    except Exception as e:
        print(f"更新连续打卡天数出错: {e}")

def get_month_stats(baby_id, year, month):
    """获取月度统计数据"""
    # 构建日期范围
    start_date = f"{year}-{int(month):02d}-01"
    
    # 获取月份的最后一天
    if int(month) in [4, 6, 9, 11]:
        last_day = 30
    elif int(month) == 2:
        # 简单处理闰年
        if int(year) % 4 == 0 and (int(year) % 100 != 0 or int(year) % 400 == 0):
            last_day = 29
        else:
            last_day = 28
    else:
        last_day = 31
    
    end_date = f"{year}-{int(month):02d}-{last_day}"
    
    # 获取月度统计数据
    daily_stats = execute_query(
        "SELECT * FROM daily_stats WHERE baby_id = %s AND date BETWEEN %s AND %s ORDER BY date",
        (baby_id, start_date, end_date)
    )
    
    # 创建完整的月份数据，包括没有记录的日期
    complete_stats = []
    existing_dates = {stat['date'].strftime('%Y-%m-%d'): stat for stat in daily_stats}
    
    for day in range(1, last_day + 1):
        date_str = f"{year}-{int(month):02d}-{day:02d}"
        if date_str in existing_dates:
            complete_stats.append(existing_dates[date_str])
        else:
            # 为没有记录的日期创建一个空记录，星星数量为0
            complete_stats.append({
                'id': None,
                'baby_id': baby_id,
                'date': datetime.strptime(date_str, '%Y-%m-%d').date(),
                'total_stars': 0,
                'completed_goals': 0,
                'total_goals': 0,
                'created_at': None,
                'updated_at': None
            })
    
    # 计算总星星数和有星星的天数
    total_stars = sum(stat['total_stars'] for stat in daily_stats)
    days_with_stars = sum(1 for stat in daily_stats if stat['total_stars'] > 0)
    
    return {
        "totalStars": total_stars,
        "daysWithStars": days_with_stars,
        "dailyStats": complete_stats
    }
''')
        
        # 创建app.py
        with open('api/app.py', 'w', encoding='utf-8') as f:
            f.write("""from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
from datetime import datetime, date
from api import goal_service
from api.db import execute_query

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 自定义JSON编码器，处理日期类型
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

app.json_encoder = CustomJSONEncoder

# 静态文件服务
@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join('frontend', path)):
        return send_from_directory('frontend', path)
    return send_from_directory('frontend', 'index.html')

# 上传文件服务
@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory('uploads', filename)

# API路由
@app.route('/api/babies', methods=['GET'])
def get_babies():
    try:
        babies = execute_query("SELECT * FROM babies")
        return jsonify(babies)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/babies/<baby_id>', methods=['GET'])
def get_baby(baby_id):
    try:
        babies = execute_query("SELECT * FROM babies WHERE id = %s", (baby_id,))
        if not babies:
            return jsonify({"error": "宝宝不存在"}), 404
        return jsonify(babies[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/babies/<baby_id>/goals/<date>', methods=['GET'])
def get_baby_goals_by_date(baby_id, date):
    try:
        result = goal_service.get_baby_goals_by_date(baby_id, date)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/babies/<baby_id>/goals/<goal_id>/complete', methods=['POST'])
def complete_goal(baby_id, goal_id):
    try:
        data = request.json
        stars = data.get('stars', 0)
        date = data.get('date')
        
        result = goal_service.complete_goal(baby_id, goal_id, date, stars)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/babies/<baby_id>/goals/<goal_id>/complete', methods=['DELETE'])
def uncomplete_goal(baby_id, goal_id):
    try:
        data = request.json
        date = data.get('date')
        
        result = goal_service.uncomplete_goal(baby_id, goal_id, date)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/babies/<baby_id>/stats/<year>/<month>', methods=['GET'])
def get_month_stats(baby_id, year, month):
    try:
        result = goal_service.get_month_stats(baby_id, year, month)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/babies/<baby_id>/streak', methods=['GET'])
def get_baby_streak(baby_id):
    try:
        result = execute_query("SELECT streak FROM babies WHERE id = %s", (baby_id,))
        if not result:
            return jsonify({"error": "宝宝不存在"}), 404
        return jsonify({"streak": result[0]['streak']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3000)
""")
        
        # 创建requirements.txt
        with open('requirements.txt', 'w', encoding='utf-8') as f:
            f.write("""flask==2.0.1
flask-cors==3.0.10
pymysql==1.0.2
cryptography==36.0.1
""")
        
        print("API文件创建成功")
    except Exception as e:
        print(f"创建API文件出错: {e}")

def update_database_structure():
    """更新数据库表结构"""
    try:
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # 检查babies表中是否已有streak字段
        cursor.execute("SHOW COLUMNS FROM babies LIKE 'streak'")
        if not cursor.fetchone():
            # 添加streak字段
            cursor.execute("ALTER TABLE babies ADD COLUMN streak INT DEFAULT 1")
            print("babies表添加streak字段成功")
        
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"更新数据库表结构出错: {e}")

def main():
    """主函数"""
    # 创建data目录
    os.makedirs('data', exist_ok=True)
    
    # 创建数据库表
    create_tables()
    
    # 更新数据库表结构
    update_database_structure()
    
    # 导入宝宝数据
    import_babies_data()
    
    # 创建API文件
    create_api_files()
    
    print("\n设置完成！请按照以下步骤运行API服务器：")
    print("1. 安装所需的Python包：pip install -r requirements.txt")
    print("2. 运行API服务器：python api/app.py")
    print("3. 访问应用：http://localhost:3000")

if __name__ == "__main__":
    main()