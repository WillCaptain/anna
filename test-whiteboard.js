/**
 * 测试白板功能的自动化脚本
 * 1. 访问首页
 * 2. 点击 Whiteboard 卡片
 * 3. 等待白板加载
 * 4. 捕获控制台错误
 * 5. 尝试创建矩形形状
 */

import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: false, // 显示浏览器窗口
    devtools: true,  // 自动打开开发者工具
    args: ['--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  // 收集所有控制台消息
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();
    consoleMessages.push({ type, text, location });
    console.log(`[${type.toUpperCase()}] ${text}`);
    if (type === 'error') {
      errors.push({ text, location });
    }
  });

  // 捕获页面错误（带堆栈）
  page.on('pageerror', error => {
    console.log('\n❌ PAGE ERROR:');
    console.log('Message:', error.message);
    console.log('Stack:', error.stack);
    errors.push({
      text: error.message,
      stack: error.stack,
      type: 'pageerror'
    });
  });

  // 捕获请求失败
  page.on('requestfailed', request => {
    console.log('\n❌ REQUEST FAILED:');
    console.log('URL:', request.url());
    console.log('Error:', request.failure().errorText);
  });

  try {
    console.log('=== 步骤 1: 访问首页 ===\n');
    await page.goto('http://localhost:8081/', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    console.log('首页加载完成，等待 2 秒...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 截图首页
    await page.screenshot({ 
      path: 'test-whiteboard-1-home.png',
      fullPage: true 
    });
    console.log('✓ 首页截图已保存: test-whiteboard-1-home.png\n');
    
    console.log('=== 步骤 2: 点击 Whiteboard 卡片 ===\n');
    
    // 查找并点击 Whiteboard 卡片
    const whiteboardCard = await page.$('#open-whiteboard');
    if (!whiteboardCard) {
      console.error('❌ 未找到 Whiteboard 卡片！');
      await browser.close();
      return;
    }
    
    console.log('找到 Whiteboard 卡片，准备点击...');
    await whiteboardCard.click();
    
    console.log('已点击，等待白板页面加载...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('=== 步骤 3: 检查白板页面状态 ===\n');
    
    // 检查白板元素是否存在
    const canvasDiv = await page.$('#canvas-div');
    const toolbar = await page.$('#toolbar');
    const leftPanel = await page.$('#left-panel');
    const statusbar = await page.$('#statusbar');
    
    console.log('页面元素检查:');
    console.log('  - 画布 (#canvas-div):', canvasDiv ? '✓ 存在' : '✗ 不存在');
    console.log('  - 工具栏 (#toolbar):', toolbar ? '✓ 存在' : '✗ 不存在');
    console.log('  - 左侧面板 (#left-panel):', leftPanel ? '✓ 存在' : '✗ 不存在');
    console.log('  - 状态栏 (#statusbar):', statusbar ? '✓ 存在' : '✗ 不存在');
    console.log();
    
    // 截图白板页面
    await page.screenshot({ 
      path: 'test-whiteboard-2-loaded.png',
      fullPage: true 
    });
    console.log('✓ 白板页面截图已保存: test-whiteboard-2-loaded.png\n');
    
    console.log('=== 步骤 4: 尝试创建矩形形状 ===\n');
    
    // 点击矩形工具按钮
    const rectangleButton = await page.$('.shape-item[data-tool="rectangle"]');
    if (!rectangleButton) {
      console.error('❌ 未找到矩形工具按钮！');
    } else {
      console.log('找到矩形工具按钮，点击激活...');
      await rectangleButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 在画布上拖拽创建矩形
      if (canvasDiv) {
        console.log('在画布上拖拽创建矩形...');
        const canvasBox = await canvasDiv.boundingBox();
        if (canvasBox) {
          const startX = canvasBox.x + 200;
          const startY = canvasBox.y + 200;
          const endX = startX + 150;
          const endY = startY + 100;
          
          await page.mouse.move(startX, startY);
          await page.mouse.down();
          await page.mouse.move(endX, endY, { steps: 10 });
          await page.mouse.up();
          
          console.log('拖拽完成，等待形状创建...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 截图创建后的状态
          await page.screenshot({ 
            path: 'test-whiteboard-3-shape-created.png',
            fullPage: true 
          });
          console.log('✓ 创建形状后截图已保存: test-whiteboard-3-shape-created.png\n');
          
          // 检查状态栏中的形状计数
          const statusShapes = await page.$eval('#status-shapes', el => el.textContent).catch(() => null);
          console.log('状态栏形状计数:', statusShapes || '无法读取');
        }
      }
    }
    
    console.log('\n=== 控制台错误汇总 ===\n');
    
    if (errors.length === 0) {
      console.log('✓ 没有发现 JavaScript 错误！');
    } else {
      console.log(`❌ 发现 ${errors.length} 个错误:\n`);
      errors.forEach((err, i) => {
        console.log(`错误 ${i + 1}:`);
        console.log('  消息:', err.text);
        if (err.stack) {
          console.log('  堆栈:', err.stack);
        }
        if (err.location) {
          console.log('  位置:', err.location);
        }
        console.log();
      });
    }
    
    // 统计所有消息
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    console.log('\n=== 统计 ===');
    console.log(`总消息数: ${consoleMessages.length}`);
    console.log(`错误数: ${errors.length}`);
    console.log(`警告数: ${warnings.length}`);
    
  } catch (error) {
    console.error('\n❌ 执行过程中出错:', error);
  }

  console.log('\n浏览器保持打开状态，按 Ctrl+C 关闭...');
  console.log('请在浏览器中查看开发者工具的控制台以获取更详细的错误信息。');
})();
