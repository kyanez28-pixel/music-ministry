export const RHYTHM_CATEGORIES = [
  { key: 'basicos', label: 'Patrones Básicos' },
  { key: 'subdivision', label: 'Subdivisiones' },
  { key: 'estilos', label: 'Estilos / Grooves' },
  { key: 'tecnicas', label: 'Técnicas Rítmicas' },
  { key: 'compases', label: 'Compases Especiales' },
] as const;

export type RhythmCategoryKey = typeof RHYTHM_CATEGORIES[number]['key'];

export interface PredefinedRhythm {
  id: string;
  category: RhythmCategoryKey;
  name: string;
  description: string;
}

export const PREDEFINED_RHYTHMS: PredefinedRhythm[] = [
  // Patrones Básicos
  { id: 'bas-negras', category: 'basicos', name: 'Negras (Quarter notes)', description: '1 - 2 - 3 - 4' },
  { id: 'bas-corcheas', category: 'basicos', name: 'Corcheas (Eighth notes)', description: '1-y-2-y-3-y-4-y' },
  { id: 'bas-semicorcheas', category: 'basicos', name: 'Semicorcheas (16th notes)', description: '1-e-y-a-2-e-y-a...' },
  { id: 'bas-blancas', category: 'basicos', name: 'Blancas (Half notes)', description: '1 - - - 3 - - -' },
  { id: 'bas-redondas', category: 'basicos', name: 'Redondas (Whole notes)', description: 'Una nota por compás' },
  { id: 'bas-puntillo-negra', category: 'basicos', name: 'Negra con puntillo', description: 'Nota extendida 1.5 tiempos' },
  { id: 'bas-puntillo-corchea', category: 'basicos', name: 'Corchea con puntillo + semi', description: 'Patrón galante / marcha' },

  // Subdivisiones
  { id: 'sub-tresillos', category: 'subdivision', name: 'Tresillos de corchea', description: '3 notas por tiempo' },
  { id: 'sub-tresillos-negra', category: 'subdivision', name: 'Tresillos de negra', description: '3 notas en 2 tiempos' },
  { id: 'sub-quintillos', category: 'subdivision', name: 'Quintillos', description: '5 notas por tiempo' },
  { id: 'sub-sextillos', category: 'subdivision', name: 'Sextillos', description: '6 notas por tiempo' },
  { id: 'sub-2-contra-3', category: 'subdivision', name: 'Polirritmia 2:3', description: '2 contra 3 simultáneo' },
  { id: 'sub-3-contra-4', category: 'subdivision', name: 'Polirritmia 3:4', description: '3 contra 4 simultáneo' },
  { id: 'sub-swing-corcheas', category: 'subdivision', name: 'Swing (corcheas)', description: 'Corcheas desiguales largo-corto' },
  { id: 'sub-shuffle', category: 'subdivision', name: 'Shuffle', description: 'Tresillo con silencio medio' },

  // Estilos / Grooves
  { id: 'est-pop-rock', category: 'estilos', name: 'Pop/Rock básico', description: 'Bombo 1-3, caja 2-4' },
  { id: 'est-balada', category: 'estilos', name: 'Balada', description: 'Patrón lento y expresivo' },
  { id: 'est-gospel', category: 'estilos', name: 'Gospel shuffle', description: 'Tresillos con acentos en 2 y 4' },
  { id: 'est-bossa-nova', category: 'estilos', name: 'Bossa Nova', description: 'Patrón sincopado brasileño' },
  { id: 'est-reggae', category: 'estilos', name: 'Reggae / Offbeat', description: 'Acento en contratiempos' },
  { id: 'est-funk', category: 'estilos', name: 'Funk', description: 'Semicorcheas sincopadas' },
  { id: 'est-latin-son', category: 'estilos', name: 'Son / Montuno', description: 'Patrón cubano base' },
  { id: 'est-cumbia', category: 'estilos', name: 'Cumbia', description: 'Patrón colombiano' },
  { id: 'est-vals', category: 'estilos', name: 'Vals', description: 'Patrón 3/4: fuerte-débil-débil' },
  { id: 'est-marcha', category: 'estilos', name: 'Marcha', description: 'Patrón militar 2/4 o 4/4' },
  { id: 'est-swing-jazz', category: 'estilos', name: 'Swing Jazz', description: 'Ride + hi-hat en 2-4' },
  { id: 'est-worship-mod', category: 'estilos', name: 'Worship moderno', description: 'Corcheas con build-up' },

  // Técnicas Rítmicas
  { id: 'tec-sincopa', category: 'tecnicas', name: 'Síncopa básica', description: 'Acentos en tiempos débiles' },
  { id: 'tec-anticipacion', category: 'tecnicas', name: 'Anticipación', description: 'Nota que llega antes del tiempo fuerte' },
  { id: 'tec-retardo', category: 'tecnicas', name: 'Retardo / Delay', description: 'Nota que llega después del tiempo' },
  { id: 'tec-silencios', category: 'tecnicas', name: 'Silencios rítmicos', description: 'Usar el silencio como elemento' },
  { id: 'tec-acentos-dinamicos', category: 'tecnicas', name: 'Acentos dinámicos', description: 'Variar intensidad dentro del patrón' },
  { id: 'tec-ostinato', category: 'tecnicas', name: 'Ostinato', description: 'Patrón repetitivo constante' },
  { id: 'tec-hemiola', category: 'tecnicas', name: 'Hemiola', description: 'Agrupación de 2 en compás de 3' },
  { id: 'tec-cross-rhythm', category: 'tecnicas', name: 'Ritmo cruzado', description: 'Patrón que cruza líneas de compás' },

  // Compases Especiales
  { id: 'comp-3-4', category: 'compases', name: 'Compás 3/4', description: 'Tres tiempos por compás' },
  { id: 'comp-6-8', category: 'compases', name: 'Compás 6/8', description: 'Seis corcheas, dos grupos de tres' },
  { id: 'comp-5-4', category: 'compases', name: 'Compás 5/4', description: 'Cinco tiempos (3+2 o 2+3)' },
  { id: 'comp-7-8', category: 'compases', name: 'Compás 7/8', description: 'Siete corcheas (2+2+3 u otras)' },
  { id: 'comp-9-8', category: 'compases', name: 'Compás 9/8', description: 'Nueve corcheas (3+3+3)' },
  { id: 'comp-12-8', category: 'compases', name: 'Compás 12/8', description: 'Cuatro grupos de tresillos (blues/gospel)' },
  { id: 'comp-cambio', category: 'compases', name: 'Cambios de compás', description: 'Alternar entre compases distintos' },
];
