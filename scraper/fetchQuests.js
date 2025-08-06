const puppeteer = require('puppeteer');

async function fetchQuests() {
  let browser;

  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    );

    await page.goto('https://info.monsterhunter.com/wilds/event-quest/fr/schedule', {
      waitUntil: 'domcontentloaded',
    });

    await page.waitForSelector('tr.t1', { timeout: 15000 });

    const quests = await page.$$eval('tr.t1', rows => {
      return rows.map(row => {
        const getText = (sel) => row.querySelector(sel)?.textContent?.trim() || '';
        const getAttr = (sel, attr) => row.querySelector(sel)?.getAttribute(attr) || '';
        const getTextByLabel = (label) => {
          const li = [...row.querySelectorAll('td.overview li')].find(el =>
            el.textContent.includes(label)
          );
          return li ? li.querySelector('.overview_dd')?.textContent?.replace(/^:/, '').trim() : '';
        };

        return {
          image: getAttr('td.image img', 'src'),
          difficulty: getText('td.level span'),
          title: getText('td.quest .title > span'),
          summary: getText('p.txt'),
          region: getTextByLabel('Régions'),
          conditions: getTextByLabel('Conditions'),
          completion: getTextByLabel('Conditions de complétion'),
          start: getTextByLabel('Date et heure de commencement'),
          end: getTextByLabel('Date et heure de fin'),
        };
      });
    });

    console.log(`✅ ${quests.length} quêtes extraites`);
    return quests;

  } catch (error) {
    console.error('❌ Erreur dans fetchQuests :', error);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = fetchQuests;
