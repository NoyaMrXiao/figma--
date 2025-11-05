// 生成 Figma 插件图标
// 将 SVG 转换为 128x128 PNG

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检查是否安装了 sharp
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (error) {
  console.error('❌ 需要安装 sharp 库来生成图标');
  console.log('请运行: npm install --save-dev sharp');
  console.log('\n或者使用在线工具手动转换:');
  console.log('1. 打开 icon.svg 文件');
  console.log('2. 使用在线 SVG 转 PNG 工具（如 https://convertio.co/svg-png/）');
  console.log('3. 设置为 128x128 像素');
  console.log('4. 保存为 icon.png 到插件目录');
  process.exit(1);
}

const svgPath = path.join(__dirname, 'icon.svg');
const pngPath = path.join(__dirname, 'icon.png');

try {
  // 读取 SVG 文件
  const svgBuffer = fs.readFileSync(svgPath);
  
  // 转换为 PNG
  await sharp(svgBuffer)
    .resize(128, 128)
    .png()
    .toFile(pngPath);
  
  console.log('✅ 图标已生成: icon.png (128x128)');
} catch (error) {
  console.error('❌ 生成图标失败:', error.message);
  process.exit(1);
}

