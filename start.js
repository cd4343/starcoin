const { exec } = require('child_process');
const path = require('path');

// 启动服务器
const server = exec('node server.js', (error) => {
    if (error) {
        console.error('启动服务器失败:', error);
        return;
    }
});

// 输出服务器日志
server.stdout.on('data', (data) => {
    console.log(data);
});

server.stderr.on('data', (data) => {
    console.error(data);
});

// 自动打开浏览器
const url = 'http://localhost:3000';
const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
exec(`${start} ${url}`); 