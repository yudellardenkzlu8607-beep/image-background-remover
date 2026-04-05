const fs = require('fs');
const { createCanvas } = require('canvas');

// 创建画布
const width = 1200;
const height = 630;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// 渐变背景
const gradient = ctx.createLinearGradient(0, 0, width, height);
gradient.addColorStop(0, '#667eea');
gradient.addColorStop(1, '#764ba2');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// 居中对齐
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// 绘制 emoji 图标
ctx.font = '120px sans-serif';
ctx.fillText('🖼️', width / 2, height / 2 - 120);

// 绘制主标题
ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
ctx.fillStyle = '#ffffff';
ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
ctx.shadowBlur = 4;
ctx.shadowOffsetX = 2;
ctx.shadowOffsetY = 2;
ctx.fillText('Image Background Remover', width / 2, height / 2 - 20);

// 绘制副标题
ctx.font = '28px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
ctx.shadowColor = 'transparent';
ctx.fillText('AI 去除图片背景 · 1 秒完成 · 永久免费', width / 2, height / 2 + 40);

// 绘制网址
ctx.font = '24px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
ctx.fillText('image-background-remover.space', width / 2, height - 50);

// 保存为 PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('public/og-image.png', buffer);

console.log('✅ OG 图片已生成: public/og-image.png');
