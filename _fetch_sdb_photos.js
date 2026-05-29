const fs = require('fs');

// ── Nationality mapping: our country → TheSportsDB strNationality values ──
const NAT = {
  "Argentina":   ["Argentina","Argentinian","Argentine"],
  "Australia":   ["Australia","Australian"],
  "Belgium":     ["Belgium","Belgian"],
  "Brazil":      ["Brazil","Brazilian"],
  "Canada":      ["Canada","Canadian"],
  "Croatia":     ["Croatia","Croatian"],
  "Ecuador":     ["Ecuador","Ecuadorian"],
  "England":     ["England","English"],
  "France":      ["France","French"],
  "Germany":     ["Germany","German"],
  "Ghana":       ["Ghana","Ghanaian"],
  "Iran":        ["Iran","Iranian"],
  "Japan":       ["Japan","Japanese"],
  "Mexico":      ["Mexico","Mexican"],
  "Morocco":     ["Morocco","Moroccan"],
  "Netherlands": ["Netherlands","Dutch","Holland"],
  "Portugal":    ["Portugal","Portuguese"],
  "Qatar":       ["Qatar","Qatari"],
  "Saudi Arabia":["Saudi Arabia","Saudi","Saudi Arabian"],
  "Senegal":     ["Senegal","Senegalese"],
  "South Korea": ["South Korea","Korean","Republic of Korea"],
  "Spain":       ["Spain","Spanish"],
  "Switzerland": ["Switzerland","Swiss"],
  "Tunisia":     ["Tunisia","Tunisian"],
  "Uruguay":     ["Uruguay","Uruguayan"],
  "USA":         ["USA","American","United States","United States of America"],
};

function natMatch(country, sdbNat) {
  const allowed = NAT[country] || [country];
  return allowed.some(n => (sdbNat||'').toLowerCase().includes(n.toLowerCase()));
}

async function run() {
  const html = fs.readFileSync('index.html', 'utf8');
  const playerRe = /\{name:"([^"]+)",country:"([^"]+)",code:"[^"]+",pos:"([^"]+)",club:"([^"]+)",d:(\d),wiki:"([^"]+)"\}/g;
  const players = [];
  let m;
  while ((m = playerRe.exec(html)) !== null) {
    players.push({ name:m[1], country:m[2], pos:m[3], club:m[4], d:parseInt(m[5]), wiki:m[6] });
  }
  console.log(`Found ${players.length} players\n`);

  const results = { matched:[], noNatMatch:[], notFound:[], errors:[] };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    process.stdout.write(`\r[${i+1}/${players.length}] ${p.name.padEnd(30)}`);
    try {
      const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(p.name)}`;
      const res = await fetch(url);
      const data = await res.json();
      const list = data.player || [];

      if (list.length === 0) {
        results.notFound.push({ name:p.name, country:p.country });
      } else {
        // Only nationality matters — club is NOT used (data is 4 years old)
        const match = list.find(r => natMatch(p.country, r.strNationality));

        if (match && match.strThumb) {
          results.matched.push({
            name: p.name, country: p.country,
            sdbName: match.strPlayer,
            sdbNat: match.strNationality,
            sdbTeam: match.strTeam,   // logged for info only, not used for matching
            photo: match.strThumb
          });
        } else if (match && !match.strThumb) {
          results.notFound.push({
            name:p.name, country:p.country,
            reason:'nationality matched but no photo',
            sdbName:match.strPlayer
          });
        } else {
          // No nationality match — log candidates for manual review
          results.noNatMatch.push({
            name: p.name, country: p.country,
            candidates: list.slice(0,3).map(r => ({
              sdbName: r.strPlayer, sdbNat: r.strNationality, hasPhoto: !!r.strThumb
            }))
          });
        }
      }
    } catch(e) {
      results.errors.push({ name:p.name, error:e.message });
    }
    await sleep(650);
  }

  console.log('\n\n── RESULTS ──');
  console.log(`Matched (nationality confirmed): ${results.matched.length}`);
  console.log(`No nationality match:           ${results.noNatMatch.length}`);
  console.log(`Not found / no photo:           ${results.notFound.length}`);
  console.log(`Errors:                         ${results.errors.length}`);

  fs.writeFileSync('_sdb_matched.json',      JSON.stringify(results.matched,    null, 2));
  fs.writeFileSync('_sdb_no_nat_match.json', JSON.stringify(results.noNatMatch, null, 2));
  fs.writeFileSync('_sdb_not_found.json',    JSON.stringify(results.notFound,   null, 2));
  if (results.errors.length)
    fs.writeFileSync('_sdb_errors.json',     JSON.stringify(results.errors,     null, 2));

  console.log('\nFiles: _sdb_matched.json  _sdb_no_nat_match.json  _sdb_not_found.json');
}

run().catch(console.error);
