const fs = require('fs');
const NAT = {
  Algeria:['Algeria','Algerian'],Australia:['Australia','Australian'],
  Austria:['Austria','Austrian'],Belgium:['Belgium','Belgian'],
  Bosnia:['Bosnia','Bosnian','Bosnia and Herzegovina'],
  Brazil:['Brazil','Brazilian'],Canada:['Canada','Canadian'],
  'Cape Verde':['Cape Verde'],Colombia:['Colombia','Colombian'],
  'DR Congo':['DR Congo','Democratic Republic of Congo','Congolese'],
  Croatia:['Croatia','Croatian'],Curaçao:['Curacao','Curaçao'],
  Czechia:['Czechia','Czech'],Ecuador:['Ecuador','Ecuadorian'],
  Egypt:['Egypt','Egyptian'],England:['England','English'],
  France:['France','French'],Germany:['Germany','German'],
  Ghana:['Ghana','Ghanaian'],Haiti:['Haiti','Haitian'],
  Iran:['Iran','Iranian'],Iraq:['Iraq','Iraqi'],
  'Ivory Coast':["Ivory Coast","Ivorian"],
  Japan:['Japan','Japanese'],Jordan:['Jordan','Jordanian'],
  Mexico:['Mexico','Mexican'],Morocco:['Morocco','Moroccan'],
  Netherlands:['Netherlands','Dutch'],
  'New Zealand':['New Zealand'],Norway:['Norway','Norwegian'],
  Panama:['Panama','Panamanian'],Paraguay:['Paraguay','Paraguayan'],
  Portugal:['Portugal','Portuguese'],Qatar:['Qatar','Qatari'],
  'Saudi Arabia':['Saudi Arabia','Saudi'],Scotland:['Scotland','Scottish'],
  Senegal:['Senegal','Senegalese'],'South Africa':['South Africa'],
  'South Korea':['South Korea','Korean'],
  Spain:['Spain','Spanish'],Sweden:['Sweden','Swedish'],
  Switzerland:['Switzerland','Swiss'],Tunisia:['Tunisia','Tunisian'],
  Turkiye:['Turkiye','Turkey','Turkish'],Uruguay:['Uruguay','Uruguayan'],
  USA:['USA','American','United States'],Uzbekistan:['Uzbekistan','Uzbek'],
  Argentina:['Argentina','Argentinian'],
};
function natMatch(c,n){return(NAT[c]||[c]).some(x=>(n||'').toLowerCase().includes(x.toLowerCase()));}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function fetchSafe(url){
  for(let t=0;t<3;t++){
    try{
      const r=await fetch(url);const txt=await r.text();
      if(txt.trim().startsWith('<')){await sleep(3000*(t+1));continue;}
      return JSON.parse(txt);
    }catch(e){await sleep(2000);}
  }
  return null;
}
async function run(){
  const final=JSON.parse(fs.readFileSync('_2026_players_final.json','utf8'));
  const players=final.filter(p=>!p.photo);
  console.log('Looking up',players.length,'players...\n');
  const photoMap={};let found=0;
  for(let i=0;i<players.length;i++){
    const p=players[i];
    process.stdout.write(`\r[${i+1}/${players.length}] found:${found} | ${p.name.padEnd(28)}`);
    const d=await fetchSafe(`https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(p.name)}`);
    if(d){const m=(d.player||[]).find(r=>natMatch(p.country,r.strNationality));if(m&&m.strThumb){photoMap[p.name]=m.strThumb;found++;}}
    await sleep(750);
  }
  console.log(`\n\nFound: ${found}`);
  const updated=final.map(p=>(!p.photo&&photoMap[p.name])?{...p,photo:photoMap[p.name]}:p);
  fs.writeFileSync('_2026_players_final.json',JSON.stringify(updated,null,2));
  console.log('Total with photo:',updated.filter(p=>p.photo).length);
  // Regenerate output
  const lines=updated.map(p=>{
    const base=`{name:"${p.name}",country:"${p.country}",code:"${p.code}",pos:"${p.pos}",club:"${p.club}",d:${p.d},wiki:"${p.wiki}"`;
    return '  '+base+(p.photo?`,photo:"${p.photo}"`:'')+'}'  ;
  });
  const ctries=[...new Set(updated.map(p=>JSON.stringify({country:p.country,code:p.code})))].map(s=>JSON.parse(s)).sort((a,b)=>a.country.localeCompare(b.country));
  fs.writeFileSync('_2026_output.js','const PLAYERS=[\n'+lines.join(',\n')+'\n];\n\nconst QUALIFIED_COUNTRIES=[\n'+ctries.map(c=>`  {country:"${c.country}",code:"${c.code}"}`).join(',\n')+'\n];');
  console.log('Saved _2026_output.js');
}
run().catch(console.error);
