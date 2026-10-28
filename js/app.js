// ═══════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════
const TOTAL_ROUNDS=10;
const MOBILE_MAX_WIDTH=600;
const POINTS=100, STREAK_POINTS=200, STREAK_BONUS_FROM=3;

let score=0,streak=0,round=0,answered=false;
let currentPlayer=null,options=[],queue=[],currentDifficulty='stars';
let answerLog=[]; // [{player, correct}] — feeds the match review and share text

const $=id=>document.getElementById(id);
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function pick(list){return list[Math.floor(Math.random()*list.length)];}

// ═══════════════════════════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════════════════════════
function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===id));
  const inGame=id==='game-screen';
  $('hud').classList.toggle('show',inGame);
  $('diff-breadcrumb').classList.toggle('show',inGame);
  $('lang-toggle').classList.toggle('show',id==='welcome-screen');
}
function showWelcome(){applyLang();show('welcome-screen');}

// ═══════════════════════════════════════════════════════════
// GAME FLOW
// ═══════════════════════════════════════════════════════════
function getPool(mode){
  if(mode==='stars') return PLAYERS.filter(p=>p.d===1);
  if(mode==='mixed') return PLAYERS.filter(p=>p.d<=2);
  return PLAYERS;
}
function buildOptions(player){
  const wrong=shuffle(COUNTRIES.filter(c=>c.country!==player.country)).slice(0,3);
  return shuffle([{country:player.country,code:player.code},...wrong]);
}

function startGame(mode=currentDifficulty){
  currentDifficulty=mode;
  score=0;streak=0;round=0;answerLog=[];
  gtag('event','game_start',{difficulty:currentDifficulty});
  // Shuffle + slice: each player appears at most once per game
  queue=shuffle(getPool(currentDifficulty)).slice(0,TOTAL_ROUNDS);
  queue.forEach(prefetchPlayerMedia);
  $('diff-breadcrumb-value').textContent=modeName(currentDifficulty);
  show('game-screen');
  nextRound();
}

function nextRound(){
  if(round>=queue.length){showResults();return;}
  answered=false;
  currentPlayer=queue[round];
  options=buildOptions(currentPlayer);
  round++;
  updateHUD();
  renderRound();
}

function updateHUD(){
  $('score').textContent=score;
  $('streak').textContent=streak;
  $('round-display').textContent=`${round}/${queue.length}`;
  $('progress-fill').style.width=`${((round-1)/queue.length*100).toFixed(1)}%`;
  $('q-counter').textContent=t(`Player ${round} of ${queue.length}`,`Jogador ${round} de ${queue.length}`);
}

// ═══════════════════════════════════════════════════════════
// RENDER — mobile and desktop use different layouts, chosen per round
// ═══════════════════════════════════════════════════════════
const ARROW_SVG=`<svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>`;

function flagImg(code,w,h){
  return `<img src="https://flagcdn.com/w80/${code}.png" width="${w}" height="${h}" style="display:block;border-radius:2px;object-fit:cover" alt="" loading="lazy"/>`;
}

function optionsHtml(){
  return options.map((opt,i)=>`
    <button class="option-btn" id="opt-${i}" data-action="answer" data-index="${i}">
      <div class="flag-wrap">${flagImg(opt.code,40,28)}</div>
      <span class="opt-name">${countryName(opt.country)}</span>
      <span class="opt-check" id="check-${i}"></span>
    </button>`).join('');
}

function nextBtnHtml(){
  const label=round<queue.length?t('Next','Próximo'):t('Results','Resultados');
  return `<button class="next-btn" id="next-btn" data-action="next">${label}${ARROW_SVG}</button>`;
}

function photoSceneHtml(){
  return `<div class="photo-scene">
    <div class="photo-flipper" id="flipper">
      <div class="photo-front">
        <div class="qmark">?</div>
        <div class="qmark-sub">${t('Answer to reveal','Responda para revelar')}</div>
      </div>
      <div class="photo-back" id="photo-back">
        <div class="spinner"></div>
        <div class="club-badge" id="club-badge"></div>
      </div>
    </div>
  </div>`;
}

function playerNameHtml(){
  return `<div class="player-name">${esc(currentPlayer.name)}</div>
    <div class="player-pos">${posName(currentPlayer.pos)}</div>`;
}

function feedbackHtml(cls){
  return `<div class="${cls}">
    <span class="feedback-text" id="fb-title"></span>
    <span class="feedback-sub feedback-points" id="fb-points"></span>
    <span class="feedback-sub feedback-info" id="fb-info"></span>
  </div>`;
}

// ── Last match box ─────────────────────────────────────────
function getLastMatch(country){
  for(let i=WC26_MATCHES.length-1;i>=0;i--){
    const m=WC26_MATCHES[i];
    if(m.t1===country||m.t2===country) return m;
  }
  return null;
}
function lastMatchParts(player){
  const m=getLastMatch(player.country);
  if(!m) return null;
  const home=m.t1===player.country;
  const opp=home?m.t2:m.t1, oppCode=home?m.c2:m.c1;
  const header=`<div class="last-match-header">
      <span class="last-match-label">${t('Last match','Último jogo')}</span>
      <span class="last-match-datetime">${formatMatchDate(m.date,m.time)}</span>
    </div>`;
  const teams=`<div class="last-match-row">
      <div class="last-match-team">
        <span class="last-match-name">${countryName(player.country)}</span>
        <span class="last-match-score">${home?m.s1:m.s2}</span>
        ${flagImg(player.code,28,20)}
      </div>
      <span class="last-match-sep">×</span>
      <div class="last-match-team">
        ${flagImg(oppCode,28,20)}
        <span class="last-match-score">${home?m.s2:m.s1}</span>
        <span class="last-match-name">${countryName(opp)}</span>
      </div>
    </div>`;
  // Always shown; opens the replay once the match has a link
  const href=m.link?` href="${esc(m.link)}" target="_blank" rel="noopener noreferrer"`:'';
  const watch=`<a id="watch-btn" class="watch-btn"${href}>
      ${t('Watch match','Assistir ao jogo')}
      <img src="caseTVLogo.png" width="16" height="16" alt="" style="border-radius:3px;display:block;flex-shrink:0">
    </a>`;
  return {header,teams,watch};
}

function renderMobile(){
  const lm=lastMatchParts(currentPlayer);
  $('player-card').innerHTML=`
    <div class="player-top-m">${playerNameHtml()}</div>
    <div class="player-mid-m">
      ${photoSceneHtml()}
      <div class="player-options-m">
        <div class="question-label-m">${str('question').toUpperCase()}</div>
        <div class="options-m">${optionsHtml()}</div>
      </div>
    </div>
    <div class="player-bottom-m">
      <div class="player-btm-actions">
        ${feedbackHtml('feedback-m')}
        ${nextBtnHtml()}
      </div>
      <div class="reveal-row" id="reveal-row">
        <div class="reveal-country" id="reveal-country">
          ${lm?`<div class="last-match">${lm.header}${lm.teams}</div>${lm.watch}`:''}
        </div>
      </div>
    </div>`;
  $('options-grid').innerHTML='';
}

function renderDesktop(){
  const lm=lastMatchParts(currentPlayer);
  $('player-card').innerHTML=`
    ${photoSceneHtml()}
    <div class="player-info">
      <div class="player-top">${playerNameHtml()}</div>
      <div class="player-bottom">
        ${feedbackHtml('feedback-desktop')}
        <div class="reveal-row" id="reveal-row">
          <div class="reveal-country" id="reveal-country">
            ${lm?`${lm.header}<div class="reveal-country-row">${lm.teams}<div class="reveal-btns">${lm.watch}</div></div>`:''}
          </div>
        </div>
      </div>
    </div>`;
  $('options-grid').innerHTML=optionsHtml()+nextBtnHtml();
}

function renderRound(){
  if(window.innerWidth<=MOBILE_MAX_WIDTH) renderMobile(); else renderDesktop();
  showPlayerPhoto(currentPlayer);
}

// ═══════════════════════════════════════════════════════════
// MEDIA — player photos (TheSportsDB, Wikipedia fallback) and club crests (Wikipedia)
// ═══════════════════════════════════════════════════════════
const wikiThumbCache=new Map(); // Wikipedia title → Promise<thumbnail url | null>
function wikiThumbnail(title){
  if(!title) return Promise.resolve(null);
  if(!wikiThumbCache.has(title)){
    wikiThumbCache.set(title,
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
        .then(r=>r.ok?r.json():null)
        .then(d=>d?.thumbnail?.source||null)
        .catch(()=>null));
  }
  return wikiThumbCache.get(title);
}
function clubCrest(club){return wikiThumbnail(CLUB_WIKI[club]);}

function prefetchPlayerMedia(p){
  if(p.photo) new Image().src=p.photo;
  else wikiThumbnail(p.wiki);
  clubCrest(p.club);
}

async function showPlayerPhoto(player){
  const back=$('photo-back');
  const src=player.photo||await wikiThumbnail(player.wiki);
  if(!back.isConnected) return; // player changed while loading
  if(!src){setPhotoBack(back,null);return;}
  const img=new Image();
  img.onload=()=>{if(back.isConnected) setPhotoBack(back,src);};
  img.onerror=async()=>{
    if(!back.isConnected) return;
    setPhotoBack(back,null);
    // A broken TheSportsDB image falls back to Wikipedia
    if(player.photo){
      const wiki=await wikiThumbnail(player.wiki);
      if(wiki&&back.isConnected) setPhotoBack(back,wiki);
    }
  };
  img.src=src;
}

function noPhotoHtml(){
  return `<div class="no-photo-back">
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1" stroke-linecap="round">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
    <span class="no-photo-label">${t('No photo','Sem foto')}</span>
  </div>`;
}

// Replace the card back's content, keeping the club badge on top
function setPhotoBack(back,src){
  const badge=back.querySelector('.club-badge');
  if(src){
    back.innerHTML='';
    const el=document.createElement('img');
    el.src=src;el.alt='';el.className='player-img';
    back.appendChild(el);
  }else{
    back.innerHTML=noPhotoHtml();
  }
  if(badge) back.appendChild(badge);
}

function fallbackBadgeSvg(club){
  if(CLUB_BADGES[club]) return CLUB_BADGES[club];
  const abbr=esc((club||'?').slice(0,3).toUpperCase());
  return `<svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="14" r="13" fill="#333"/><text x="14" y="18" text-anchor="middle" font-family="Arial" font-size="7" font-weight="bold" fill="#fff">${abbr}</text></svg>`;
}

async function showClubBadge(badge,club){
  const src=await clubCrest(club);
  if(!badge.isConnected) return;
  if(src){const img=document.createElement('img');img.src=src;img.alt='';badge.appendChild(img);}
  else badge.innerHTML=fallbackBadgeSvg(club);
  badge.classList.add('show');
}

// ═══════════════════════════════════════════════════════════
// ANSWER
// ═══════════════════════════════════════════════════════════
const CORRECT_MSGS={en:['Correct!','Nice!',"You're right!",'Well done!','Spot on!','Nailed it!'],
                    pt:['Correto!','Isso aí!','Acertou!','Muito bem!','Na mosca!','Arrasou!']};
const WRONG_MSGS={en:['Not quite.','Almost!','So close!','Oops!','Nice try!'],
                  pt:['Quase...','Não dessa vez.','Tão perto!','Ops!','Boa tentativa!']};

function handleAnswer(idx){
  if(answered) return;
  answered=true;
  const isCorrect=options[idx].country===currentPlayer.country;
  const correctIdx=options.findIndex(o=>o.country===currentPlayer.country);
  const bonus=streak>=STREAK_BONUS_FROM;
  if(isCorrect){score+=bonus?STREAK_POINTS:POINTS;streak++;}
  else streak=0;
  answerLog.push({player:currentPlayer,correct:isCorrect});
  gtag('event','answer',{difficulty:currentDifficulty,correct:isCorrect,round,streak});
  updateHUD();

  markOptions(idx,correctIdx,isCorrect);
  showFeedback(isCorrect,bonus);

  $('flipper').classList.add('flipped');
  // Bind to this round's badge so a quick "Next" can't leak it into the next card
  const badge=$('club-badge'),club=currentPlayer.club;
  setTimeout(()=>showClubBadge(badge,club),530); // after the flip lands
  $('reveal-row').classList.add('show');
  $('reveal-country').classList.add('show');
  $('watch-btn')?.classList.add('show');
  setTimeout(()=>$('next-btn')?.classList.add('show'),300);
}

function markOptions(chosenIdx,correctIdx,isCorrect){
  options.forEach((_,i)=>{
    const btn=$(`opt-${i}`),chk=$(`check-${i}`);
    btn.disabled=true;
    if(i===chosenIdx){btn.classList.add(isCorrect?'correct':'wrong');chk.textContent=isCorrect?'✓':'✗';}
    else if(i===correctIdx){btn.classList.add('reveal-correct');chk.textContent='✓';}
    else btn.classList.add('dim');
  });
}

function showFeedback(isCorrect,bonus){
  const title=$('fb-title'),points=$('fb-points'),info=$('fb-info');
  if(isCorrect){
    title.textContent=streak>1?t(`🔥 Streak × ${streak}`,`🔥 Sequência × ${streak}`):pick(CORRECT_MSGS[lang]);
    title.className='feedback-text show correct';
    points.textContent=bonus?t(`+${STREAK_POINTS} pts (streak bonus)`,`+${STREAK_POINTS} pts (bônus de sequência)`):`+${POINTS} pts`;
    points.className='feedback-sub feedback-points show correct';
  }else{
    title.textContent=pick(WRONG_MSGS[lang]);
    title.className='feedback-text show wrong';
  }
  const country=countryName(currentPlayer.country);
  info.textContent=t(`Plays for ${country} and ${currentPlayer.club}.`,`Joga por ${country} e ${currentPlayer.club}.`);
  info.className='feedback-sub feedback-info show';
}

// ═══════════════════════════════════════════════════════════
// RESULTS, REVIEW AND SHARE
// ═══════════════════════════════════════════════════════════
function maxScore(){return queue.length*STREAK_POINTS;}
function verdict(){
  const ratio=score/maxScore();
  if(ratio>=.85) return t('You clearly watch too much football. Legendary.','Você claramente assiste futebol demais. Lenda.');
  if(ratio>=.6)  return t('Solid knowledge. A true football fan.','Sólido conhecimento. Um verdadeiro fã.');
  if(ratio>=.35) return t('Not bad. Room to grow.','Nada mal. Ainda tem como melhorar.');
  return t('Keep watching — the World Cup will help.','Continue assistindo — a Copa vai ajudar.');
}

function showResults(){
  show('results-screen');
  gtag('event','game_complete',{difficulty:currentDifficulty,score,max_score:maxScore(),rounds:queue.length});
  $('results-score').textContent=score;
  $('results-sub').textContent=verdict();
  renderMatchReview();
}

function flagEmoji(code){
  if(code==='gb-eng') return '🏴󠁧󠁢󠁥󠁮󠁧󠁿';
  if(code==='gb-sct') return '🏴󠁧󠁢󠁳󠁣󠁴󠁿';
  return [...code.toUpperCase()].map(c=>String.fromCodePoint(0x1F1E6+c.charCodeAt(0)-65)).join('');
}

const REVIEW_NO_PHOTO=`<span style="font-size:18px" aria-hidden="true">👤</span>`;
function renderMatchReview(){
  const list=$('review-list');
  list.innerHTML=answerLog.map(({player:p,correct},i)=>{
    const photo=p.photo?`<img src="${esc(p.photo)}" alt="${esc(p.name)}">`:REVIEW_NO_PHOTO;
    return `<div class="player-row">
      <span class="review-idx" aria-hidden="true">${i+1}</span>
      <div class="review-photo">${photo}</div>
      <div class="review-info">
        <span class="review-player-name">${esc(p.name)}</span>
        <div class="review-country">
          <span aria-hidden="true">${flagEmoji(p.code)}</span>
          <span>${esc(countryName(p.country))}</span>
        </div>
      </div>
      <span class="result-badge ${correct?'correct':'wrong'}" aria-label="${correct?'Correct':'Wrong'}">${correct?'✓':'✗'}</span>
    </div>`;
  }).join('');
  list.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.outerHTML=REVIEW_NO_PHOTO;}));
}

function buildShareText(){
  const rows=answerLog.map(({player:p,correct})=>
    `${correct?'🟩':'🟥'} ${p.name} · ${flagEmoji(p.code)} ${countryName(p.country)}`).join('\n');
  const hits=answerLog.filter(a=>a.correct).length;
  const stats=`🏆 ${score} pts  🔥 ${t('Streak','Sequência')} ×${streak}  ${hits}/${answerLog.length}`;
  return `⚽ World Cup 26 · ${modeName(currentDifficulty)}\n\n${rows}\n\n${stats}\n\n${verdict()}\n▶ worldcup26.vercel.app`;
}

function openShareModal(){
  $('share-text-block').textContent=buildShareText();
  $('copy-share-label').textContent=str('copyShare');
  $('copy-share-btn').classList.remove('copied');
  $('share-modal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeShareModal(){
  $('share-modal').classList.remove('open');
  document.body.style.overflow='';
}
async function copyShareText(){
  const block=$('share-text-block'),btn=$('copy-share-btn'),label=$('copy-share-label');
  try{
    await navigator.clipboard.writeText(block.textContent);
    label.textContent=t('✓ Copied!','✓ Copiado!');
    btn.classList.add('copied');
    setTimeout(()=>{label.textContent=str('copyShare');btn.classList.remove('copied');},2500);
  }catch(_){
    // Clipboard blocked — select the text so the user can copy it manually
    const range=document.createRange();
    range.selectNodeContents(block);
    const sel=window.getSelection();
    sel.removeAllRanges();sel.addRange(range);
  }
}

// ═══════════════════════════════════════════════════════════
// EVENTS — one delegated click handler for every data-action element
// ═══════════════════════════════════════════════════════════
const ACTIONS={
  'home':          ()=>showWelcome(),
  'toggle-lang':   ()=>toggleLang(),
  'start':         el=>startGame(el.dataset.mode),
  'replay':        ()=>startGame(),
  'answer':        el=>handleAnswer(+el.dataset.index),
  'next':          ()=>nextRound(),
  'share-open':    ()=>openShareModal(),
  'share-close':   ()=>closeShareModal(),
  'share-copy':    ()=>copyShareText(),
  'share-backdrop':(el,e)=>{if(e.target===el) closeShareModal();},
};
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]');
  if(el) ACTIONS[el.dataset.action]?.(el,e);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape') closeShareModal();});

// ── INIT
applyLang();
show('welcome-screen');
