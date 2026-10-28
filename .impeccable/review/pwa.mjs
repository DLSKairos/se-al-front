import { chromium } from '/Users/davidlamp/dev/señal/se-al-front/node_modules/playwright-core/index.mjs'
const IOS='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const AND='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36'
const b = await chromium.launch({ channel: 'chrome' })
async function shot(name, ua, fire, path='/login') {
  const ctx = await b.newContext({ viewport:{width:390,height:844}, deviceScaleFactor:2, userAgent:ua, ignoreHTTPSErrors:true, hasTouch:true, isMobile:true, serviceWorkers:'block' })
  if (fire) await ctx.addInitScript(() => { setTimeout(()=>window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'),{prompt:async()=>{},userChoice:Promise.resolve({outcome:'accepted'})})),300) })
  await ctx.route(/\/api\//, r=>r.fulfill({status:200,contentType:'application/json',body:'{"success":true,"data":[]}'}))
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message))
  await p.goto('https://localhost:4000'+path,{waitUntil:'networkidle'}); await p.waitForTimeout(2600)
  await p.screenshot({path:`/Users/davidlamp/dev/señal/se-al-front/.impeccable/review/${name}.png`})
  console.log(name, errs.filter(e=>!/ServiceWorker/.test(e)).join('|')||'ok'); await ctx.close()
}
await shot('pwa-ios', IOS, false)
await shot('pwa-android', AND, true)
await shot('pwa-installed', AND, false)
await shot('pwa-exempt', AND, false, '/firma/abc')
await b.close()
