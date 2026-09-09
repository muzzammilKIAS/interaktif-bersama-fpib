const {chromium}=require('/tmp/arabic-chess-check/node_modules/playwright');
const assert=require('node:assert/strict');

(async()=>{
  const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://localhost:8088');
  await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('[data-launch]').count(),3);
  assert.equal(await page.locator('img[alt="Logo rasmi KIAS"]').evaluate(img=>img.naturalWidth>0),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),1440);
  await page.screenshot({path:'/tmp/fpib-portal-home.png',fullPage:true});

  const games=[
    ['arabic-chess','Arabic Chess'],
    ['misi-mencari-hikmah','Misi Pencari Hikmah'],
    ['sirah-journey','Sirah Journey Challenge']
  ];
  for(const [id,title] of games){
    await page.locator(`[data-launch="${id}"]`).click();
    await page.waitForFunction(({id,title})=>{
      const iframe=document.getElementById('game-frame');
      return iframe.contentWindow.location.pathname.includes(id)&&new RegExp(title,'i').test(iframe.contentDocument.title);
    },{id,title});
    assert.match(await page.locator('#game-frame').evaluate(el=>el.contentDocument.title),new RegExp(title,'i'));
    assert.equal(await page.locator('#game-stage').isVisible(),true);
    assert.equal(await page.locator('#stage-loading').evaluate(el=>el.classList.contains('done')),true);
    await page.locator('#back-home').click();
    await page.waitForTimeout(120);
    assert.equal(await page.locator('#game-stage').isHidden(),true);
  }

  await page.locator('[data-launch="arabic-chess"]').click();
  await page.locator('#reload-game').click();
  await page.locator('#game-frame').waitFor({state:'attached'});
  const popupPromise=page.waitForEvent('popup');
  await page.locator('#open-game').click();
  const popup=await popupPromise;
  await popup.waitForLoadState('domcontentloaded');
  assert.match(await popup.title(),/Arabic Chess/i);
  await popup.close();
  await page.locator('#back-home').click();

  for(const width of [320,390,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    await page.goto('http://localhost:8088');
    await page.waitForTimeout(250);
    const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
    if(scrollWidth!==width)console.log('Overflow',width,await page.evaluate(()=>[...document.querySelectorAll('*')].map(el=>({tag:el.tagName,cls:el.className,rect:el.getBoundingClientRect().toJSON()})).filter(x=>x.rect.right>innerWidth+1||x.rect.left<-1).slice(0,20)));
    assert.equal(scrollWidth,width,`overflow at ${width}`);
  }
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'/tmp/fpib-portal-mobile.png',fullPage:true});

  await page.goto('http://localhost:8088/#game=sirah-journey');
  await page.waitForTimeout(350);
  assert.equal(await page.locator('#game-stage').isVisible(),true);
  assert.match(await page.locator('#current-game').innerText(),/Sirah Journey/);
  await page.locator('#back-home').click();
  await page.waitForTimeout(150);
  assert.equal(await page.locator('#game-stage').isHidden(),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: portal UI, official logo, 3 launchers, embedded games, return/reset/new-tab controls, URL state, and responsive widths.');

  await page.goto('http://localhost:8088');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForTimeout(1200);
  const cached=await page.evaluate(async()=>{
    const paths=['style.css','games/arabic-chess/app.js','games/misi-mencari-hikmah/index.html','games/sirah-journey/questions.js'];
    return Promise.all(paths.map(async path=>!!await caches.match(new URL(path,location.href).href)));
  });
  assert.deepEqual(cached,[true,true,true,true]);
  await context.setOffline(true);
  await page.reload();
  assert.equal(await page.locator('[data-launch]').count(),3);
  for(const [id,title] of games){
    await page.locator(`[data-launch="${id}"]`).click();
    await page.waitForTimeout(500);
    assert.match(await page.locator('#game-frame').evaluate(el=>el.contentDocument.title),new RegExp(title,'i'));
    await page.locator('#back-home').click();
    await page.waitForTimeout(100);
  }
  console.log('PASS: portal and all 3 games open offline.');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
