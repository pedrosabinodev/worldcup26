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

// ── Global Stars (d:1) ────────────────────────────────────────
fix('Lionel Messi',                     'Lionel Messi',        1, 'Lionel_Messi');
fix('Cristiano Dos Santos Aveiro',       'Cristiano Ronaldo',   1, 'Cristiano_Ronaldo');
fix('Kylian Mbappe Lottin',             'Kylian Mbappé',       1, 'Kylian_Mbappé');
fix('Neymar Junior',                    'Neymar Jr',           1, 'Neymar');
fix('Neymar Da Silva Santos Junior',    'Neymar Jr',           1, 'Neymar');
fix('Vinicius Paixão de Oliveira Júnior','Vinícius Júnior',    1, 'Vinícius_Júnior');
fix('Vinicius Paixao de Oliveira Junior','Vinícius Júnior',    1, 'Vinícius_Júnior');
fix('Erling Haaland',                   'Erling Haaland',      1, 'Erling_Haaland');
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
fix('Rafael Alexandre Conceicao Leao', 'Rafael Leão',         2, 'Rafael_Leão');
fix('Rafael Alexandre Conceição Leão', 'Rafael Leão',         2, 'Rafael_Leão');
fix('Bruno Miguel Borges Fernandes',    'Bruno Fernandes',     2, 'Bruno_Fernandes');
fix('Ruben dos Santos Gato Alves Dias', 'Rúben Dias',         2, 'Rúben_Dias');
fix('Rúben dos Santos Gato Alves Dias', 'Rúben Dias',         2, 'Rúben_Dias');
fix('Diogo Jose Teixeira da Silva',     'Diogo Jota',          2, 'Diogo_Jota');
fix('Diogo José Teixeira da Silva',     'Diogo Jota',          2, 'Diogo_Jota');
fix('Joao Felix Sequeira',              'João Félix',          2, 'João_Félix');
fix('João Félix Sequeira',              'João Félix',          2, 'João_Félix');
fix('Joao Cancelo',                     'João Cancelo',        2, 'João_Cancelo');
fix('Bernardo Mota Veiga de Carvalho e Silva','Bernardo Silva',2, 'Bernardo_Silva');
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
fix('Gabriel Magalhaes',                'Gabriel',             2, 'Gabriel_Magalhães');
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
fix('Jamal Musiala',                    'Jamal Musiala',       2, 'Jamal_Musiala');
fix('Florian Wirtz',                    'Florian Wirtz',       2, 'Florian_Wirtz');
fix('Manuel Neuer',                     'Manuel Neuer',        2, 'Manuel_Neuer');
fix('Niclas Fullkrug',                  'Niclas Füllkrug',     2, 'Niclas_Füllkrug');
fix('Niclas Füllkrug',                  'Niclas Füllkrug',     2, 'Niclas_Füllkrug');
fix('Antonio Rudiger',                  'Antonio Rüdiger',     2, 'Antonio_Rüdiger');
fix('Antonio Rüdiger',                  'Antonio Rüdiger',     2, 'Antonio_Rüdiger');
fix('Leon Goretzka',                    'Leon Goretzka',       2, 'Leon_Goretzka');
fix('Kai Havertz',                      'Kai Havertz',         2, 'Kai_Havertz');

// Argentina
fix('Emiliano Martinez',                'Emiliano Martínez',   2, 'Emiliano_Martínez');
fix('Emiliano Adrian Martinez',         'Emiliano Martínez',   2, 'Emiliano_Martínez');
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
fix('Lamine Yamal',                     'Lamine Yamal',        2, 'Lamine_Yamal');
fix('Lamine Yamal Nasraoui Ebana',      'Lamine Yamal',        2, 'Lamine_Yamal');
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
fix('Achraf Hakimi',                    'Achraf Hakimi',       2, 'Achraf_Hakimi');
fix('Sofyan Amrabat',                   'Sofyan Amrabat',      2, 'Sofyan_Amrabat');
fix('Youssef En-Nesyri',                'Youssef En-Nesyri',   2, 'Youssef_En-Nesyri');
fix('Bono',                             'Bono',                2, 'Yassine_Bounou');
fix('Yassine Bounou',                   'Yassine Bounou',      2, 'Yassine_Bounou');

// Japan
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
fix('Antoine Griezmann',                'Antoine Griezmann',   1, 'Antoine_Griezmann');
fix('Antoine Griezmann',                'Antoine Griezmann',   1, 'Antoine_Griezmann');
fix('Masour Dembele',                   'Moussa Dembélé',      2, 'Moussa_Dembélé_(footballer,_born_1996)');
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
fix('Alexis Mac Allister',              'Alexis Mac Allister', 2, 'Alexis_Mac_Allister');
fix('Nahuel Molina Lucero',             'Nahuel Molina',       2, 'Nahuel_Molina');
fix('Geronimo Rulli',                   'Gerónimo Rulli',      2, 'Gerónimo_Rulli');
fix('Cristian Gabriel Romero',          'Cristian Romero',     2, 'Cristian_Romero');

// England
fix('Marcus Rashford',                  'Marcus Rashford',     2, 'Marcus_Rashford');
fix('Jordan Henderson',                 'Jordan Henderson',    2, 'Jordan_Henderson');
fix('Kyle Walker',                      'Kyle Walker',         2, 'Kyle_Walker');
fix('John Stones',                      'John Stones',         2, 'John_Stones');

// Belgium
fix('Romelu Lukaku Menama',             'Romelu Lukaku',       2, 'Romelu_Lukaku');
fix('Romelu Menama Lukaku Bolingoli',   'Romelu Lukaku',       2, 'Romelu_Lukaku');
fix('Romelu Lukaku Bolingoli',          'Romelu Lukaku',       2, 'Romelu_Lukaku');
fix('Antoine Griezmann',                'Antoine Griezmann',   1, 'Antoine_Griezmann');
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

// Others
fix('Erling Braut Haaland',             'Erling Haaland',      1, 'Erling_Haaland');
fix('Alban Hajdari',                    'Alban Hajdari',       2, 'Alban_Hajdari');
fix('Granit Xhaka',                     'Granit Xhaka',        2, 'Granit_Xhaka');
fix('Breel Donald Embolo',              'Breel Embolo',        2, 'Breel_Embolo');
fix('Mohamed Simakan',                  'Mohamed Simakan',     2, 'Mohamed_Simakan');
fix('Achraf Dari',                      'Achraf Dari',         2, 'Achraf_Dari');

// ── Apply fixes + carry over from 2022 ───────────────────────
const final = raw.map(p => {
  const key = norm(p.name);
  const fix = FIXES[key];
  const carry = map22[fix ? norm(fix.name) : key];

  const name   = fix?.name  || carry?.name  || p.name;
  const d      = fix?.d     || carry?.d     || 3;
  const wiki   = fix?.wiki  || carry?.wiki  || w(name);
  const photo  = carry?.photo || undefined;

  const result = {
    name,
    country: p.country,
    code: p.code,
    pos: p.pos,
    club: p.club,
    d,
    wiki,
  };
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
