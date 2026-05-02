export const HARMONY_CATEGORIES = [
  { key: 'progresiones', label: 'Progresiones', color: '#60a5fa', description: 'Secuencias de acordes que crean movimiento armónico. Son la base de casi toda la música tonal.' },
  { key: 'cadencias', label: 'Cadencias', color: '#4ade80', description: 'Fórmulas de cierre que dan sensación de reposo o tensión. Definen el "fraseo" de la música.' },
  { key: 'voicings', label: 'Voicings / Inversiones', color: '#f472b6', description: 'Cómo distribuir las notas de un acorde entre las voces. Afectan el color y la suavidad del movimiento.' },
  { key: 'acordes_extendidos', label: 'Acordes Extendidos', color: '#a78bfa', description: 'Acordes con 5 o más notas (7ª, 9ª, 11ª, 13ª). Dan riqueza y color armónico avanzado.' },
  { key: 'modulaciones', label: 'Modulaciones', color: '#fb923c', description: 'Cambios de tonalidad dentro de una pieza. Crean contraste emocional y narrativa musical.' },
] as const;

export type HarmonyCategoryKey = typeof HARMONY_CATEGORIES[number]['key'];

export type DifficultyLevel = 'basico' | 'intermedio' | 'avanzado';

export interface PredefinedHarmony {
  id: string;
  category: HarmonyCategoryKey;
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  tip: string;
  example: string;
}

export const PREDEFINED_HARMONIES: PredefinedHarmony[] = [
  // Progresiones
  {
    id: 'prog-I-IV-V-I', category: 'progresiones', name: 'I - IV - V - I',
    description: 'Progresión clásica mayor',
    difficulty: 'basico',
    tip: 'En Do mayor: C → F → G → C. El V crea tensión que resuelve al I. Es la base del blues, folk y música clásica.',
    example: 'Himno "Santo, Santo, Santo" · Blues tradicional · "La Bamba"',
  },
  {
    id: 'prog-I-V-vi-IV', category: 'progresiones', name: 'I - V - vi - IV',
    description: 'Pop / Adoración moderna',
    difficulty: 'basico',
    tip: 'En Do: C → G → Am → F. El vi añade emoción al bajar al relativo menor. Es la progresión más usada en el pop actual.',
    example: '"Let It Be" (Beatles) · "Oceans" (Hillsong) · "Aleluya" (Cohen)',
  },
  {
    id: 'prog-vi-IV-I-V', category: 'progresiones', name: 'vi - IV - I - V',
    description: 'Progresión emotiva / balada',
    difficulty: 'basico',
    tip: 'En Do: Am → F → C → G. Empieza en el relativo menor, lo que da un tono más emotivo e introspectivo.',
    example: '"What About Now" · "Someone Like You" (Adele) · Muchas baladas de adoración',
  },
  {
    id: 'prog-I-vi-IV-V', category: 'progresiones', name: 'I - vi - IV - V',
    description: 'Doo-wop / 50s',
    difficulty: 'basico',
    tip: 'En Do: C → Am → F → G. Clásica del rock and roll. El vi da un toque nostálgico antes de la cadencia V - I.',
    example: '"Stand By Me" · "Blue Moon" · Gospel tradicional',
  },
  {
    id: 'prog-ii-V-I', category: 'progresiones', name: 'ii - V - I',
    description: 'Jazz esencial mayor',
    difficulty: 'intermedio',
    tip: 'En Do: Dm7 → G7 → Cmaj7. El ii prepara el V que resuelve al I. Practica en todas las tonalidades girando el ciclo de quintas.',
    example: 'Estándar de jazz "Autumn Leaves" · "Fly Me to the Moon"',
  },
  {
    id: 'prog-ii-V-i-menor', category: 'progresiones', name: 'ii° - V7 - i (menor)',
    description: 'Jazz esencial menor',
    difficulty: 'intermedio',
    tip: 'En La menor: Bm7b5 → E7 → Am. El V7 usa la escala menor armónica. Más tenso y oscuro que la versión mayor.',
    example: '"Autumn Leaves" (sección menor) · "Summertime" (Gershwin)',
  },
  {
    id: 'prog-I-IV-vi-V', category: 'progresiones', name: 'I - IV - vi - V',
    description: 'Variación pop/worship',
    difficulty: 'basico',
    tip: 'En Do: C → F → Am → G. El vi en tercer lugar da un giro emocional. Muy usada en música de adoración contemporánea.',
    example: '"10,000 Reasons" (Matt Redman) · Muchos himnos modernos',
  },
  {
    id: 'prog-I-iii-vi-IV', category: 'progresiones', name: 'I - iii - vi - IV',
    description: 'Círculo descendente',
    difficulty: 'intermedio',
    tip: 'En Do: C → Em → Am → F. El bajo desciende por grados: C-B-A. Crea un movimiento suave y elegante.',
    example: '"Canon en Re" (Pachelbel) · "Don\'t Look Back in Anger" (Oasis)',
  },
  {
    id: 'prog-12bar-blues', category: 'progresiones', name: 'Blues 12 compases',
    description: 'I-I-I-I / IV-IV-I-I / V-IV-I-V',
    difficulty: 'intermedio',
    tip: 'Estructura de 12 compases: 4 en I, 2 en IV, 2 en I, 1 en V, 1 en IV, 2 en I. Base de rock, blues, R&B.',
    example: '"Johnny B. Goode" (Chuck Berry) · Blues tradicional · Early rock and roll',
  },
  {
    id: 'prog-i-bVII-bVI-V', category: 'progresiones', name: 'i - ♭VII - ♭VI - V',
    description: 'Progresión andaluza / flamenco',
    difficulty: 'intermedio',
    tip: 'En La menor: Am → G → F → E. El V usa la 3ra mayor (escala frigia). Muy dramática y característica del flamenco.',
    example: 'Flamenco tradicional · "Hit the Road Jack" · "Stairway to Heaven" (intro)',
  },
  {
    id: 'prog-I-bVII-IV', category: 'progresiones', name: 'I - ♭VII - IV',
    description: 'Rock clásico',
    difficulty: 'intermedio',
    tip: 'En Do: C → B♭ → F. El ♭VII es un acorde prestado del modo mixolidio. Da un sabor rockero y poderoso.',
    example: '"Sweet Home Alabama" · "La Grange" (ZZ Top) · Rock clásico en general',
  },
  {
    id: 'prog-vi-ii-V-I', category: 'progresiones', name: 'vi - ii - V - I',
    description: 'Círculo de quintas',
    difficulty: 'avanzado',
    tip: 'En Do: Am → Dm → G → C. Cada acorde está a una quinta del siguiente. Crea una cadena de dominantes secundarias implícitas.',
    example: 'Estándares de jazz · "Rhythm Changes" · Improvisación avanzada',
  },
  {
    id: 'prog-I-V-IV-V', category: 'progresiones', name: 'I - V - IV - V',
    description: 'Country / folk',
    difficulty: 'basico',
    tip: 'En Do: C → G → F → G. El retorno al V antes del I crea un ciclo abierto. Característica del country y gospel rural.',
    example: 'Country tradicional · Folk americano · Algunos himnos rurales',
  },
  {
    id: 'prog-i-iv-v', category: 'progresiones', name: 'i - iv - v',
    description: 'Menor natural básica',
    difficulty: 'basico',
    tip: 'En La menor: Am → Dm → Em. Usa la escala menor natural (sin alterar el VII). Sonido modal y oscuro.',
    example: 'Baladas menores · Música modal · Folk oscuro',
  },
  {
    id: 'prog-I-ii-iii-IV', category: 'progresiones', name: 'I - ii - iii - IV',
    description: 'Ascendente stepwise',
    difficulty: 'basico',
    tip: 'En Do: C → Dm → Em → F. El bajo sube por grados conjuntos. Crea movimiento ascendente lleno de energía y expectativa.',
    example: '"Here Comes the Sun" (parte) · Intros de adoración ascendentes',
  },

  // Cadencias
  {
    id: 'cad-autentica', category: 'cadencias', name: 'Cadencia auténtica (V - I)',
    description: 'Resolución fuerte y conclusiva',
    difficulty: 'basico',
    tip: 'G7 → C en Do mayor. La nota sensible (Si) sube al Do. Es la cadencia más fuerte y conclusiva de la música tonal.',
    example: 'Final de casi cualquier himno o pieza clásica',
  },
  {
    id: 'cad-plagal', category: 'cadencias', name: 'Cadencia plagal (IV - I)',
    description: 'Cadencia "Amén"',
    difficulty: 'basico',
    tip: 'F → C en Do mayor. Usada al final de los himnos cuando se canta "Amén". Más suave y reposada que la auténtica.',
    example: 'Final de himnos clásicos · "Amén" litúrgico',
  },
  {
    id: 'cad-semicadencia', category: 'cadencias', name: 'Semicadencia (? - V)',
    description: 'Cadencia suspensiva',
    difficulty: 'intermedio',
    tip: 'Termina en V sin resolver. Crea expectativa y necesidad de continuación. El oyente siente que la frase está "en el aire".',
    example: 'Final de la primera frase antes de repetir · Puentes musicales',
  },
  {
    id: 'cad-rota', category: 'cadencias', name: 'Cadencia rota (V - vi)',
    description: 'Cadencia deceptiva / engañosa',
    difficulty: 'intermedio',
    tip: 'G → Am en Do mayor. El oído espera el I pero recibe el vi. Úsala para extender una frase cuando parece que va a terminar.',
    example: 'Puentes y extensiones de frases · Música romántica · Sorpresas armónicas',
  },
  {
    id: 'cad-frigia', category: 'cadencias', name: 'Cadencia frigia (♭II - I)',
    description: 'Sonido flamenco / modal',
    difficulty: 'avanzado',
    tip: 'En La menor: B♭ → Am. El ♭II (napolitano) resuelve directamente al I. Sonido muy dramático y flamenco.',
    example: 'Flamenco · Música española · Final de piezas en modo frigio',
  },
  {
    id: 'cad-picarda', category: 'cadencias', name: 'Tercera de Picardía (iv - I)',
    description: 'Menor resuelve a mayor',
    difficulty: 'avanzado',
    tip: 'En La menor: Dm → C mayor (con Do mayor al final). Termina en modo mayor aunque estés en menor. Efecto de luz al final.',
    example: 'Bach "Tocata y Fuga en Re menor" · Música barroca y romántica',
  },

  // Voicings
  {
    id: 'voic-triada-raiz', category: 'voicings', name: 'Tríadas en posición raíz',
    description: 'Fundamental en el bajo',
    difficulty: 'basico',
    tip: 'La nota más grave es la raíz del acorde. En Do mayor: C-E-G (de abajo a arriba). El punto de partida de todo voicing.',
    example: 'Acompañamiento básico en piano · Guitarra en acordes abiertos',
  },
  {
    id: 'voic-1ra-inv', category: 'voicings', name: 'Tríadas 1ª inversión',
    description: '3ra en el bajo',
    difficulty: 'intermedio',
    tip: 'La 3ra está en el bajo: C mayor → E-G-C. Da un sonido más suave y fluido. Excelente para líneas de bajo melódico.',
    example: 'Línea de bajo descendente · Acompañamiento de himnos a 4 voces',
  },
  {
    id: 'voic-2da-inv', category: 'voicings', name: 'Tríadas 2ª inversión',
    description: '5ta en el bajo',
    difficulty: 'intermedio',
    tip: 'La 5ta está en el bajo: C mayor → G-C-E. Se usa en la cadena I(6/4)-V-I para la cadencia auténtica ornamentada.',
    example: 'Cadencia auténtica clásica · Ornamentación en música barroca',
  },
  {
    id: 'voic-septima-raiz', category: 'voicings', name: 'Acordes 7ma posición raíz',
    description: 'Cuatríadas fundamentales',
    difficulty: 'intermedio',
    tip: 'Agrega la 7ma a la tríada: Cmaj7 = C-E-G-B. Cuatro notas distribuidas. Base del jazz y la música de adoración contemporánea.',
    example: '"How Great Is Our God" (intro) · Estándares de jazz',
  },
  {
    id: 'voic-drop2', category: 'voicings', name: 'Voicings Drop 2',
    description: 'Segunda nota más aguda baja una octava',
    difficulty: 'avanzado',
    tip: 'Toma la segunda nota más aguda de un voicing cerrado y bájala una octava. Muy usada en guitarra jazz de 4 cuerdas.',
    example: 'Guitarra jazz · Cuarteto de jazz · Arreglos de big band',
  },
  {
    id: 'voic-drop3', category: 'voicings', name: 'Voicings Drop 3',
    description: 'Tercera nota más aguda baja una octava',
    difficulty: 'avanzado',
    tip: 'Similar al Drop 2 pero baja la tercera nota. Crea posiciones muy abiertas. Común en arreglos para piano y guitarra.',
    example: 'Arreglos corales jazz · Piano jazz avanzado',
  },
  {
    id: 'voic-shell', category: 'voicings', name: 'Shell voicings (3ra + 7ma)',
    description: 'Voicings mínimos jazz',
    difficulty: 'avanzado',
    tip: 'Solo raíz, 3ra y 7ma. En Cmaj7: C-E-B (sin el Sol). La 3ra define mayor/menor, la 7ma define el tipo de acorde. Esenciales.',
    example: 'Piano jazz acompañando a solista · "Lullaby of Birdland"',
  },
  {
    id: 'voic-spread', category: 'voicings', name: 'Voicings abiertos',
    description: 'Notas separadas por más de una octava',
    difficulty: 'avanzado',
    tip: 'Distribuye las notas separadas, no apretadas. Suenan más grandes y orchestrales. Muy usados en música de adoración.',
    example: 'Intros de adoración cinematográficas · Piano como orquesta',
  },
  {
    id: 'voic-close', category: 'voicings', name: 'Voicings cerrados',
    description: 'Todas las notas dentro de una octava',
    difficulty: 'intermedio',
    tip: 'Todas las notas caben dentro de una octava. Suenan compactos y densos. Ideales para la mano derecha sobre un bajo.',
    example: 'Coral a 4 voces · Acompañamiento de himnos tradicionales',
  },

  // Acordes Extendidos
  {
    id: 'ext-maj7', category: 'acordes_extendidos', name: 'Acorde Maj7',
    description: 'Mayor con séptima mayor',
    difficulty: 'intermedio',
    tip: 'Cmaj7 = C-E-G-B. La séptima mayor (B) da un sonido suave y soñador. No genera tensión, es consonante.',
    example: '"How Great Is Our God" · Bossanova · Música de adoración suave',
  },
  {
    id: 'ext-min7', category: 'acordes_extendidos', name: 'Acorde min7',
    description: 'Menor con séptima menor',
    difficulty: 'intermedio',
    tip: 'Am7 = A-C-E-G. La 7ma menor (G) suaviza el acorde menor. Es el ii en una cadencia ii-V-I.',
    example: '"Fly Me to the Moon" (comienzo) · Soul · R&B moderno',
  },
  {
    id: 'ext-dom7', category: 'acordes_extendidos', name: 'Acorde 7 (dominante)',
    description: 'Mayor con séptima menor',
    difficulty: 'intermedio',
    tip: 'G7 = G-B-D-F. El intervalo de tritono (B-F) crea máxima tensión que resuelve al I. El acorde más tenso de la tonalidad.',
    example: 'V7 de cualquier cadencia auténtica · Blues · Jazz',
  },
  {
    id: 'ext-dim7', category: 'acordes_extendidos', name: 'Acorde dim7',
    description: 'Disminuido con séptima disminuida',
    difficulty: 'avanzado',
    tip: 'Cdim7 = C-Eb-Gb-A. Cuatro tritonos apilados. Puede resolver a cualquier acorde mayor a medio tono. Simétrico.',
    example: 'Música de suspenso · Transiciones cromáticas · Música de cine',
  },
  {
    id: 'ext-m7b5', category: 'acordes_extendidos', name: 'Acorde m7♭5 (semidim)',
    description: 'Medio disminuido',
    difficulty: 'avanzado',
    tip: 'Bm7b5 = B-D-F-A. Es el ii° en el jazz menor. Menos tenso que el dim7 completo. Fundamental en ii-V-i menor.',
    example: '"Autumn Leaves" (ii menor) · Estándares jazz menor · Música modal oscura',
  },
  {
    id: 'ext-9', category: 'acordes_extendidos', name: 'Acorde 9',
    description: 'Dominante con novena',
    difficulty: 'avanzado',
    tip: 'G9 = G-B-D-F-A. Agrega la 9na (Re) al dominante 7. Más colorido y jazzístico que el simple 7. Muy usado en gospel.',
    example: 'Gospel contemporáneo · Jazz moderno · R&B',
  },
  {
    id: 'ext-maj9', category: 'acordes_extendidos', name: 'Acorde Maj9',
    description: 'Mayor 7 con novena',
    difficulty: 'avanzado',
    tip: 'Cmaj9 = C-E-G-B-D. El color más abierto y celestial. Muy usado en música de adoración cinematográfica y jazz.',
    example: 'Adoración contemporánea · Bossanova · Jazz moderno',
  },
  {
    id: 'ext-min9', category: 'acordes_extendidos', name: 'Acorde min9',
    description: 'Menor 7 con novena',
    difficulty: 'avanzado',
    tip: 'Am9 = A-C-E-G-B. La 9na mayor sobre un acorde menor da un sabor jazzy y melancólico a la vez.',
    example: 'Neo-soul · Jazz moderno · Adoración íntima',
  },
  {
    id: 'ext-11', category: 'acordes_extendidos', name: 'Acorde 11',
    description: 'Con oncena',
    difficulty: 'avanzado',
    tip: 'G11 = G-B-D-F-A-C. La oncena (Fa) se superpone al acorde de 9. En práctica suele omitirse la 3ra para evitar choques.',
    example: 'Jazz avanzado · Música de fusión · Arreglos orquestales',
  },
  {
    id: 'ext-13', category: 'acordes_extendidos', name: 'Acorde 13',
    description: 'Con trecena',
    difficulty: 'avanzado',
    tip: 'G13 incluye las 7 notas de la escala. En práctica se tocan las más importantes: raíz, 3ra, 7ma, 13na. Máxima riqueza.',
    example: 'Big band jazz · Arreglos de gospel sofisticados',
  },
  {
    id: 'ext-sus2', category: 'acordes_extendidos', name: 'Acorde sus2',
    description: 'Suspendido en segunda',
    difficulty: 'intermedio',
    tip: 'Csus2 = C-D-G. La 2da reemplaza la 3ra. Sonido abierto y moderno. No define mayor ni menor. Muy usado en adoración.',
    example: '"Oceans" (intro) · Música de adoración open-air · Pop moderno',
  },
  {
    id: 'ext-sus4', category: 'acordes_extendidos', name: 'Acorde sus4',
    description: 'Suspendido en cuarta',
    difficulty: 'intermedio',
    tip: 'Csus4 = C-F-G. La 4ta reemplaza la 3ra. Crea tensión que quiere resolver a la 3ra. Clásico antes de un acorde mayor.',
    example: '"The Who - Pinball Wizard" · Resoluciones dramáticas · Rock y pop',
  },
  {
    id: 'ext-add9', category: 'acordes_extendidos', name: 'Acorde add9',
    description: 'Tríada con novena agregada',
    difficulty: 'intermedio',
    tip: 'Cadd9 = C-E-G-D. Diferente al maj9 porque NO tiene la 7ma. Sonido brillante y fresco. Ubícuo en guitarra de adoración.',
    example: '"Cornerstone" · Guitarra de adoración · Pop cristiano moderno',
  },
  {
    id: 'ext-6', category: 'acordes_extendidos', name: 'Acorde 6',
    description: 'Mayor con sexta',
    difficulty: 'intermedio',
    tip: 'C6 = C-E-G-A. La 6ta mayor da un color vintage y swing. Equivalente al Am7/C (acorde en primera inversión).',
    example: 'Jazz swing · Bossanova · Música de los años 40-50',
  },
  {
    id: 'ext-min6', category: 'acordes_extendidos', name: 'Acorde min6',
    description: 'Menor con sexta',
    difficulty: 'avanzado',
    tip: 'Am6 = A-C-E-F#. La 6ta MAYOR sobre un acorde menor crea un sonido único, entre oscuro y brillante. Muy expresivo.',
    example: 'Jazz menor · "Misty" · Baladas de jazz',
  },

  // Modulaciones
  {
    id: 'mod-medio-tono', category: 'modulaciones', name: 'Modulación ½ tono arriba',
    description: 'Ascenso cromático clásico',
    difficulty: 'intermedio',
    tip: 'La más impactante: de repente todo sube un semitono. El efecto "eléctrico" que da energía instantánea. Practica la transición.',
    example: 'Himnos de adoración finales · Baladas pop del último coro · "My Way" (Sinatra)',
  },
  {
    id: 'mod-tono-arriba', category: 'modulaciones', name: 'Modulación 1 tono arriba',
    description: 'Cambio de tonalidad por tono entero',
    difficulty: 'intermedio',
    tip: 'Sube una tonalidad entera (2 semitonos). Menos abrupta que la de ½ tono. Practica identificar el nuevo I antes de tocar.',
    example: 'Gospel · Música de adoración · Pop romántico',
  },
  {
    id: 'mod-relativo-menor', category: 'modulaciones', name: 'Mayor → relativo menor',
    description: 'Usando acorde pivote',
    difficulty: 'avanzado',
    tip: 'De Do mayor a La menor: el acorde Am es el vi en Do y el i en Lam. Úsalo como pivote para la modulación suave.',
    example: 'Música clásica · Baladas que pasan de alegre a melancólico',
  },
  {
    id: 'mod-relativo-mayor', category: 'modulaciones', name: 'Menor → relativo mayor',
    description: 'Usando acorde pivote',
    difficulty: 'avanzado',
    tip: 'De La menor a Do mayor: el C mayor es ♭III en Lam y I en Dom. La transición es natural y muy usada en adoración.',
    example: 'Adoración que va de íntima a celebración · Música de cine',
  },
  {
    id: 'mod-dominante-sec', category: 'modulaciones', name: 'Dominante secundaria (V/V)',
    description: 'Tonicización temporal',
    difficulty: 'avanzado',
    tip: 'En Do mayor: D7 → G. El D7 es el V del V. Añade un acorde dominante extra antes del V, intensificando la cadencia.',
    example: 'Jazz · Música clásica · Añade drama antes de cualquier cadencia',
  },
  {
    id: 'mod-directa', category: 'modulaciones', name: 'Modulación directa',
    description: 'Cambio abrupto sin preparación',
    difficulty: 'avanzado',
    tip: 'Sin acorde pivote, simplemente cambias de tonalidad. El efecto puede ser sorpresivo o chocante. Requiere buena oreja.',
    example: 'Rock · Música experimental · Cambios de sección drásticos',
  },
];
