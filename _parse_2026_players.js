// ── 2026 Squad Lists PDF Parser — proximity-based columns ───
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const fs = require('fs');

const COUNTRY_MAP = {
  ALG:{country:'Algeria',       code:'dz'}, ARG:{country:'Argentina',   code:'ar'},
  AUS:{country:'Australia',     code:'au'}, AUT:{country:'Austria',     code:'at'},
  BEL:{country:'Belgium',       code:'be'}, BIH:{country:'Bosnia',      code:'ba'},
  BRA:{country:'Brazil',        code:'br'}, CAN:{country:'Canada',      code:'ca'},
  CPV:{country:'Cape Verde',    code:'cv'}, COL:{country:'Colombia',    code:'co'},
  COD:{country:'DR Congo',      code:'cd'}, ECU:{country:'Ecuador',     code:'ec'},
  EGY:{country:'Egypt',         code:'eg'}, ENG:{country:'England',     code:'gb-eng'},
  FRA:{country:'France',        code:'fr'}, GER:{country:'Germany',     code:'de'},
  GHA:{country:'Ghana',         code:'gh'}, HTI:{country:'Haiti',       code:'ht'},
  HAI:{country:'Haiti',         code:'ht'}, IRN:{country:'Iran',        code:'ir'},
  IRQ:{country:'Iraq',          code:'iq'}, CIV:{country:'Ivory Coast', code:'ci'},
  JPN:{country:'Japan',         code:'jp'}, JOR:{country:'Jordan',      code:'jo'},
  MEX:{country:'Mexico',        code:'mx'}, MAR:{country:'Morocco',     code:'ma'},
  NED:{country:'Netherlands',   code:'nl'}, NZL:{country:'New Zealand', code:'nz'},
  NOR:{country:'Norway',        code:'no'}, PAN:{country:'Panama',      code:'pa'},
  PRY:{country:'Paraguay',      code:'py'}, PAR:{country:'Paraguay',    code:'py'},
  POR:{country:'Portugal',      code:'pt'}, QAT:{country:'Qatar',       code:'qa'},
  KSA:{country:'Saudi Arabia',  code:'sa'}, SCO:{country:'Scotland',    code:'gb-sct'},
  SEN:{country:'Senegal',       code:'sn'}, ZAF:{country:'South Africa',code:'za'},
  RSA:{country:'South Africa',  code:'za'}, KOR:{country:'South Korea', code:'kr'},
  ESP:{country:'Spain',         code:'es'}, SWE:{country:'Sweden',      code:'se'},
  SUI:{country:'Switzerland',   code:'ch'}, TUN:{country:'Tunisia',     code:'tn'},
  TUR:{country:'Turkiye',       code:'tr'}, URU:{country:'Uruguay',     code:'uy'},
  USA:{country:'USA',           code:'us'}, UZB:{country:'Uzbekistan',  code:'uz'},
  CRO:{country:'Croatia',       code:'hr'}, CUW:{country:'Curaçao',     code:'cw'},
  CZE:{country:'Czechia',       code:'cz'},
};

const POS_MAP = { GK:'Goalkeeper', DF:'Defender', MF:'Midfielder', FW:'Forward' };

function properCase(s) {
  return (s||'').replace(/\b[\wÀ-ÿ]+/g, w => {
    const lower = ['de','da','di','do','dos','van','von','der','el','al','bin','ben','le','la'];
    if (lower.includes(w.toLowerCase())) return w.toLowerCase();
    // Handle accented first char
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).trim();
}

function stripClubCountry(club) {
  return (club||'').replace(/\s*\([A-Z]{2,3}\)\s*$/, '').trim();
}

function groupByRow(items) {
  const rows = [];
  for (const item of items) {
    const existing = rows.find(r => Math.abs(r.y - item.y) <= 2);
    if (existing) existing.items.push(item);
    else rows.push({ y: item.y, items: [item] });
  }
  return rows.sort((a,b) => b.y - a.y);
}

// Assign each item to the column whose header is closest to the item's right
// i.e. find min(col.x - item.x) where col.x >= item.x - 10
function assignCols(rowItems, columns) {
  const result = {};
  columns.forEach(c => result[c.name] = []);

  for (const item of rowItems) {
    if (item.x < 27) continue; // skip POS/shirt-number items

    let bestCol = null, bestDist = Infinity;
    for (const col of columns) {
      const dist = col.x - item.x; // positive = column header is to the right of item
      // Accept columns whose header is at most 10px to the LEFT of the item
      // (data can start slightly past the header label)
      if (dist >= -10 && dist < bestDist) {
        bestDist = dist;
        bestCol = col.name;
      }
    }
    if (bestCol !== null) result[bestCol].push(item.str.trim());
  }

  const out = {};
  Object.entries(result).forEach(([k,v]) => out[k] = v.join(' ').trim());
  return out;
}

async function run() {
  const doc = await pdfjsLib.getDocument('SquadLists-English.pdf').promise;
  console.log(`Pages: ${doc.numPages}`);

  const allPlayers = [];
  const pageErrors = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    const items = content.items
      .filter(i => i.str && i.str.trim())
      .map(i => ({ str: i.str.trim(), x: Math.round(i.transform[4]), y: Math.round(i.transform[5]) }));

    const fullText = items.map(i => i.str).join(' ');
    const headerMatch = fullText.match(/\(([A-Z]{2,3})\)/);
    if (!headerMatch) { pageErrors.push(`Page ${pageNum}: no country code`); continue; }

    const fifaCode = headerMatch[1];
    const countryInfo = COUNTRY_MAP[fifaCode];
    if (!countryInfo) { pageErrors.push(`Page ${pageNum}: unknown code ${fifaCode}`); continue; }

    const rows = groupByRow(items);

    // Find the header row
    const headerRow = rows.find(r =>
      r.items.some(i => i.str.includes('FIRST')) &&
      r.items.some(i => i.str.includes('DOB'))
    );
    if (!headerRow) { pageErrors.push(`Page ${pageNum}: no header row`); continue; }

    // Build column map from header (only the columns we care about)
    const colDefs = [
      { name:'playerName', keywords:['PLAYER NAME','PLAYER'] },
      { name:'firstName',  keywords:['FIRST NAME','FIRST'] },
      { name:'lastName',   keywords:['LAST NAME','LAST'] },
      { name:'shirt',      keywords:['NAME ON SHIRT','SHIRT'] },
      { name:'dob',        keywords:['DOB'] },
      { name:'club',       keywords:['CLUB'] },
      { name:'height',     keywords:['HEIGHT'] },
    ];

    const columns = [];
    for (const def of colDefs) {
      const item = headerRow.items.find(i => def.keywords.some(k => i.str.includes(k)));
      if (item) columns.push({ name: def.name, x: item.x });
    }
    columns.sort((a,b) => a.x - b.x);

    if (columns.length < 4) { pageErrors.push(`Page ${pageNum}: insufficient columns (${columns.length})`); continue; }

    let count = 0;
    for (const row of rows) {
      // Check for POS token
      const posItem = row.items.find(i => POS_MAP[i.str] && i.x >= 15 && i.x <= 26);
      if (!posItem) continue;

      const cols = assignCols(row.items, columns);

      const firstNames = cols.firstName || '';
      const lastNames  = cols.lastName  || '';
      const dob        = cols.dob       || '';
      const clubRaw    = cols.club      || '';

      if (!dob.match(/\d{2}\/\d{2}\/\d{4}/)) continue;
      if (!firstNames && !lastNames) continue;

      // Build name: first given name + full last name (proper case)
      const firstName = properCase((firstNames).split(/\s+/)[0] || '');
      const lastName  = properCase(lastNames || '');
      const name = `${firstName} ${lastName}`.trim();
      const club = stripClubCountry(clubRaw);

      if (name.length < 4) continue;

      allPlayers.push({
        name,
        country: countryInfo.country,
        code:    countryInfo.code,
        pos:     POS_MAP[posItem.str],
        club:    club || 'Unknown',
        d: 3,
        wiki: name.replace(/ /g, '_'),
      });
      count++;
    }

    console.log(`Page ${pageNum}: ${countryInfo.country} — ${count} players`);
  }

  fs.writeFileSync('_2026_players_raw.json', JSON.stringify(allPlayers, null, 2));
  console.log(`\nTotal: ${allPlayers.length} players`);
  if (pageErrors.length) { console.log('Errors:'); pageErrors.forEach(e => console.log(' ', e)); }
  console.log('Saved → _2026_players_raw.json');
}

run().catch(console.error);
