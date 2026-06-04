// ── 2026 Player Finalization ─────────────────────────────────
const fs = require('fs');

const raw = require('./_2026_players_raw.json');

// ── Helper ────────────────────────────────────────────────────
// Transliterate accents before stripping so 'González' → 'gonzalez' not 'gonz lez'
const norm = s => s.toLowerCase()
  .replace(/[àáâãä]/g,'a').replace(/[èéêë]/g,'e').replace(/[ìíîï]/g,'i')
  .replace(/[òóôõöø]/g,'o').replace(/[ùúûü]/g,'u').replace(/[ñ]/g,'n')
  .replace(/[ýÿ]/g,'y').replace(/[çć]/g,'c').replace(/[šş]/g,'s')
  .replace(/[žź]/g,'z').replace(/[ðđ]/g,'d').replace(/[ř]/g,'r')
  .replace(/[ğ]/g,'g').replace(/[ı]/g,'i').replace(/[œ]/g,'oe')
  .replace(/[ã]/g,'a').replace(/[ã]/g,'a')
  .replace(/[^a-z ]/g,'').replace(/\s+/g,' ').trim();
const w = name => name.replace(/ /g,'_');

// ── Expand first-name-only entries to "First Surname" ────────
// When the shirt shows only a first name (e.g. "Thomas" for Thomas Partey),
// expand it using the raw registered name. True mononyms are whitelisted.
const MONO = new Set([
  'gavi','rodri','pedri','casemiro','marquinhos','raphinha','bono','vinicius',
  'rodrygo','alisson','bremer','fabinho','richarlison','malcom','everton',
  'weverton','danilo','ederson','endrick','thiago','rayan','neymar','kaku',
  'fatawu','kamaldeen','asante','nuamah','peprah','seneya',
]);
const PARTICLES = new Set(['de','da','do','dos','das','van','von','der','el','al',
  'bin','ben','le','la','di','du','aux','of','the']);
function expandName(name, rawName) {
  const nameWords = name.trim().split(/\s+/);
  if (nameWords.length !== 1) return name;           // already multi-word, skip
  if (MONO.has(name.toLowerCase())) return name;     // true mononym, keep
  const rawWords = (rawName||'').trim().split(/\s+/);
  if (rawWords.length < 2) return name;              // no surname available
  if (norm(rawWords[0]) !== norm(name)) return name; // shirt ≠ first name, skip
  // Find first non-particle surname word
  for (let i = 1; i < rawWords.length; i++) {
    if (!PARTICLES.has(rawWords[i].toLowerCase())) {
      return `${name} ${rawWords[i]}`;
    }
  }
  return name;
}

// ── Load 2022 dataset from index.html ────────────────────────
const html = fs.readFileSync('index.html','utf8');
const re22 = /\{name:"([^"]+)",country:"([^"]+)",code:"[^"]+",pos:"[^"]+",club:"[^"]+",d:(\d),wiki:"([^"]+)"(?:,photo:"([^"]+)")?\}/g;
const map22 = {};
let m22;
while((m22=re22.exec(html))!==null){
  const p = {name:m22[1],country:m22[2],d:parseInt(m22[3]),wiki:m22[4],photo:m22[5]||null};
  map22[norm(p.name)] = p;
}
console.log('2022 players loaded:', Object.keys(map22).length);

// ── Corrections table ─────────────────────────────────────────
// format: 'raw name (lower-normalized)' → { name, d, wiki }
const FIXES = {};
function fix(rawName, name, d, wiki) {
  FIXES[norm(rawName)] = { name, d: d||3, wiki: wiki||w(name) };
}

// ── France — shirt/PDF name corrections ──────────────────────
fix('Thuram',                           'Marcus Thuram',       2, 'Marcus_Thuram');
fix('Marcus Thuram Ulien',              'Marcus Thuram',       2, 'Marcus_Thuram');
fix('Konate',                           'Ibrahima Konaté',     2, 'Ibrahima_Konaté');
fix('Zaire Emery',                      'Warren Zaïre-Emery',  2, 'Warren_Zaïre-Emery');
fix('Kouadio Kone',                     'Manu Koné',           2, 'Manu_Koné');
fix('Dayotchanculle Upamecano',         'Dayot Upamecano',     2, 'Dayot_Upamecano');
fix('Kylian Mbappe',                    'Kylian Mbappé',       1, 'Kylian_Mbappé');

// ── Ghana — shirt shows first name, but player known by full name ─
fix('Thomas',                           'Thomas Partey',       2, 'Thomas_Partey'); // d:2 — Ghana star, not casual global tier
fix('Caleb',                            'Caleb Yirenkyi',      3, 'Caleb_Yirenkyi');
// Ghana — shirt shows professional nickname, rawName is legal name
fix('Fatawu',                           'Fatawu Issahaku',     2, 'Abdul_Fatawu_Issahaku');
fix('Kamaldeen',                        'Kamaldeen Sulemana',  2, 'Kamaldeen_Sulemana');
fix('Nuamah',                           'Ernest Nuamah',       2, 'Ernest_Nuamah');
fix('Asante',                           'Solomon Asante',      3, 'Solomon_Asante');
fix('Peprah',                           'Emmanuel Oppong',     3, 'Emmanuel_Oppong');
fix('Seneya',                           'Marvin Senaya',       3, 'Marvin_Senaya');

// ── Brazil — capitalization + long names ─────────────────────
fix('Bruno Guimarães Rodriguez Moura',  'Bruno Guimarães',     2, 'Bruno_Guimarães');
fix('Lucas Tolentino Coelho de Lima',   'Lucas Lima',          2, 'Lucas_Lima_(footballer,_born_1993)');
fix('Danilo dos Santos de Oliveira',    'Danilo Souza',        3, 'Danilo_(Brazilian_footballer,_born_2001)');
fix('Thiago',                           'Thiago Almada',       3, 'Thiago_Almada');

// ── Spain — shirt shows given name only ──────────────────────
fix('Eric',                             'Eric García',         2, 'Eric_García');
fix('Eric García Martret',              'Eric García',         2, 'Eric_García');
fix('Ferran',                           'Ferran Torres',       2, 'Ferran_Torres');
fix('Yeremy',                           'Yeremy Pino',         2, 'Yeremy_Pino');
fix('Fabián',                           'Fabián Ruiz',         2, 'Fabián_Ruiz');
fix('Fabian',                           'Fabián Ruiz',         2, 'Fabián_Ruiz');
fix('Williams Jr',                      'Nico Williams',       2, 'Nico_Williams_(footballer)');

// ── Morocco ───────────────────────────────────────────────────
fix('Bono',                             'Yassine Bounou',      2, 'Yassine_Bounou');

// ── Netherlands ──────────────────────────────────────────────
fix('Memphis',                          'Memphis Depay',       2, 'Memphis_Depay');

// ── Saudi Arabia — shirt shows given name only ───────────────
fix('Salem',                            'Salem Al-Dawsari',    2, 'Salem_Al-Dawsari');
fix('Nasser',                           'Nasser Al-Dawsari',   2, 'Nasser_Al-Dawsari');

// ── South Korea — shirt shows given name (Minjae, Kangin…) ──
fix('Minjae',                           'Kim Min-jae',         2, 'Kim_Min-jae');
fix('Kangin',                           'Lee Kang-in',         2, 'Lee_Kang-in');
fix('Heungmin',                         'Son Heung-min',       1, 'Son_Heung-min');
fix('Junho',                            'Bae Junho',           2, 'Bae_Junho');
fix('Guesung',                          'Cho Gue-sung',        2, 'Cho_Gue-sung');
fix('Hyeongyu',                         'Oh Hyeon-gyu',        2, 'Oh_Hyeon-gyu');
fix('Seunggyu',                         'Kim Seung-gyu',       2, 'Kim_Seung-gyu');
fix('Moonhwan',                         'Kim Moon-hwan',       3, 'Kim_Moon-hwan');
fix('Inbeom',                           'Hwang In-beom',       2, 'Hwang_In-beom');
fix('Seungho',                          'Paik Seung-ho',       3, 'Paik_Seung-ho');
fix('Jens',                             'Jens Castrop',        3, 'Jens_Castrop');
fix('Taeseok',                          'Lee Tae-seok',        3, 'Lee_Tae-seok');
fix('Hanbeom',                          'Lee Han-beom',        3, 'Lee_Han-beom');
fix('Gihyuk',                           'Lee Gi-hyeok',        3, 'Lee_Gi-hyeok');
fix('Taehyeon',                         'Kim Tae-hyeon',       3, 'Kim_Tae-hyeon');
fix('Bumkeun',                          'Song Bum-keun',       3, 'Song_Bum-keun');
fix('Wije',                             'Cho Wi-je',           3, 'Cho_Wi-je');
fix('Jinseob',                          'Park Jin-seob',       3, 'Park_Jin-seob');
fix('Hyunjun',                          'Yang Hyun-jun',       3, 'Yang_Hyun-jun');
fix('Hyeonwoo',                         'Jo Hyeon-woo',        3, 'Jo_Hyeon-woo');
fix('Youngwoo',                         'Seol Young-woo',      3, 'Seol_Young-woo');
fix('Jingyu',                           'Kim Jin-gyu',         3, 'Kim_Jin-gyu');
fix('Jisung',                           'Eom Ji-sung',         3, 'Eom_Ji-sung');
fix('Donggyeong',                       'Lee Dong-gyeong',     3, 'Lee_Dong-gyeong');

// ── Global Stars (d:1) ────────────────────────────────────────
fix('Lionel Messi',                     'Lionel Messi',        1, 'Lionel_Messi');
fix('Cristiano Dos Santos Aveiro',       'Cristiano Ronaldo',   1, 'Cristiano_Ronaldo');
fix('Kylian Mbappe Lottin',             'Kylian Mbappé',       1, 'Kylian_Mbappé');
fix('Neymar Junior',                    'Neymar Jr',           1, 'Neymar');
fix('Neymar Da Silva Santos Junior',    'Neymar Jr',           1, 'Neymar');
fix('Vinicius Paixão de Oliveira Júnior','Vinícius Júnior',    1, 'Vinícius_Júnior');
fix('Vinicius Paixao de Oliveira Junior','Vinícius Júnior',    1, 'Vinícius_Júnior');
fix('Erling Haaland',                   'Erling Haaland',      1, 'Erling_Haaland');
fix('Martin Odegaard',                  'Martin Ødegaard',     2, 'Martin_Ødegaard');
fix('Martín ØDegaard',                  'Martin Ødegaard',     2, 'Martin_Ødegaard');
fix('Jude Bellingham',                  'Jude Bellingham',     1, 'Jude_Bellingham');
fix('Rodri',                            'Rodri',               1, 'Rodri_(footballer)');
fix('Rodrigo Hernandez Cascante',       'Rodri',               1, 'Rodri_(footballer)');
fix('Kevin De Bruyne',                  'Kevin De Bruyne',     1, 'Kevin_De_Bruyne');
fix('Kevin de Bruyne',                  'Kevin De Bruyne',     1, 'Kevin_De_Bruyne');
fix('Harry Kane',                       'Harry Kane',          1, 'Harry_Kane');
fix('Mohamed Salah Ghaly',              'Mohamed Salah',       1, 'Mohamed_Salah');
fix('Mohamed Salah',                    'Mohamed Salah',       1, 'Mohamed_Salah');
fix('Son Heung-min',                    'Son Heung-min',       1, 'Son_Heung-min');
fix('Son Heungmin',                     'Son Heung-min',       1, 'Son_Heung-min');
fix('Lautaro Martinez',                 'Lautaro Martínez',    1, 'Lautaro_Martínez');
fix('Lautaro Javier Martinez',          'Lautaro Martínez',    1, 'Lautaro_Martínez');
fix('Pedri',                            'Pedri',               1, 'Pedri');
fix('Pedro Gonzalez Lopez',             'Pedri',               1, 'Pedri');
fix('Gavi',                             'Gavi',                1, 'Gavi_(footballer)');
fix('Pablo Martin Paez Gavira',         'Gavi',                1, 'Gavi_(footballer)');

// ── d:2 name corrections ──────────────────────────────────────
fix('Diogo Meireles da Costa',          'Diogo Costa',         2, 'Diogo_Costa_(goalkeeper)');
fix('Rodrigo Goes',                     'Rodrygo',             2, 'Rodrygo');
fix('Rodrygo Goes',                     'Rodrygo',             2, 'Rodrygo');
fix('Endrick Felipe Moreira de Sousa',  'Endrick',             2, 'Endrick_(footballer)');
fix('Rafael Alexandre Conceicao Leao', 'Rafa Leão',           2, 'Rafael_Leão');
fix('Rafael Alexandre Conceição Leão', 'Rafa Leão',           2, 'Rafael_Leão');
fix('Rafa Leão',                       'Rafa Leão',           2, 'Rafael_Leão');
fix('Rafael da Conceição Leão',        'Rafa Leão',           2, 'Rafael_Leão');
fix('Bruno Miguel Borges Fernandes',    'Bruno Fernandes',     2, 'Bruno_Fernandes');
fix('Ruben dos Santos Gato Alves Dias', 'Rúben Dias',         2, 'Rúben_Dias');
fix('Rúben dos Santos Gato Alves Dias', 'Rúben Dias',         2, 'Rúben_Dias');
// Portugal — full last names from PDF not caught by shirt extraction
fix('Nelson Cabral Semedo',             'Nélson Semedo',       2, 'Nélson_Semedo');
fix('Nélson Cabral Semedo',            'Nélson Semedo',       2, 'Nélson_Semedo');
fix('Tomas Lemos Araujo',              'Tomás Araújo',        2, 'Tomás_Araújo');
fix('Tomás Lemos Araújo',             'Tomás Araújo',        2, 'Tomás_Araújo');
fix('Bruno Borges Fernandes',          'Bruno Fernandes',     2, 'Bruno_Fernandes');
fix('Goncalo Bernardo Inacio',         'Gonçalo Inácio',      2, 'Gonçalo_Inácio');
fix('Gonçalo Bernardo Inácio',        'Gonçalo Inácio',      2, 'Gonçalo_Inácio');
fix('Goncalo Ganchinho Guedes',        'Gonçalo Guedes',      2, 'Gonçalo_Guedes');
fix('Gonçalo Ganchinho Guedes',       'Gonçalo Guedes',      2, 'Gonçalo_Guedes');
fix('Ruben da Silva Neves',            'Rúben Neves',         2, 'Rúben_Neves');
fix('Rúben da Silva Neves',           'Rúben Neves',         2, 'Rúben_Neves');
fix('Francisco Fernandes da Conceicao','Francisco Conceição', 2, 'Francisco_Conceição');
fix('Francisco Fernandes da Conceição','Francisco Conceição', 2, 'Francisco_Conceição');
fix('Nuno Tavares Mendes',             'Nuno Mendes',         2, 'Nuno_Mendes');
fix('Jose Dalot Teixeira',             'Diogo Dalot',         2, 'Diogo_Dalot');
fix('José Dalot',                      'Diogo Dalot',         2, 'Diogo_Dalot');
fix('Jose Malheiro de Sa',             'José Sá',             2, 'José_Sá_(goalkeeper)');
fix('José Malheiro de Sá',            'José Sá',             2, 'José_Sá_(goalkeeper)');
fix('Pedro Lomba Neto',               'Pedro Neto',          2, 'Pedro_Neto_(footballer)');
fix('Vitinha',                         'Vitinha',             2, 'Vitinha_(footballer)');
fix('Vítor Machado Ferreira',          'Vitinha',             2, 'Vitinha_(footballer)');
fix('João Neves',                      'João Neves',          2, 'João_Neves_(footballer)');
fix('Joao Neves',                      'João Neves',          2, 'João_Neves_(footballer)');
fix('Pedro Correia',                   'Pedro Neto',          2, 'Pedro_Neto_(footballer)');
// Brazil
fix('Bruno Guimaraes Rodriguez Moura', 'Bruno Guimarães',    2, 'Bruno_Guimarães');
fix('Bruno Guimarães Rodriguez Moura','Bruno Guimarães',     2, 'Bruno_Guimarães');
fix('Danilo dos Santos de Oliveira',   'Danilo Souza',        3, 'Danilo_Souza_(footballer)');
fix('Igor Nascimento Rodrigues',       'Igor Thiago',         3, 'Igor_Thiago');
fix('Gabriel Teodoro Martinelli Silva','Gabriel Martinelli',  2, 'Gabriel_Martinelli');
fix('Gleison Silva Nascimento',        'Bremer',              2, 'Bremer_(footballer)');
fix('Ederson Santana de Moraes',       'Ederson',             2, 'Ederson_(footballer,_born_1993)');
fix('Roger Ibanez da Silva',           'Roger Ibañez',        2, 'Roger_Ibañez');
fix('Weverton Pereira da Silva',       'Weverton',            2, 'Weverton_(footballer,_born_1987)');
fix('Alex Lobo Silva',                 'Alex Sandro',         2, 'Alex_Sandro');
fix('Matheus Santos Carneiro da Cunha','Matheus Cunha',       2, 'Matheus_Cunha');
fix('Vinicius Paixao de Oliveira Junior','Vinícius Júnior',   1, 'Vinícius_Júnior');
fix('Vinicius Paixão de Oliveira Júnior','Vinícius Júnior',  1, 'Vinícius_Júnior');
fix('Diogo Jose Teixeira da Silva',     'Diogo Jota',          2, 'Diogo_Jota');
fix('Diogo José Teixeira da Silva',     'Diogo Jota',          2, 'Diogo_Jota');
fix('Joao Felix Sequeira',              'João Félix',          2, 'João_Félix');
fix('João Félix Sequeira',              'João Félix',          2, 'João_Félix');
fix('Joao Cancelo',                     'João Cancelo',        2, 'João_Cancelo');
fix('Bernardo Mota Veiga de Carvalho e Silva','Bernardo Silva',2, 'Bernardo_Silva');
fix('Ruben Diogo da Silva Neves',       'Rúben Neves',         2, 'Rúben_Neves');
fix('Gonçalo Matias Ramos',             'Gonçalo Ramos',       2, 'Gonçalo_Ramos');
fix('Goncalo Matias Ramos',             'Gonçalo Ramos',       2, 'Gonçalo_Ramos');
fix('Joao Pedro Cavaco Cancelo',        'João Cancelo',        2, 'João_Cancelo');

// Brazil
fix('Alisson Becker',                   'Alisson',             2, 'Alisson_Becker');
fix('Alisson Ramses Becker',            'Alisson',             2, 'Alisson_Becker');
fix('Álisson Ramses Becker',            'Alisson',             2, 'Alisson_Becker');
fix('Marquinhos',                       'Marquinhos',          2, 'Marquinhos');
fix('Marcos Aoas Correa',               'Marquinhos',          2, 'Marquinhos');
fix('Casemiro',                         'Casemiro',            2, 'Casemiro');
fix('Carlos Henrique Casimiro',         'Casemiro',            2, 'Casemiro');
fix('Richarlison de Andrade',           'Richarlison',         2, 'Richarlison');
fix('Gabriel Magalhaes',                'Gabriel Magalhães',   2, 'Gabriel_Magalhães');
fix('Gabriel Dos Santos Magalhaes',    'Gabriel Magalhães',   2, 'Gabriel_Magalhães');
fix('Gabriel Dos Santos Magalhães',    'Gabriel Magalhães',   2, 'Gabriel_Magalhães');
fix('Gabriel Barbosa Almeida',          'Gabigol',             2, 'Gabriel_Barbosa');
fix('Raphael Dias Belloli',             'Raphinha',            2, 'Raphinha');
fix('Raphinha',                         'Raphinha',            2, 'Raphinha');
fix('Lucas Tolentino Coelho de Lima',   'Paquetá',             2, 'Lucas_Paquetá');
fix('Lucas Tolentino Coelho de Lima',   'Lucas Paquetá',       2, 'Lucas_Paquetá');
fix('Gabriel Moura',                    'Gabriel Moura',       3, 'Gabriel_Moura');
fix('Savinho',                          'Savinho',             2, 'Savinho_(footballer)');
fix('Gabriel Verón',                    'Savinho',             2, 'Savinho_(footballer)');
fix('Estevao Willian Gomes',            'Estêvão',             2, 'Estêvão_Willian');
fix('Estêvão Willian Gomes',            'Estêvão',             2, 'Estêvão_Willian');

// France
fix('Antoine Griezmann',                'Antoine Griezmann',   1, 'Antoine_Griezmann');
fix('Aurelien Tchouameni',              'Aurélien Tchouaméni', 2, 'Aurélien_Tchouaméni');
fix('Aurélien Tchouaméni',              'Aurélien Tchouaméni', 2, 'Aurélien_Tchouaméni');
fix('William Saliba',                   'William Saliba',      2, 'William_Saliba');
fix('Ousmane Dembele',                  'Ousmane Dembélé',     2, 'Ousmane_Dembélé');
fix('Ousmane Dembélé',                  'Ousmane Dembélé',     2, 'Ousmane_Dembélé');
fix('Mike Maignan',                     'Mike Maignan',        2, 'Mike_Maignan');
fix('Theo Hernandez',                   'Théo Hernández',      2, 'Théo_Hernández');
fix('Théo Hernández',                   'Théo Hernández',      2, 'Théo_Hernández');
fix('Eduardo Camavinga',                'Eduardo Camavinga',   2, 'Eduardo_Camavinga');
fix('Marcus Thuram',                    'Marcus Thuram',       2, 'Marcus_Thuram');
fix('Randal Kolo Muani',                'Randal Kolo Muani',   2, 'Randal_Kolo_Muani');

// England
fix('Declan Rice',                      'Declan Rice',         2, 'Declan_Rice');
fix('Trent Alexander-Arnold',           'Trent Alexander-Arnold',2,'Trent_Alexander-Arnold');
fix('Trent Alexander Arnold',           'Trent Alexander-Arnold',2,'Trent_Alexander-Arnold');
fix('Phil Foden',                       'Phil Foden',          2, 'Phil_Foden');
fix('Bukayo Saka',                      'Bukayo Saka',         2, 'Bukayo_Saka');
fix('Jordan Pickford',                  'Jordan Pickford',     2, 'Jordan_Pickford');
fix('Jordan Lee Pickford',              'Jordan Pickford',     2, 'Jordan_Pickford');

// Germany
fix('Joshua Kimmich',                   'Joshua Kimmich',      2, 'Joshua_Kimmich');
fix('Jamal Musiala',                    'Jamal Musiala',       1, 'Jamal_Musiala');
fix('Florian Wirtz',                    'Florian Wirtz',       1, 'Florian_Wirtz');
fix('Manuel Neuer',                     'Manuel Neuer',        1, 'Manuel_Neuer');
fix('Thibaut Courtois',                 'Thibaut Courtois',    2, 'Thibaut_Courtois');
fix('Niclas Fullkrug',                  'Niclas Füllkrug',     2, 'Niclas_Füllkrug');
fix('Niclas Füllkrug',                  'Niclas Füllkrug',     2, 'Niclas_Füllkrug');
fix('Antonio Rudiger',                  'Antonio Rüdiger',     2, 'Antonio_Rüdiger');
fix('Antonio Rüdiger',                  'Antonio Rüdiger',     2, 'Antonio_Rüdiger');
fix('Leon Goretzka',                    'Leon Goretzka',       2, 'Leon_Goretzka');
fix('Kai Havertz',                      'Kai Havertz',         2, 'Kai_Havertz');

// Argentina
fix('Emiliano Martinez',                'Emiliano Martínez',   2, 'Emiliano_Martínez');
fix('Emiliano Adrian Martinez',         'Emiliano Martínez',   2, 'Emiliano_Martínez');
fix('Damian Martinez',                  'Emiliano Martínez',   2, 'Emiliano_Martínez');
fix('Damián Martínez',                  'Emiliano Martínez',   2, 'Emiliano_Martínez');
fix('Enzo Fernandez',                   'Enzo Fernández',      2, 'Enzo_Fernández');
fix('Rodrigo De Paul',                  'Rodrigo De Paul',     2, 'Rodrigo_De_Paul');
fix('Marcos Acuna',                     'Marcos Acuña',        2, 'Marcos_Acuña');
fix('Nicolas Tagliafico',               'Nicolás Tagliafico',  2, 'Nicolás_Tagliafico');
fix('Julian Alvarez',                   'Julián Álvarez',      2, 'Julián_Álvarez');
fix('Paulo Dybala',                     'Paulo Dybala',        2, 'Paulo_Dybala');

// Spain
fix('Marc Andre ter Stegen',            'Marc-André ter Stegen',2,'Marc-André_ter_Stegen');
fix('Alvaro Morata',                    'Álvaro Morata',       2, 'Álvaro_Morata');
fix('Mikel Oyarzabal',                  'Mikel Oyarzabal',     2, 'Mikel_Oyarzabal');
fix('Dani Olmo',                        'Dani Olmo',           2, 'Dani_Olmo');
fix('Alejandro Grimaldo Garcia',        'Alejandro Grimaldo',  2, 'Alejandro_Grimaldo');
fix('Alejandro Grimaldo García',        'Alejandro Grimaldo',  2, 'Alejandro_Grimaldo');
fix('Lamine Yamal',                     'Lamine Yamal',        1, 'Lamine_Yamal');
fix('Lamine Yamal Nasraoui Ebana',      'Lamine Yamal',        1, 'Lamine_Yamal');
fix('Nico Williams Arthuer',            'Nico Williams',       2, 'Nico_Williams_(footballer)');

// Netherlands
fix('Virgil Van Dijk',                  'Virgil van Dijk',     1, 'Virgil_van_Dijk');
fix('Virgil van Dijk',                  'Virgil van Dijk',     1, 'Virgil_van_Dijk');
fix('Cody Gakpo',                       'Cody Gakpo',          2, 'Cody_Gakpo');
fix('Tijjani Reijnders',                'Tijjani Reijnders',   2, 'Tijjani_Reijnders');
fix('Frenkie De Jong',                  'Frenkie de Jong',     2, 'Frenkie_de_Jong');
fix('Frenkie de Jong',                  'Frenkie de Jong',     2, 'Frenkie_de_Jong');
fix('Xavi Simons',                      'Xavi Simons',         2, 'Xavi_Simons');
fix('Ryan Gravenberch',                 'Ryan Gravenberch',    2, 'Ryan_Gravenberch');

// Morocco
fix('Achraf Hakimi',                    'Achraf Hakimi',       1, 'Achraf_Hakimi');
fix('Sofyan Amrabat',                   'Sofyan Amrabat',      2, 'Sofyan_Amrabat');
fix('Youssef En-Nesyri',                'Youssef En-Nesyri',   2, 'Youssef_En-Nesyri');
fix('Bono',                             'Bono',                2, 'Yassine_Bounou');
fix('Yassine Bounou',                   'Yassine Bounou',      2, 'Yassine_Bounou');
fix('Brahim',                           'Brahim Díaz',         2, 'Brahim_Díaz');
fix('Brahim Abdelkader Díaz',           'Brahim Díaz',         2, 'Brahim_Díaz');

// Japan
fix('Wataru Endo',                      'Wataru Endo',         2, 'Wataru_Endo');
fix('Takefusa Kubo',                    'Takefusa Kubo',       2, 'Takefusa_Kubo');
fix('Kaoru Mitoma',                     'Kaoru Mitoma',        2, 'Kaoru_Mitoma');
fix('Ritsu Doan',                       'Ritsu Dōan',          2, 'Ritsu_Dōan');

// USA
fix('Christian Pulisic',                'Christian Pulisic',   2, 'Christian_Pulisic');
fix('Gio Reyna',                        'Giovanni Reyna',      2, 'Gio_Reyna');
fix('Giovanni Reyna',                   'Giovanni Reyna',      2, 'Gio_Reyna');
fix('Folarin Balogun',                  'Folarin Balogun',     2, 'Folarin_Balogun');
fix('Tyler Adams',                      'Tyler Adams',         2, 'Tyler_Adams_(soccer)');
fix('Yunus Musah',                      'Yunus Musah',         2, 'Yunus_Musah');
fix('Matt Turner',                      'Matt Turner',         2, 'Matt_Turner_(soccer_player)');

// Mexico
fix('Guillermo Ochoa',                  'Guillermo Ochoa',     2, 'Guillermo_Ochoa');
fix('Santiago Gimenez',                 'Santiago Giménez',    2, 'Santiago_Giménez');
fix('Santiago Giménez',                 'Santiago Giménez',    2, 'Santiago_Giménez');

// Spain (fixes for full legal names)
fix('Pedro Gonzalez Lopez',             'Pedri',               1, 'Pedri');
fix('Rodrigo Hernandez Cascante',       'Rodri',               1, 'Rodri_(footballer)');
fix('Lamine Nasraoui Ebana',            'Lamine Yamal',        1, 'Lamine_Yamal');
fix('Nicholas Williams Arthuer',        'Nico Williams',        2, 'Nico_Williams_(footballer)');
fix('Martin Zubimendi Ibanez',          'Martín Zubimendi',    2, 'Martín_Zubimendi');
fix('Mikel Oyarzabal Ugarte',           'Mikel Oyarzabal',     2, 'Mikel_Oyarzabal');
fix('Marc Cucurella Saseta',            'Marc Cucurella',      2, 'Marc_Cucurella');
fix('Pau Cubarsi I Paredes',            'Pau Cubarsí',         2, 'Pau_Cubarsí');
fix('Aymeric Laporte',                  'Aymeric Laporte',     2, 'Aymeric_Laporte');
fix('Alvaro Morata',                    'Álvaro Morata',       2, 'Álvaro_Morata');
fix('Alvaro Morata Martin',             'Álvaro Morata',       2, 'Álvaro_Morata');
fix('Dani Olmo Carvajal',               'Dani Olmo',           2, 'Dani_Olmo');
fix('Ferran Torres Garcia',             'Ferran Torres',       2, 'Ferran_Torres');
fix('Pedri Gonzalez Lopez',             'Pedri',               1, 'Pedri');

// France (more)
fix('Masour Dembele',                   'Ousmane Dembélé',     2, 'Ousmane_Dembélé');
fix('Marcus Thuram Ulien',              'Marcus Thuram',       2, 'Marcus_Thuram');
fix('Ngolo Kante',                      "N'Golo Kanté",        2, "N'Golo_Kanté");
fix('Bradley Barcola',                  'Bradley Barcola',     2, 'Bradley_Barcola');
fix('Warren Zaïre-Emery',              'Warren Zaïre-Emery',  2, 'Warren_Zaïre-Emery');
fix('Warren Zaire-Emery',              'Warren Zaïre-Emery',  2, 'Warren_Zaïre-Emery');
fix('Desire Doue',                      'Désiré Doué',         2, 'Désiré_Doué');
fix('Michael Olise',                    'Michael Olise',       2, 'Michael_Olise');

// Croatia (broken special chars from PDF)
fix('Dominik Livakovic',                'Dominik Livaković',   2, 'Dominik_Livaković');
fix('Dominik Livakovi',                 'Dominik Livaković',   2, 'Dominik_Livaković');
fix('Jo Gvardiol',                      'Joško Gvardiol',      2, 'Joško_Gvardiol');
fix('Josip Stani I',                    'Josip Stanišić',      2, 'Josip_Stanišić');
fix('Josip Stani S I',                  'Josip Stanišić',      2, 'Josip_Stanišić');
fix('Marin Pongra I',                   'Marin Pongračić',     2, 'Marin_Pongračić');
fix('Marin Pongra C I',                 'Marin Pongračić',     2, 'Marin_Pongračić');
fix('Duje Aletacar',                    'Duje Ćaleta-Car',     2, 'Duje_Ćaleta-Car');
fix('Josip Utalo',                      'Josip Šutalo',        2, 'Josip_Šutalo');
fix('Borna S Osa',                      'Borna Sosa',          2, 'Borna_Sosa');
fix('Ivan Peri I',                      'Ivan Perišić',        2, 'Ivan_Perišić');
fix('Ivan Peri S I',                    'Ivan Perišić',        2, 'Ivan_Perišić');
fix('Luka Modri',                       'Luka Modrić',         1, 'Luka_Modrić');
fix('Luka Modric',                      'Luka Modrić',         1, 'Luka_Modrić');
fix('Andrej Kramari',                   'Andrej Kramarić',     2, 'Andrej_Kramarić');
fix('Mario Pasali',                     'Mario Pašalić',       2, 'Mario_Pašalić');
fix('Nikola Vlasi',                     'Nikola Vlašić',       2, 'Nikola_Vlašić');
fix('Bruno Petkovi',                    'Bruno Petković',      2, 'Bruno_Petković');
fix('Ivica Ivusi',                      'Ivica Ivušić',        2, 'Ivica_Ivušić');
fix('Lovro Majer',                      'Lovro Majer',         2, 'Lovro_Majer');
fix('Luka Susi',                        'Luka Sučić',          2, 'Luka_Sučić');
// Croatia — split-char variants (PDF extracts Ć Š Č as separate items)
fix('Luka Modri C',                     'Luka Modrić',         1, 'Luka_Modrić');
fix('Josip Stani S I C',                'Josip Stanišić',      2, 'Josip_Stanišić');
fix('Josip Stani I C',                  'Josip Stanišić',      2, 'Josip_Stanišić');
fix('Marin Pongra C I C',               'Marin Pongračić',     2, 'Marin_Pongračić');
fix('Duje C Aleta-Car',                 'Duje Ćaleta-Car',     2, 'Duje_Ćaleta-Car');
fix('Josip S Utalo',                    'Josip Šutalo',        2, 'Josip_Šutalo');
fix('Andrej Kramari C',                 'Andrej Kramarić',     2, 'Andrej_Kramarić');
fix('Mario Pasali C',                   'Mario Pašalić',       2, 'Mario_Pašalić');
fix('Nikola Vlasi C',                   'Nikola Vlašić',       2, 'Nikola_Vlašić');
fix('Ivan Peri S I C',                  'Ivan Perišić',        2, 'Ivan_Perišić');
fix('Lovro Majer',                      'Lovro Majer',         2, 'Lovro_Majer');
fix('Luka Su C I C',                    'Luka Sučić',          2, 'Luka_Sučić');

// Argentina
fix('Damián Martínez',                  'Damián Martínez',     2, 'Damián_Martínez');
fix('Damian Martinez',                  'Damián Martínez',     2, 'Damián_Martínez');
fix('Alexis Mac Allister',              'Alexis Mac Allister', 2, 'Alexis_Mac_Allister');
fix('Nahuel Molina Lucero',             'Nahuel Molina',       2, 'Nahuel_Molina');
fix('Geronimo Rulli',                   'Gerónimo Rulli',      2, 'Gerónimo_Rulli');
fix('Cristian Gabriel Romero',          'Cristian Romero',     2, 'Cristian_Romero');

// England
fix('Eberechi Eze',                     'Eberechi Eze',        2, 'Eberechi_Eze');
fix('Oliver Watkins',                   'Oliver Watkins',      2, 'Oliver_Watkins');
fix('Reece James',                      'Reece James',         2, 'Reece_James');
fix('Kobbie Mainoo',                    'Kobbie Mainoo',       2, 'Kobbie_Mainoo');
fix('Marcus Rashford',                  'Marcus Rashford',     2, 'Marcus_Rashford');
fix('Jordan Henderson',                 'Jordan Henderson',    2, 'Jordan_Henderson');
fix('Kyle Walker',                      'Kyle Walker',         2, 'Kyle_Walker');
fix('John Stones',                      'John Stones',         2, 'John_Stones');

// Belgium
fix('Romelu Lukaku Menama',             'Romelu Lukaku',       2, 'Romelu_Lukaku');
fix('Romelu Menama Lukaku Bolingoli',   'Romelu Lukaku',       2, 'Romelu_Lukaku');
fix('Romelu Lukaku Bolingoli',          'Romelu Lukaku',       2, 'Romelu_Lukaku');
fix('Youri Tielemans',                  'Youri Tielemans',     2, 'Youri_Tielemans');
fix('Timothy Castagne',                 'Timothy Castagne',    2, 'Timothy_Castagne');
fix('Thomas Meunier',                   'Thomas Meunier',      2, 'Thomas_Meunier');

// South Korea
fix('Son Heung Min',                    'Son Heung-min',       1, 'Son_Heung-min');
fix('Hwang Hee Chan',                   'Hwang Hee-chan',      2, 'Hwang_Hee-chan');
fix('Lee Kang In',                      'Lee Kang-in',         2, 'Lee_Kang-in');
fix('Kim Min Jae',                      'Kim Min-jae',         2, 'Kim_Min-jae');

// Senegal
fix('Sadio Mane',                       'Sadio Mané',          1, 'Sadio_Mané');
fix('Sadio Mane',                       'Sadio Mané',          1, 'Sadio_Mané');
fix('Kalidou Koulibaly',                'Kalidou Koulibaly',   2, 'Kalidou_Koulibaly');
fix('Edouard Mendy',                    'Édouard Mendy',       2, 'Édouard_Mendy');
fix('Ismaila Sarr',                     'Ismaïla Sarr',        2, 'Ismaïla_Sarr');
fix('Nicolas Jackson',                  'Nicolas Jackson',     2, 'Nicolas_Jackson');

// Uruguay — strip maternal surname
fix('Sergio Rochet Alvarez',            'Sergio Rochet',       2, 'Sergio_Rochet');
fix('José Giménez de Vargas',           'José Giménez',        2, 'José_Giménez');
fix('Sebastián Cáceres Ramos',          'Sebastián Cáceres',   2, 'Sebastián_Cáceres');
fix('Ronald Araújo da Silva',           'Ronald Araújo',       2, 'Ronald_Araújo');
fix('Manuel Ugarte Ribeiro',            'Manuel Ugarte',       2, 'Manuel_Ugarte');
fix('Rodrigo Bentancur Colmán',         'Rodrigo Bentancur',   2, 'Rodrigo_Bentancur');
fix('Diego de la Cruz Arcosa',          'Diego de la Cruz',    2, 'Diego_de_la_Cruz');
fix('Federico Valverde Dipetta',        'Federico Valverde',   1, 'Federico_Valverde');
fix('Darwin Nuñez Ribeiro',             'Darwin Núñez',        2, 'Darwin_Núñez');
fix('Giorgian de Arrascaeta Benedetti', 'Giorgian de Arrascaeta', 2, 'Giorgian_de_Arrascaeta');
fix('Facundo Pellistri Rebollo',        'Facundo Pellistri',   2, 'Facundo_Pellistri');
fix('Guillermo Varela Olivera',         'Guillermo Varela',    2, 'Guillermo_Varela');
fix('Emiliano Martínez Toranza',        'Emiliano Martínez',   2, 'Emiliano_Martínez_(goalkeeper)');
fix('Mathías Olivera Miramontes',       'Mathías Olivera',     2, 'Mathías_Olivera');
fix('Matías Viña Susperreguy',          'Matías Viña',         2, 'Matías_Viña');
fix('Maximiliano Araújo Vilches',       'Maximiliano Araújo',  2, 'Maximiliano_Araújo');
fix('Nestor Muslera Micol',             'Fernando Muslera',    2, 'Fernando_Muslera');
fix('Santiago Bueno Sciutto',           'Santiago Bueno',      2, 'Santiago_Bueno');
fix('Joaquin Piquerez Moreira',         'Joaquín Piquerez',    2, 'Joaquín_Piquerez');
fix('Radrigo Zalazar Martinez',         'Rodrigo Zalazar',     2, 'Rodrigo_Zalazar');
fix('Paul Rodríguez Bravo',             'Paul Rodríguez',      3, 'Paul_Rodríguez');
fix('Juan Sanabria Magolé',             'Juan Sanabria',       3, 'Juan_Sanabria');
fix('Rodrigo Aguirre Soto',             'Rodrigo Aguirre',     2, 'Rodrigo_Aguirre');
fix('Federico Viñas Barboza',           'Federico Viñas',      2, 'Federico_Viñas');
fix('Santiago Mele Castañero',          'Santiago Mele',       2, 'Santiago_Mele');
fix('Agustin Canobbio',                 'Agustín Canobbio',    2, 'Agustín_Canobbio');

// Mexico — strip maternal surname + fix capitalization
fix('Raúl',                            'Raúl Jiménez',        2, 'Raúl_Jiménez');
fix('Raúl Jiménez Rodríguez',          'Raúl Jiménez',        2, 'Raúl_Jiménez');
fix('José Rangel Aguilar',             'José Rangel',         3, 'José_Rangel');
fix('Jorge Sánchez Ramos',             'Jorge Sánchez',       3, 'Jorge_Sánchez');
fix('César Montes Castro',             'César Montes',        2, 'César_Montes');
fix('Edson ÁLvarez Velázquez',         'Edson Álvarez',       2, 'Edson_Álvarez');
fix('Johan Vásquez Ibarra',            'Johan Vásquez',       2, 'Johan_Vásquez');
fix('Erik Lira Méndez',                'Erik Lira',           3, 'Erik_Lira');
fix('Luis Romo Barrón',                'Luis Romo',           3, 'Luis_Romo');
fix('ÁLvaro Fidalgo',                  'Álvaro Fidalgo',      2, 'Álvaro_Fidalgo');
fix('Ernesto Vega Rojas',              'Ernesto Vega',        3, 'Ernesto_Vega');
fix('Carlos Acevedo López',            'Carlos Acevedo',      3, 'Carlos_Acevedo');
fix('Francisco Ochoa Magaña',          'Guillermo Ochoa',     2, 'Guillermo_Ochoa');
fix('Armando González Alba',           'Armando González',    3, 'Armando_González');
fix('Israel Reyes Romero',             'Israel Reyes',        3, 'Israel_Reyes');
fix('Julián Quiñones Quiñones',        'Julián Quiñones',     3, 'Julián_Quiñones');
fix('Gilberto Mora Zambrano',          'Gilberto Mora',       3, 'Gilberto_Mora');
fix('Mateo Chávez García',             'Mateo Chávez',        3, 'Mateo_Chávez');
fix('César Huerta Valera',             'César Huerta',        3, 'César_Huerta');
fix('Guillermo Martínez Ayala',        'Guillermo Martínez',  3, 'Guillermo_Martínez');
fix('Jesús Gallardo Vasconcelos',      'Jesús Gallardo',      3, 'Jesús_Gallardo');
fix('Luis Chávez Magallón',            'Luis Chávez',         3, 'Luis_Chávez');
fix('Roberto Alvarado Hernández',      'Roberto Alvarado',    3, 'Roberto_Alvarado');

// Colombia — strip maternal surname + fix special chars
fix('Daniel Muñoz Mejia',              'Daniel Muñoz',        2, 'Daniel_Muñoz_(footballer)');
fix('Jhon Lucumi Bonilla',             'Jhon Lucumí',         2, 'Jhon_Lucumí');
fix('Kevin Castaño Gil',               'Kevin Castaño',       2, 'Kevin_Castaño');
fix('Jhon Arias Andrade',              'Jhon Arias',          2, 'Jhon_Arias_(footballer)');
fix('Camilo Vargas Gil',               'Camilo Vargas',       2, 'Camilo_Vargas');
fix('Yerry Mina Gonzalez',             'Yerry Mina',          2, 'Yerry_Mina');
fix('Jefferson Lerma Solis',           'Jefferson Lerma',     2, 'Jefferson_Lerma');
fix('Johan Mojica Palacio',            'Johan Mojica',        2, 'Johan_Mojica');
fix('Willer Ditta Perez',              'Willer Ditta',        2, 'Willer_Ditta');
fix('Juan Hernandez Suarez',           'Juan Hernández',      2, 'Juan_Hernández');
fix('Carlos Gómez Hinestroza',         'Carlos Gómez',        2, 'Carlos_Gómez');
fix('ÁLvaro Montero',                  'Álvaro Montero',      2, 'Álvaro_Montero');
fix('Cordoba',                         'Jhon Córdoba',        2, 'Jhon_Córdoba');
fix('Sanchez',                         'Davinson Sánchez',    2, 'Davinson_Sánchez');
fix('James',                           'James Rodríguez',     2, 'James_Rodríguez');
fix('Luis Diaz Marulanda',             'Luis Díaz',           2, 'Luis_Díaz_(footballer)');
fix('Luis Díaz Marulanda',             'Luis Díaz',           2, 'Luis_Díaz_(footballer)');

// Ecuador
fix('Anthony Valencia Bajaña',         'Anthony Valencia',    2, 'Anthony_Valencia');
fix('Enner Valencia Lastra',           'Enner Valencia',      2, 'Enner_Valencia');
fix('Jordy Caicedo Medina',            'Jordy Caicedo',       2, 'Jordy_Caicedo');
fix('Moisés Caicedo Corozo',           'Moisés Caicedo',      2, 'Moisés_Caicedo');
fix('ÁNgelo Preciado',                 'Ángelo Preciado',     2, 'Ángelo_Preciado');

// Paraguay
fix('Diego Gomez Amarilla',            'Diego Gómez',         2, 'Diego_Gómez_(footballer)');
fix('Miguel Almirón Rejala',           'Miguel Almirón',      2, 'Miguel_Almirón');
fix('Gustavo Gómez Portillo',          'Gustavo Gómez',       2, 'Gustavo_Gómez_(footballer)');
fix('Alejandro Romero Gamarra',        'Kaku',                2, 'Alejandro_Romero_Gamarra');

// Bosnia — broken special chars (Ć/Š/Ž/Č split by PDF)
fix('Mujaki Ć',                        'Nihad Mujakić',       3, 'Nihad_Mujakić');
fix('Had Ž Ikaduni Ć',                 'Dennis Hadžikadunić', 2, 'Dennis_Hadžikadunić');
fix('Muharemovi Ć',                    'Tarik Muharemović',   3, 'Tarik_Muharemović');
fix('Kola Š Inac',                     'Sead Kolasinac',      2, 'Sead_Kolasinac');
fix('Tahirovi Ć',                      'Benjamin Tahirović',  2, 'Benjamin_Tahirović');
fix('Dedi Ć',                          'Amar Dedić',          3, 'Amar_Dedić');
fix('Gigovi Ć',                        'Armin Gigović',       3, 'Armin_Gigović');
fix('Ba Ž Dar',                        'Samed Baždar',        3, 'Samed_Baždar');
fix('Demirovi Ć',                      'Ermedin Demirović',   2, 'Ermedin_Demirović');
fix('D Ž Eko',                         'Edin Džeko',          2, 'Edin_Džeko');
fix('Ba Š I Ć',                        'Ivan Bašić',          3, 'Ivan_Bašić');
fix('Š Unji Ć',                        'Ivan Šunjić',         2, 'Ivan_Šunjić');
fix('Memi Ć',                          'Amar Memić',          3, 'Amar_Memić');
fix('Had Ž Iahmetovi Ć',               'Amir Hadžiahmetović', 2, 'Amir_Hadžiahmetović');
fix('Burni Ć',                         'Burnić',              3, 'Burnić');
fix('Alajbegovi Ć',                    'Kerim Alajbegović',   3, 'Kerim_Alajbegović');
fix('Bajraktarevi Ć',                  'Esmir Bajraktarević', 3, 'Esmir_Bajraktarević');
fix('Radelji Ć',                       'Stjepan Radeljić',    3, 'Stjepan_Radeljić');
fix('Zlomisli Ć',                      'Martin Zlomislić',    3, 'Martin_Zlomislić');
fix('Tabakovi Ć',                      'Haris Tabakovic',     3, 'Haris_Tabakovic');
fix('Č Elik',                          'Nidal Čelik',         3, 'Nidal_Čelik');
fix('Luki Ć',                          'Jovo Lukić',          3, 'Jovo_Lukić');
fix('Mahmi Ć',                         'Ermin Mahmić',        3, 'Ermin_Mahmić');

// Croatia — broken special chars + truncated first names
fix('Jo Gvardiol',                     'Joško Gvardiol',      2, 'Joško_Gvardiol');
fix('Livakovi Ć',                      'Dominik Livaković',   2, 'Dominik_Livaković');
fix('Stani Š I Ć',                     'Josip Stanišić',      2, 'Josip_Stanišić');
fix('Pongra Č I Ć',                    'Marin Pongračić',     2, 'Marin_Pongračić');
fix('Ć Aleta-Car',                     'Duje Ćaleta-Car',     2, 'Duje_Ćaleta-Car');
fix('Š Utalo',                         'Josip Šutalo',        2, 'Josip_Šutalo');
fix('Kova Č I Ć',                      'Mateo Kovačić',       2, 'Mateo_Kovačić');
fix('Kramari Ć',                       'Andrej Kramarić',     2, 'Andrej_Kramarić');
fix('Modri Ć',                         'Luka Modrić',         1, 'Luka_Modrić');
fix('Vla Š I Ć',                       'Nikola Vlašić',       2, 'Nikola_Vlašić');
fix('Peri Š I Ć',                      'Ivan Perišić',        2, 'Ivan_Perišić');
fix('Pa Š Ali Ć',                      'Mario Pašalić',       2, 'Mario_Pašalić');
fix('Petar Su Č I Ć',                  'Petar Sučić',         2, 'Petar_Sučić');
fix('Jaki Ć',                          'Kristijan Jakić',     2, 'Kristijan_Jakić');
fix('Matanovi Ć',                      'Igor Matanović',      2, 'Igor_Matanović');
fix('Su Č I Ć',                        'Luka Sučić',          2, 'Luka_Sučić');
fix('Vu Š Kovi Ć',                     'Luka Vušković',       2, 'Luka_Vušković');
fix('Marco Pa Š Ali Ć',                'Marco Pašalić',       2, 'Marco_Pašalić');
fix('Erli Ć',                          'Martin Erlić',        3, 'Martin_Erlić');

// Czechia — broken special chars + truncated first names
fix('Ková Ř',                          'Matěj Kovář',         2, 'Matěj_Kovář');
fix('Hole Š',                          'Tomáš Holeš',         2, 'Tomáš_Holeš');
fix('Hraná Č',                         'Robin Hranáč',        2, 'Robin_Hranáč');
fix('Š Chaloupek',                     'Chaloupek',           3, 'Štefan_Chaloupek');
fix('Krej Č Í',                        'Ladislav Krejčí',     2, 'Ladislav_Krejčí');
fix('Hlo Ž Ek',                        'Adam Hložek',         2, 'Adam_Hložek');
fix('Č Erv',                           'Lukáš Červ',          2, 'Lukáš_Červ');
fix('Š Ulc',                           'Pavel Šulc',          2, 'Pavel_Šulc');
fix('Stan Ě K',                        'Jindřich Staněk',     2, 'Jindřich_Staněk');
fix('Doud Ě Ra',                       'David Douděra',       2, 'David_Douděra');
fix('Sou Č Ek',                        'Tomáš Souček',        2, 'Tomáš_Souček');
fix('Horní Č Ek',                      'Lukáš Horniček',      3, 'Lukáš_Horniček');
fix('Soch Ů Rek',                      'Hugo Sochůrek',       3, 'Hugo_Sochůrek');
fix('Vi Š Inský',                      'Denis Višinský',      3, 'Denis_Višinský');

// Türkiye — broken special chars (İ, Ğ, Ş split by PDF)
fix('Zek İ Çel İ K',                   'Zeki Çelik',          2, 'Zeki_Çelik');
fix('Dem İ Ral',                       'Merih Demiral',       2, 'Merih_Demiral');
fix('ÇA Ğ Lar',                        'Çağlar Söyüncü',      2, 'Çağlar_Söyüncü');
fix('Aktürko Ğ Lu',                    'Kerem Aktürkoglu',    2, 'Kerem_Aktürkoglu');
fix('Den İ Z Gül',                     'Deniz Gül',           3, 'Deniz_Gül');
fix('ÇAlhano Ğ Lu',                    'Hakan Çalhanoğlu',    2, 'Hakan_Çalhanoğlu');
fix('Abdülker İ M',                    'Abdülkerim Bardakcı', 2, 'Abdülkerim_Bardakcı');
fix('İ Sma İ L',                       'İsmail Yüksek',       3, 'İsmail_Yüksek');
fix('Kahvec İ',                        'İrfan Can Kahveci',   2, 'İrfan_Can_Kahveci');
fix('Ferdi Kadio Ğ Lu',                'Ferdi Kadıoğlu',      2, 'Ferdi_Kadıoğlu');
fix('Bari Ş',                          'Barış Yılmaz',        3, 'Barış_Yılmaz');
fix('U Ğ Urcan',                       'Uğurcan Çakır',       2, 'Uğurcan_Çakır');
fix('O Ğ Uz',                          'Oğuz Aydın',          3, 'Oğuz_Aydın');
fix('Salih ÖZcan',                     'Salih Özcan',         2, 'Salih_Özcan');

// Egypt
fix('Mohamed Elshenawy Gomaa',         'Mohamed El Shenawy', 2, 'Mohamed_El-Shenawy');
fix('Omar Marmoush',                   'Omar Marmoush',      2, 'Omar_Marmoush');

// Panama
fix('Fidel Escobar Mendieta',          'Fidel Escobar',       2, 'Fidel_Escobar');
fix('José Rodríguez Francis',          'José Rodríguez',      2, 'José_Rodríguez_(Panamanian_footballer)');
fix('Tomas Rodriguez Mena',            'Tomás Rodríguez',     2, 'Tomás_Rodríguez_(Panamanian_footballer)');
fix('Michael Murillo Bermudez',        'Michael Murillo',     2, 'Michael_Murillo');

// Spain — strip maternal surname for players with 3-word names
fix('Marcos Llorente Moreno',          'Marcos Llorente',     2, 'Marcos_Llorente');
fix('Alejandro Baena Rodríguez',       'Alejandro Baena',     2, 'Alejandro_Baena');
fix('Victor Muñoz Villanueva',         'Víctor Muñoz',        2, 'Víctor_Muñoz');
fix('Borja Iglesias Quintás',          'Borja Iglesias',      2, 'Borja_Iglesias');
fix('Luiz Rosa da Silva',              'Luiz Henrique',       2, 'Luiz_Henrique_(footballer,_born_2001)');

// Netherlands — fix missing first name
fix('van de Ven',                        'Micky van de Ven',    2, 'Micky_van_de_Ven');

// Iran — strip third name
fix('Saeid Ezatolahi Afagh',             'Saeid Ezatolahi',     2, 'Saeid_Ezatolahi');
fix('Alireza Jahanbakhsh Jirandeh',      'Alireza Jahanbakhsh', 2, 'Alireza_Jahanbakhsh');

// Cape Verde — known football names
fix('Kevin Gonçalves Pereira de Pina',   'Kevin de Pina',       3, 'Kevin_de_Pina');
fix('Deroy D\'Encarnação Duarte',         'Laros Duarte',        3, 'Laros_Duarte');
fix('Jair Semedo Monteiro',              'Jair Semedo',         3, 'Jair_Semedo');
fix('Wagner Cardoso de Pina',            'Wagner de Pina',      3, 'Wagner_de_Pina');

// Paraguay
fix('Orlando Gill Noldin',               'Orlando Gill',        3, 'Orlando_Gill');

// Others
fix('Erling Braut Haaland',             'Erling Haaland',      1, 'Erling_Haaland');
fix('Alban Hajdari',                    'Alban Hajdari',       2, 'Alban_Hajdari');
fix('Granit Xhaka',                     'Granit Xhaka',        2, 'Granit_Xhaka');
fix('Breel Donald Embolo',              'Breel Embolo',        2, 'Breel_Embolo');
fix('Mohamed Simakan',                  'Mohamed Simakan',     2, 'Mohamed_Simakan');
fix('Achraf Dari',                      'Achraf Dari',         2, 'Achraf_Dari');

// ── Build photo map from previous run (keyed by rawName) ─────
const prevFile = '_2026_players_final.json';
const prevPhotoMap = {};
if (require('fs').existsSync(prevFile)) {
  const prev = JSON.parse(require('fs').readFileSync(prevFile,'utf8'));
  prev.forEach(p => { if(p.photo) prevPhotoMap[norm(p.name)] = p.photo; });
  console.log('Previous photos loaded:', Object.keys(prevPhotoMap).length);
}
// Also load TheSportsDB progress cache
const progressFile = '_sdb_progress.json';
const sdbProgress = require('fs').existsSync(progressFile)
  ? JSON.parse(require('fs').readFileSync(progressFile,'utf8')) : {};

// ── Apply fixes + carry over from 2022 ───────────────────────
const final = raw.map(p => {
  // Try FIXES using both the new shirt-based name AND the rawName
  const key     = norm(p.name);
  const rawKey  = norm(p.rawName || p.name);
  const fix     = FIXES[key] || FIXES[rawKey];
  const carry   = map22[fix ? norm(fix.name) : rawKey] || map22[fix ? norm(fix.name) : key];

  // Name: fix overrides shirt-based name; carry.name NOT used (avoids old wrong names bleeding back)
  // Then expand single first-name entries ("Thomas" → "Thomas Partey")
  const name   = expandName(fix?.name || p.name, p.rawName || p.name);
  const d      = fix?.d     || carry?.d     || 3;
  const wiki   = fix?.wiki  || carry?.wiki  || w(name);

  // Photo priority: 2022 carry-over → previous run → SDB progress cache
  const photo  = carry?.photo
    || prevPhotoMap[norm(name)]
    || prevPhotoMap[rawKey]
    || (sdbProgress[p.name] || sdbProgress[p.rawName] || null)
    || undefined;

  const result = { name, country: p.country, code: p.code, pos: p.pos, club: p.club, d, wiki };
  if (photo) result.photo = photo;
  return result;
});

// ── Quick stats ───────────────────────────────────────────────
const d1 = final.filter(p=>p.d===1).length;
const d2 = final.filter(p=>p.d===2).length;
const d3 = final.filter(p=>p.d===3).length;
const withPhoto = final.filter(p=>p.photo).length;
console.log(`d:1=${d1}  d:2=${d2}  d:3=${d3}  with photo=${withPhoto}`);

fs.writeFileSync('_2026_players_final.json', JSON.stringify(final, null, 2));
console.log('Saved → _2026_players_final.json');
