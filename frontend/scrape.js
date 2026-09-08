const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  
  await page.goto('http://localhost:3000');
  
  await new Promise(r => setTimeout(r, 2000));
  
  const html = await page.evaluate(() => {
    const sel = document.querySelector('select[name="category"]');
    return sel ? sel.innerHTML : 'NOT_FOUND';
  });
  
  console.log('DROPDOWN_HTML:\n', html);
  await browser.close();
})();
