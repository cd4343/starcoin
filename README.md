# Star Coin 项目

一个儿童任务管理和奖励系统。

## 安装步骤

1. 克隆项目到本地：
```bash
git clone [你的仓库地址]
cd star-coin
```

2. 安装依赖：
```bash
npm install
```

## 运行项目

```bash
npm start
```

或者使用批处理文件：
```bash
start-server.bat
```

## 项目结构

- `backend/` - 后端路由和API
- `frontend/` - 前端页面、样式和脚本
- `data/` - 数据文件
- `sql/` - 数据库脚本

## 注意事项

- `node_modules/` 文件夹不包含在仓库中，需要运行 `npm install` 来安装依赖
- 用户上传的文件存储在 `frontend/uploads/` 中，不会被提交到仓库 