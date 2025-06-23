CREATE TABLE IF NOT EXISTS prizes (
    id INT PRIMARY KEY AUTO_INCREMENT COMMENT '礼品ID',
    name VARCHAR(100) NOT NULL COMMENT '礼品名称',
    description TEXT COMMENT '礼品描述',
    image_url VARCHAR(255) COMMENT '礼品图片URL',
    prize_type TINYINT NOT NULL DEFAULT 1 COMMENT '礼品类型：1实物，2虚拟物品，3积分',
    points_cost INT NOT NULL DEFAULT 0 COMMENT '所需积分',
    stock_quantity INT NOT NULL DEFAULT 0 COMMENT '库存数量',
    probability DECIMAL(5,4) NOT NULL DEFAULT 0 COMMENT '中奖概率',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0下架，1上架',
    start_time DATETIME COMMENT '开始时间',
    end_time DATETIME COMMENT '结束时间',
    daily_limit INT DEFAULT NULL COMMENT '每日限制数量',
    user_limit INT DEFAULT NULL COMMENT '每人限制数量',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='抽奖礼品表';

-- 创建索引
CREATE INDEX idx_status ON prizes(status);
CREATE INDEX idx_prize_type ON prizes(prize_type);
CREATE INDEX idx_points_cost ON prizes(points_cost);

-- 插入示例数据
INSERT INTO prizes (name, description, prize_type, points_cost, stock_quantity, probability, status) VALUES 
('星星玩偶', '可爱的星星造型毛绒玩具', 1, 100, 50, 0.1, 1),
('积分券500', '可兑换500积分', 3, 0, 1000, 0.3, 1),
('电子故事书', '儿童有声电子故事书', 2, 200, 30, 0.05, 1),
('小星星徽章', '闪亮的星星造型徽章', 1, 50, 100, 0.15, 1),
('惊喜盲盒', '随机玩具惊喜盲盒', 1, 150, 40, 0.08, 1); 