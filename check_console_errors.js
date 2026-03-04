// 使用 Puppeteer 检查页面控制台错误
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // 收集控制台消息
  const consoleMessages = [];
  
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({
      type: type,
      text: text,
      location: msg.location()
    });
  });
  
  // 收集页面错误
  const pageErrors = [];
  
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });
  
  // 导航到页面
  console.log('正在打开 http://localhost:8080/ ...');
  await page.goto('http://localhost:8080/', {
    waitUntil: 'networkidle0',
    timeout: 10000
  });
  
  // 等待3秒
  console.log('等待3秒...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 截图
  await page.screenshot({ path: 'page_screenshot.png', fullPage: true });
  console.log('截图已保存到 page_screenshot.png');
  
  // 输出所有错误
  console.log('\n=== 控制台消息 ===');
  consoleMessages.forEach((msg, index) => {
    if (msg.type === 'error' || msg.type === 'warning') {
      console.log(`\n[${index + 1}] 类型: ${msg.type}`);
      console.log(`消息: ${msg.text}`);
      if (msg.location) {
        console.log(`位置: ${msg.location.url} (行 ${msg.location.lineNumber}:${msg.location.columnNumber})`);
      }
    }
  });
  
  console.log('\n=== 页面错误 ===');
  pageErrors.forEach((error, index) => {
    console.log(`\n[${index + 1}] ${error.message}`);
    console.log(error.stack);
  });
  
  // 保持浏览器打开以便查看
  console.log('\n浏览器保持打开状态，按 Ctrl+C 关闭...');
  
})();
