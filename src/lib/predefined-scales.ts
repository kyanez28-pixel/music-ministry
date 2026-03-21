export const NOTES = ['Do', 'Do#/Re♭', 'Re', 'Re#/Mi♭', 'Mi', 'Fa', 'Fa#/Sol♭', 'Sol', 'Sol#/La♭', 'La', 'La#/Si♭', 'Si'] as const;

export type NoteName = typeof NOTES[number];

export interface PredefinedScale {
  id: string;
  note: NoteName;
  scaleType: string;
  label: string;
}

const SCALE_TYPES_DEF = [
  { key: 'mayor', label: 'Mayor' },
  { key: 'menor_natural', label: 'Menor Natural' },
  { key: 'menor_armonica', label: 'Menor Armónica' },
  { key: 'menor_melodica', label: 'Menor Melódica' },
  { key: 'pentatonica_mayor', label: 'Pentatónica Mayor' },
  { key: 'pentatonica_menor', label: 'Pentatónica Menor' },
  { key: 'blues', label: 'Blues' },
  { key: 'dorica', label: 'Dórica' },
  { key: 'frigia', label: 'Frigia' },
  { key: 'lidia', label: 'Lidia' },
  { key: 'mixolidia', label: 'Mixolidia' },
  { key: 'locria', label: 'Locria' },
] as const;

export const SCALE_TYPE_OPTIONS = SCALE_TYPES_DEF.map(t => ({ value: t.key, label: t.label }));

export const PREDEFINED_SCALES: PredefinedScale[] = NOTES.flatMap(note =>
  SCALE_TYPES_DEF.map(type => ({
    id: `${note}-${type.key}`,
    note,
    scaleType: type.key,
    label: `${note} ${type.label}`,
  }))
);
