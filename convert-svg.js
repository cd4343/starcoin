const fs = require('fs');
const path = require('path');
const svg2png = require('svg2png');

const iconsDir = path.join(__dirname, 'frontend', 'images', 'goals');

// 读取目录中的所有SVG文件
fs.readdir(iconsDir, (err, files) => {
  if (err) {
    console.error('读取目录失败:', err);
    return;
  }

  // 过滤出SVG文件
  const svgFiles = files.filter(file => file.endsWith('.png') && fs.readFileSync(path.join(iconsDir, file), 'utf8').includes('<svg'));

  console.log(`找到 ${svgFiles.length} 个SVG文件需要转换`);

  // 转换每个SVG文件
  svgFiles.forEach(file => {
    const filePath = path.join(iconsDir, file);
    const svgBuffer = fs.readFileSync(filePath);
    
    // 转换为PNG，设置宽度为512像素
    svg2png(svgBuffer, { width: 512, height: 512 })
      .then(pngBuffer => {
        // 保存PNG文件
        fs.writeFileSync(filePath, pngBuffer);
        console.log(`已转换: ${file}`);
      })
      .catch(err => {
        console.error(`转换失败 ${file}:`, err);
      });
  });
}); 