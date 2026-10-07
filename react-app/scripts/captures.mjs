// Captures F3 + scénarios F1 dans un vrai Chrome (puppeteer-core, sans navigateur téléchargé).
// Prérequis : npm run build && npm run preview (port 4173) dans un autre terminal.
// Lance : npm run captures   (CHROME_PATH=... pour un autre chemin de Chrome/Edge)
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const OUT = fileURLToPath(new URL('../preuves/', import.meta.url))
const URL_APP = 'http://localhost:4173/'
const CHROME =
  process.env.CHROME_PATH ??
  (process.platform === 'win32'
    ? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
    : process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : '/usr/bin/google-chrome')

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
const page = await browser.newPage()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

for (const width of [360, 1280]) {
  await page.setViewport({ width, height: width === 360 ? 780 : 900, deviceScaleFactor: 1 })
  await page.goto(URL_APP, { waitUntil: 'networkidle0' })
  await page.waitForFunction(() => document.body.innerText.includes('6 séances affichées'))
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  console.log(`${width}px : débordement horizontal = ${overflow}px`)
  await page.screenshot({ path: `${OUT}capture-${width}px.png`, fullPage: true })
  await page.click('article button')
  await page.waitForSelector('[role=dialog]')
  const focused = await page.evaluate(() => document.activeElement.getAttribute('aria-label'))
  console.log(`${width}px : focus à l'ouverture du détail = "${focused}"`)
  await page.screenshot({ path: `${OUT}capture-${width}px-detail.png` })
  await page.keyboard.press('Escape')
  const back = await page.evaluate(() => document.activeElement.textContent)
  console.log(`${width}px : focus après Échap = "${back}"`)
}

// scénario F1 dans le vrai navigateur : réponses dans le désordre
await page.setViewport({ width: 1280, height: 900 })
await page.goto(URL_APP + '?scenario=desordre', { waitUntil: 'networkidle0' })
await page.waitForFunction(() => document.body.innerText.includes('séances affichées'))
const t0 = Date.now()
await page.select('#filter-group', 'A')
await sleep(100)
await page.select('#filter-group', 'B')
await sleep(800 - (Date.now() - t0))
const at800 = await page.evaluate(() => [document.querySelector('#filter-group').value, [...document.querySelectorAll('article h3')].map((h) => h.textContent)])
console.log(`désordre, t≈800ms : filtre=${at800[0]} cartes=${JSON.stringify(at800[1])}`)
await sleep(500)
const later = await page.evaluate(() => [...document.querySelectorAll('article h3')].map((h) => h.textContent))
console.log(`désordre, t≈1300ms (A a répondu) : cartes=${JSON.stringify(later)}`)
await page.screenshot({ path: `${OUT}scenario-desordre-B.png` })

// scénario erreur puis réessayer
await page.goto(URL_APP + '?scenario=erreur', { waitUntil: 'networkidle0' })
await page.waitForSelector('[role=alert]')
await page.screenshot({ path: `${OUT}scenario-erreur.png` })
await page.click('[role=alert] button')
await page.waitForFunction(() => document.body.innerText.includes('6 séances affichées'))
console.log('erreur : alerte affichée, puis "Réessayer" -> 6 séances affichées')
await browser.close()
