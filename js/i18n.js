// ═══════════════════════════════════════════════════════════
// LANGUAGE — English / Portuguese
// Static markup uses data-i18n (text) or data-i18n-html (markup) keys from STRINGS.
// Dynamic text calls t(en,pt) at render time.
// ═══════════════════════════════════════════════════════════
const STRINGS={
  eyebrow:      {en:'FIFA World Cup 2026', pt:'Copa do Mundo FIFA 2026'},
  title:        {en:'Do you know<br>the <span>players?</span>', pt:'Você conhece<br>os <span>jogadores?</span>'},
  intro:        {en:'Guess which country each player represents. Answer to reveal their photo and club. 10 rounds per match.',
                 pt:'Adivinhe qual país cada jogador representa. Responda para revelar sua foto e clube. 10 rodadas por partida.'},
  chooseMode:   {en:'Choose your difficulty to start', pt:'Escolha sua dificuldade para começar'},
  'mode.stars': {en:'Stars Only', pt:'Só Estrelas'},
  'mode.mixed': {en:'Mixed', pt:'Misturado'},
  'mode.all':   {en:'All Players', pt:'Todos os Jogadores'},
  'modeDesc.stars':{en:'World-famous players everyone should know. Great for casual fans.',
                    pt:'Jogadores mundialmente famosos que todos deveriam conhecer. Ótimo para fãs casuais.'},
  'modeDesc.mixed':{en:'Stars plus well-known players from all 48 nations. A real test.',
                    pt:'Estrelas mais jogadores conhecidos de todas as 48 nações. Um teste de verdade.'},
  'modeDesc.all':  {en:'Every player in the dataset. Experts only.', pt:'Todos os jogadores do dataset. Apenas para especialistas.'},
  creator:      {en:'by Pedro Sabino', pt:'por Pedro Sabino'},
  score:        {en:'Score', pt:'Pontos'},
  streak:       {en:'Streak', pt:'Sequência'},
  round:        {en:'Round', pt:'Rodada'},
  difficulty:   {en:'Difficulty', pt:'Dificuldade'},
  question:     {en:'Which country does this player represent?', pt:'Qual país este jogador representa?'},
  finalScore:   {en:'Final score', pt:'Pontuação final'},
  playAgain:    {en:'Play Again', pt:'Jogar Novamente'},
  changeMode:   {en:'Change Difficulty', pt:'Mudar Dificuldade'},
  review:       {en:'MATCH REVIEW', pt:'REVISÃO DA PARTIDA'},
  shareReview:  {en:'SHARE REVIEW', pt:'COMPARTILHAR'},
  shareTitle:   {en:'Share your match', pt:'Compartilhe sua partida'},
  copyShare:    {en:'COPY & SHARE', pt:'COPIAR E COMPARTILHAR'},
  close:        {en:'Close', pt:'Fechar'},
};
const PT_POS={Forward:'Atacante',Midfielder:'Meio-campista',Defender:'Defensor',Goalkeeper:'Goleiro'};
const DAYS={en:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
            pt:['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']};
const MONTHS={en:['January','February','March','April','May','June','July','August','September','October','November','December'],
              pt:['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']};

let lang=readStoredLang();

function readStoredLang(){
  try{ return localStorage.getItem('lang')==='pt'?'pt':'en'; }catch(_){ return 'en'; }
}
function t(en,pt){return lang==='pt'?pt:en;}
function str(key){return STRINGS[key][lang];}
function modeName(mode){return str('mode.'+mode);}
function posName(p){return lang==='pt'?(PT_POS[p]||p):p;}

const COUNTRY_PT=Object.fromEntries(COUNTRIES.map(c=>[c.country,c.pt]));
function countryName(c){return lang==='pt'?(COUNTRY_PT[c]||c):c;}

// "Saturday · July 4 · 14h"
function formatMatchDate(dateStr,time){
  const d=new Date(dateStr+'T12:00:00');
  const timeStr=time?' · '+time.split(':')[0]+'h':'';
  return `${DAYS[lang][d.getDay()]} · ${MONTHS[lang][d.getMonth()]} ${d.getDate()}${timeStr}`;
}

function applyLang(){
  document.documentElement.lang=lang==='pt'?'pt-BR':'en';
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=str(el.dataset.i18n);});
  document.querySelectorAll('[data-i18n-html]').forEach(el=>{el.innerHTML=str(el.dataset.i18nHtml);});
  document.getElementById('lang-toggle').dataset.lang=lang;
}

function toggleLang(){
  lang=lang==='en'?'pt':'en';
  try{ localStorage.setItem('lang',lang); }catch(_){}
  gtag('event','language_switch',{language:lang});
  applyLang();
}
