const fs=require('fs');
const text=fs.readFileSync('_pdftext.txt','utf8');
const pages=text.split('---PAGE---').filter(p=>p.trim());

const FIFA_TO_META={
  ARG:{country:'Argentina',code:'ar'},AUS:{country:'Australia',code:'au'},
  BEL:{country:'Belgium',code:'be'},BRA:{country:'Brazil',code:'br'},
  CMR:{country:'Cameroon',code:'cm'},CAN:{country:'Canada',code:'ca'},
  CRC:{country:'Costa Rica',code:'cr'},CRO:{country:'Croatia',code:'hr'},
  DEN:{country:'Denmark',code:'dk'},ECU:{country:'Ecuador',code:'ec'},
  ENG:{country:'England',code:'gb-eng'},FRA:{country:'France',code:'fr'},
  GER:{country:'Germany',code:'de'},GHA:{country:'Ghana',code:'gh'},
  IRN:{country:'Iran',code:'ir'},JPN:{country:'Japan',code:'jp'},
  KOR:{country:'South Korea',code:'kr'},MEX:{country:'Mexico',code:'mx'},
  MAR:{country:'Morocco',code:'ma'},NED:{country:'Netherlands',code:'nl'},
  POL:{country:'Poland',code:'pl'},POR:{country:'Portugal',code:'pt'},
  QAT:{country:'Qatar',code:'qa'},KSA:{country:'Saudi Arabia',code:'sa'},
  SEN:{country:'Senegal',code:'sn'},SRB:{country:'Serbia',code:'rs'},
  ESP:{country:'Spain',code:'es'},SUI:{country:'Switzerland',code:'ch'},
  TUN:{country:'Tunisia',code:'tn'},URU:{country:'Uruguay',code:'uy'},
  USA:{country:'USA',code:'us'},WAL:{country:'Wales',code:'gb-wls'},
};

const PARTICLES=['de','van','von','der','da','di','del','dos','du','al','el','bin','le','la'];

function toTitle(s){
  return s.toLowerCase().split(/\s+/).map((w,i)=>{
    if(i>0 && PARTICLES.includes(w)) return w;
    return w.charAt(0).toUpperCase()+w.slice(1);
  }).join(' ');
}

// True if word is "ALL CAPS" (no lowercase letters, at least 2 chars, no digits, not just punctuation)
function isCapsWord(w){
  return w.length>=2 && !/[a-záàâãéèêíïóôõöúçñøæœ]/.test(w) && !/^\d/.test(w) && /[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑØÆŒ]/.test(w);
}
// True if word is mixed case (has at least one lowercase letter)
function isMixedWord(w){
  return /[a-záàâãéèêíïóôõöúçñøæœ]/.test(w) && w.length>=2;
}

/**
 * Name block structure (between POS and DOB):
 * [COMBINED_FAMILY] [Combined_Given] [Full_Given_Names] [FULL_FAMILY] [SHIRT]
 *
 * We want: Combined_Given + title_case(FULL_FAMILY)
 *
 * Algorithm:
 * 1. Skip leading CAPS words → these are COMBINED_FAMILY (in ASCII)
 * 2. First mixed-case word = Combined_Given (primary given name)
 * 3. Skip all remaining mixed-case + initial words (these are Full_Given_Names part)
 * 4. First contiguous CAPS sequence after step 3 = FULL_FAMILY (has proper diacritics)
 * 5. Display = Combined_Given + ' ' + toTitle(FULL_FAMILY)
 */
function parseName(nameBlock){
  const words=nameBlock.split(/\s+/).filter(w=>w.length>0);
  let phase=0; // 0=skip combined family, 1=found given, 2=skip remaining given, 3=collect full family
  let combGiven='';
  let fullFamily=[];

  for(const w of words){
    const caps=isCapsWord(w);
    const mixed=isMixedWord(w);
    const initial=/^[A-Z]\.$/.test(w); // e.g. "E." or "M."

    if(phase===0){
      // Skip leading CAPS = combined family
      if(mixed){phase=1; combGiven=w;}
      // else: still skipping caps
    } else if(phase===1){
      // After combined given name: skip remaining given names (mixed or initials) until CAPS
      if(caps && !initial){phase=2; fullFamily=[w];}
      // mixed/initial: skip (these are middle names in full given section)
    } else if(phase===2){
      // Collecting FULL_FAMILY words (CAPS only, stop when we see a duplicate = shirt starts)
      if(caps && !initial){
        const already=fullFamily.join(' ');
        const ww=w;
        // If this word already appeared in fullFamily, we've hit the shirt repetition
        if(fullFamily.includes(ww)) break;
        fullFamily.push(w);
      } else break; // non-caps = done
    }
  }

  const family=fullFamily.length>0 ? fullFamily.join(' ') : '';
  if(!combGiven||!family) return null;
  return combGiven+' '+toTitle(family);
}

function shortenClub(raw){
  let c=raw.replace(/\s*\([A-Z]{2,4}\)\s*$/,'').trim();
  const subs=[
    ['Real Madrid CF','Real Madrid'],['FC Barcelona','Barcelona'],
    ['Manchester City FC','Man City'],['Manchester United FC','Man United'],
    ['Tottenham Hotspur FC','Tottenham'],['Borussia Dortmund','Dortmund'],
    ['FC Bayern München','Bayern Munich'],['FC Bayern Munchen','Bayern Munich'],
    ['Paris Saint-Germain FC','PSG'],['CA Atlético Madrid','Atlético'],
    ['Atletico Madrid','Atlético'],['FC Internazionale','Inter Milan'],
    ['SS Lazio','Lazio'],['AS Roma','Roma'],['SSC Napoli','Napoli'],
    ['ACF Fiorentina','Fiorentina'],['US Sassuolo','Sassuolo'],
    ['Atalanta BC','Atalanta'],['Atalanta Bergamo','Atalanta'],
    ['Torino FC','Torino'],['AC Monza','Monza'],
    ['RB Leipzig','RB Leipzig'],['Bayer 04 Leverkusen','Leverkusen'],
    ['TSG 1899 Hoffenheim','Hoffenheim'],['VfB Stuttgart','Stuttgart'],
    ['VfL Wolfsburg','Wolfsburg'],['Eintracht Frankfurt','E. Frankfurt'],
    ['SC Freiburg','Freiburg'],['FC Augsburg','Augsburg'],
    ['1. FC Köln','Köln'],['1. FC Union Berlin','Union Berlin'],
    ['1. FSV Mainz 05','Mainz'],['Borussia M.Gladbach','M.Gladbach'],
    ['SV Werder Bremen','Werder Bremen'],['Hamburger SV','Hamburg'],
    ['FC Schalke 04','Schalke'],['Hertha BSC','Hertha'],
    ['Olympique Marseille','Marseille'],['Olympique Lyonnais','Lyon'],
    ['Olympique de Marseille','Marseille'],
    ['Stade Rennais FC','Rennes'],['AS Monaco','Monaco'],
    ['RC Lens','Lens'],['Lille OSC','Lille'],['OGC Nice','Nice'],
    ['Stade Brestois 29','Brest'],['Clermont Foot 63','Clermont'],
    ['AFC Ajax','Ajax'],['PSV Eindhoven','PSV'],['Feyenoord','Feyenoord'],
    ['SL Beníca','Benfica'],['SL Benfica','Benfica'],
    ['Sporting CP','Sporting CP'],['FC Porto','Porto'],
    ['SC Braga','Braga'],['Rio Ave FC','Rio Ave'],
    ['Juventus FC','Juventus'],['AC Milan','AC Milan'],
    ['Liverpool FC','Liverpool'],['Arsenal FC','Arsenal'],
    ['Chelsea FC','Chelsea'],['Manchester City','Man City'],
    ['Brighton & Hove Albion FC','Brighton'],
    ['Aston Villa FC','Aston Villa'],['Everton FC','Everton'],
    ['West Ham United FC','West Ham'],['Newcastle United FC','Newcastle'],
    ['Leeds United AFC','Leeds'],['Leicester City FC','Leicester'],
    ['Nottingham Forest FC','Nottm Forest'],
    ['Wolverhampton Wanderers FC','Wolves'],
    ['Crystal Palace FC','Crystal Palace'],['Southampton FC','Southampton'],
    ['Brentford FC','Brentford'],['Fulham FC','Fulham'],
    ['Watford FC','Watford'],['Burnley FC','Burnley'],
    ['Norwich City FC','Norwich'],
    ['AFC Bournemouth','Bournemouth'],
    ['Sevilla FC','Sevilla'],['Real Betis','Real Betis'],
    ['Villarreal CF','Villarreal'],['RC Celta de Vigo','Celta Vigo'],
    ['Real Sociedad','Real Sociedad'],['Athletic Club','Athletic Bilbao'],
    ['Rayo Vallecano','Rayo Vallecano'],['Getafe CF','Getafe'],
    ['CA Osasuna','Osasuna'],['RCD Espanyol','Espanyol'],
    ['RCD Mallorca','Mallorca'],['UD Almería','Almería'],
    ['Elche CF','Elche'],['Real Valladolid','Valladolid'],
    ['Cádiz CF','Cádiz'],['Girona FC','Girona'],
    ['RSC Anderlecht','Anderlecht'],['Club Brugge','Club Brugge'],
    ['KRC Genk','Genk'],['Royal Antwerp FC','Antwerp'],
    ['Galatasaray SK','Galatasaray'],['Fenerbahçe SK','Fenerbahçe'],
    ['Trabzonspor','Trabzonspor'],['Beşiktaş JK','Beşiktaş'],
    ['FC Zenit St. Petersburg','Zenit'],['FC Zenit','Zenit'],
    ['Rangers FC','Rangers'],['Celtic FC','Celtic'],
    ['AFC Bournemouth','Bournemouth'],
    ['CA River Plate','River Plate'],['CA Boca Juniors','Boca Juniors'],
    ['Club Atletico Talleres','Talleres'],['Club Atletico River Plate','River Plate'],
    ['GNK Dinamo Zagreb','Dinamo Zagreb'],['HNK Hajduk Split','Hajduk Split'],
    ['NK Lokomotiva Zagreb','Lokomotiva'],
    ['FK Crvena Zvezda','Red Star Belgrade'],
    ['FK Vojvodina','Vojvodina'],
    ['FC Red Bull Salzburg','Red Bull Salzburg'],
    ['AEK Athens','AEK Athens'],['PAOK Saloniki','PAOK'],
    ['Olympiakos CFP','Olympiakos'],
    ['Al Nassr FC','Al Nassr'],['Al-Hilal SFC','Al-Hilal'],
    ['Al Ahly SC','Al Ahly'],['Zamalek SC','Zamalek'],
    ['Al Sadd SC','Al Sadd'],['Al-Rayyan SC','Al-Rayyan'],
    ['Al-Duhail SC','Al-Duhail'],['Al Gharafa SC','Al Gharafa'],
    ['Al-Qadsia SC','Al Qadsia'],['Al Jazira Club','Al Jazira'],
    ['Atlanta United FC','Atlanta United'],
    ['LA Galaxy','LA Galaxy'],
    ['Seattle Sounders FC','Seattle Sounders'],
    ['CF Montreal','CF Montréal'],['CF Montréal','CF Montréal'],
    ['Vancouver Whitecaps FC','Vancouver'],
    ['Toronto FC','Toronto FC'],
    ['Portland Timbers','Portland'],
    ['New England Revolution','New England Rev.'],
    ['New York Red Bulls','NY Red Bulls'],
    ['New York City FC','NYCFC'],
    ['Columbus Crew','Columbus Crew'],
    ['Chicago Fire FC','Chicago Fire'],
    ['Philadelphia Union','Philadelphia Union'],
    ['FC Dallas','FC Dallas'],
    ['Minnesota United FC','Minnesota'],
    ['Colorado Rapids','Colorado Rapids'],
    ['Real Salt Lake','Real Salt Lake'],
    ['Austin FC','Austin FC'],
    ['Rayados de Monterrey','Monterrey'],
    ['Club América','Club América'],
    ['Cruz Azul','Cruz Azul'],
    ['Deportivo Toluca','Toluca'],
    ['Tigres UANL','Tigres'],
    ['Club León','León'],
    ['Pachuca','Pachuca'],
    ['Pumas UNAM','Pumas'],
    ['Guadalajara','Guadalajara'],
    ['Club Santos Laguna','Santos Laguna'],
    ['Dorados de Sinaloa','Dorados'],
    ['Necaxa','Necaxa'],
    ['Atlas FC','Atlas'],
    ['Mazatlán FC','Mazatlán'],
    ['Pyramids FC','Pyramids'],
    ['Zamalek SC','Zamalek'],
    ['Esperance Sportive de Tunis','Espérance'],
    ['Club Africain','Club Africain'],
    ['Étoile Sportive du Sahel','Étoile du Sahel'],
    ['CS Sfaxien','CS Sfaxien'],
    ['Club Olimpia','Olimpia'],
    ['Peñarol','Peñarol'],
    ['Nacional','Nacional'],
    ['Defensor Sporting','Defensor Sporting'],
    ['Montpellier HSC','Montpellier'],
    ['Stade de Reims','Reims'],
    ['Troyes AC','Troyes'],
    ['FC Metz','Metz'],
    ['AC Ajaccio','Ajaccio'],
    ['AJ Auxerre','Auxerre'],
    ['FC Nantes','Nantes'],
    ['FC Lorient','Lorient'],
    ['Toulouse FC','Toulouse'],
    ['Angers SCO','Angers'],
    ['RC Strasbourg','Strasbourg'],
    ['Sporting de Charleroi','Charleroi'],
    ['Cercle Brugge','Cercle Brugge'],
    ['Standard Liège','Standard Liège'],
    ['KAA Gent','Gent'],
    ['SV Darmstadt 98','Darmstadt'],
    ['Holstein Kiel','Holstein Kiel'],
    ['FC Heidenheim','Heidenheim'],
    ['SpVgg Greuther Fürth','Greuther Fürth'],
    ['Hannover 96','Hannover 96'],
    ['1. FC Nürnberg','Nürnberg'],
    ['FC St. Pauli','St. Pauli'],
    ['VfL Bochum','Bochum'],
    ['Fortuna Düsseldorf','Düsseldorf'],
    ['FC Twente','Twente'],['Vitesse','Vitesse'],
    ['AZ Alkmaar','AZ'],['SC Heerenveen','Heerenveen'],
    ['FC Groningen','Groningen'],
    ['Sporting Braga','Braga'],
    ['Vitória SC','Vitória'],
    ['Sporting de Braga','Braga'],
    ['Granada CF','Granada'],
    ['UD Las Palmas','Las Palmas'],
    ['Real Oviedo','Real Oviedo'],
    ['Tenerife','Tenerife'],
    ['Lech Poznan','Lech Poznań'],['Lech Poznań','Lech Poznań'],
    ['Legia Warszawa','Legia Warsaw'],
    ['Wisla Kraków','Wisła Kraków'],['Wisła Kraków','Wisła Kraków'],
    ['FC Internazionale','Inter Milan'],
    ['FK Dinamo Zagreb','Dinamo Zagreb'],
    ['SC Bastia','Bastia'],
    ['RFC Seraing','Seraing'],
    ['Vissel Kobe','Vissel Kobe'],
    ['Cerezo Osaka','Cerezo Osaka'],
    ['Gamba Osaka','Gamba Osaka'],
    ['Kawasaki Frontale','Kawasaki'],
    ['Urawa Red Diamonds','Urawa Reds'],
    ['Kashima Antlers','Kashima Antlers'],
    ['Nagoya Grampus','Nagoya'],
    ['Yokohama F. Marinos','Yokohama Marinos'],
    ['Sagan Tosu','Sagan Tosu'],
    ['Sanfrecce Hiroshima','Hiroshima'],
    ['FC Gifu','FC Gifu'],
    ['Ulsan Hyundai FC','Ulsan'],
    ['Jeonbuk Hyundai Motors FC','Jeonbuk'],
    ['Suwon Samsung Bluewings','Suwon'],
    ['Seongnam FC','Seongnam'],
    ['Incheon United FC','Incheon United'],
    ['FC Seoul','FC Seoul'],
    ['Daegu FC','Daegu FC'],
    ['Pohang Steelers','Pohang Steelers'],
    ['Jeju United FC','Jeju United'],
    ['Gangwon FC','Gangwon'],
    ['Club Nacional de Football','Nacional'],
    ['Liverpool FC Montevideo','Liverpool Montevideo'],
    ['Internacional','Internacional'],
    ['Flamengo','Flamengo'],['CR Flamengo','Flamengo'],
    ['Palmeiras','Palmeiras'],['SE Palmeiras','Palmeiras'],
    ['SC Corinthians','Corinthians'],
    ['Atletico Mineiro','Atlético Mineiro'],['Atlético Mineiro','Atlético Mineiro'],
    ['Fluminense','Fluminense'],['FC Fluminense','Fluminense'],
    ['Santos FC','Santos'],
    ['Grêmio FBPA','Grêmio'],['Gremio FBPA','Grêmio'],
    ['São Paulo FC','São Paulo'],['Sao Paulo FC','São Paulo'],
    ['Red Bull Bragantino','Bragantino'],
    ['Figueirense FC','Figueirense'],
    ['Sport Club do Recife','Sport Recife'],
    ['Club Sport Marítimo','Marítimo'],
    ['Deportivo Saprissa','Saprissa'],
    ['Liga Deportiva Alajuelense','Alajuelense'],
    ['Herediano','Herediano'],
    ['Club Communicaciones','Comunicaciones'],
    ['LD Alajuelense','Alajuelense'],
    ['ENPPI SC','ENPPI'],
    ['RC Abidjan','RC Abidjan'],
    ['ASEC Mimosas','ASEC Mimosas'],
    ['Club Olimpia','Club Olimpia'],
    ['Al-Qadsia SC','Al-Qadsia'],
    ['Al-Ahli Saudi FC','Al-Ahli'],
    ['Al-Ittihad FC','Al-Ittihad'],
    ['Al-Taawoun FC','Al-Taawoun'],
    ['Al-Fateh SC','Al-Fateh'],
    ['Al-Faisaly FC','Al-Faisaly'],
    ['Al-Shabab FC','Al-Shabab'],
    ['Al-Ettifaq FC','Al-Ettifaq'],
    ['Persepolis FC','Persepolis'],
    ['Esteghlal FC','Esteghlal'],
    ['Tractor S.C.','Tractor'],
    ['Foolad FC','Foolad'],
    ['Sepahan SC','Sepahan'],
    ['Nassaji Mazandaran FC','Nassaji'],
    ['Saipa FC','Saipa'],
    ['Azhdaha FC','Azhdaha'],
    ['Damash Gilan FC','Damash Gilan'],
    ['AS Vita Club','AS Vita'],
    ['TP Mazembe','TP Mazembe'],
    ['Hearts of Oak SC','Hearts of Oak'],
    ['Asante Kotoko SC','Asante Kotoko'],
    ['Accra Lions FC','Accra Lions'],
    ['Leicester City','Leicester'],
    ['Nottingham Forest','Nottm Forest'],
    ['Wolverhampton Wanderers','Wolves'],
    ['Brighton & Hove Albion','Brighton'],
    ['West Ham United','West Ham'],
    ['Newcastle United','Newcastle'],
    ['Leeds United','Leeds'],
    ['Aston Villa','Aston Villa'],
    ['Crystal Palace','Crystal Palace'],
    ['Burnley','Burnley'],
    ['Watford','Watford'],
    ['Norwich City','Norwich'],
    ['Brentford','Brentford'],
    ['Fulham','Fulham'],
    ['Southampton','Southampton'],
    ['Wolverhampton','Wolves'],
  ];
  for(const [from,to] of subs){
    if(c.includes(from)) c=c.replace(from,to);
  }
  // Remove remaining "FC" "CF" suffixes at end
  c=c.replace(/\s+FC\s*$|\s+CF\s*$|\s+SC\s*$|\s+AC\s*$|\s+BC\s*$/,'');
  return c.replace(/\s{2,}/g,' ').trim();
}

function parsePage(pageText){
  const teamMatch=pageText.match(/SQUAD LIST\s+([\w\s]+?)\s+\((\w+)\)/);
  if(!teamMatch) return null;
  const fifaCode=teamMatch[2];
  const meta=FIFA_TO_META[fifaCode];
  if(!meta) return null;

  // Pattern: POS followed by text then DOB then club then numbers
  // Using a regex that anchors on POS + DOB
  const re=/(GK|DF|MF|FW)\s+((?:(?!\d{2}\/\d{2}\/\d{4}).)+?)\s+(\d{2}\/\d{2}\/\d{4})\s+((?:(?!\s\d{2,3}\s).)+?)\s+(\d{2,3})\s+(\d{1,3})\s+(\d{1,3})/g;

  const players=[];
  let m;
  while((m=re.exec(pageText))!==null){
    const pos=m[1];
    const nameBlock=m[2].trim();
    const clubRaw=m[4].trim();

    // Skip header row (contains positional words like "Goalkeeper")
    if(/Goalkeeper|Defender|Midfielder|Forward|elder|DOB|Position/i.test(nameBlock)) continue;
    // Skip if nameBlock looks like noise
    if(nameBlock.length<4) continue;

    const name=parseName(nameBlock);
    if(!name || name.trim().length<4) continue;

    const posMap={GK:'Goalkeeper',DF:'Defender',MF:'Midfielder',FW:'Forward'};
    players.push({
      name:name.trim(),
      country:meta.country,
      code:meta.code,
      pos:posMap[pos],
      club:shortenClub(clubRaw)
    });
  }
  return players;
}

const allPlayers=[];
const teamCounts={};
pages.forEach((p,i)=>{
  const result=parsePage(p);
  if(result){
    allPlayers.push(...result);
    const m=p.match(/SQUAD LIST\s+([\w\s]+?)\s+\(/);
    const team=m?m[1]:'page'+(i+1);
    teamCounts[team]=result.length;
  }
});

fs.writeFileSync('_players_raw.json',JSON.stringify(allPlayers,null,2));
console.log('Total:',allPlayers.length);
Object.entries(teamCounts).forEach(([t,n])=>console.log(t+':',n));
