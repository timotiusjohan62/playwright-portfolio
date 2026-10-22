   const fs = require('fs'), path = require('path');
   const DIR = 'allure-results';
   const isTrace = (a) => a && a.source &&
     (a.type === 'application/vnd.allure.playwright-trace' || (/trace/i.test(a.name || '') && a.source.endsWith('.zip')));
   let removed = 0;
   const strip = (o) => {
     if (Array.isArray(o)) return o.filter((x) => !(isTrace(x) && (removed++, fs.rmSync(path.join(DIR, x.source), { force: true }), true))).map(strip);
     if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, strip(v)]));
     return o;
   };
   for (const f of fs.readdirSync(DIR).filter((f) => f.endsWith('-result.json'))) {
     const p = path.join(DIR, f);
     fs.writeFileSync(p, JSON.stringify(strip(JSON.parse(fs.readFileSync(p, 'utf8')))));
   }
   console.log(`Removed ${removed} trace attachment(s).`);