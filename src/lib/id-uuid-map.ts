import { PREDEFINED_SCALES } from './predefined-scales';
import { PREDEFINED_HARMONIES } from './predefined-harmonies';
import { PREDEFINED_RHYTHMS } from './predefined-rhythms';

const stringToUuidMap = new Map<string, string>();
const uuidToStringMap = new Map<string, string>();

// Predefined Scales: prefix 00000001
PREDEFINED_SCALES.forEach((s, idx) => {
  const uuid = `00000001-0000-4000-8000-${String(idx).padStart(12, '0')}`;
  stringToUuidMap.set(s.id, uuid);
  uuidToStringMap.set(uuid, s.id);
});

// Predefined Harmonies: prefix 00000002
PREDEFINED_HARMONIES.forEach((h, idx) => {
  const uuid = `00000002-0000-4000-8000-${String(idx).padStart(12, '0')}`;
  stringToUuidMap.set(h.id, uuid);
  uuidToStringMap.set(uuid, h.id);
});

// Predefined Rhythms: prefix 00000003
PREDEFINED_RHYTHMS.forEach((r, idx) => {
  const uuid = `00000003-0000-4000-8000-${String(idx).padStart(12, '0')}`;
  stringToUuidMap.set(r.id, uuid);
  uuidToStringMap.set(uuid, r.id);
});

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hashStringToUuid(str: string): string {
  let hash1 = 0x811c9dc5;
  let hash2 = 0x55555555;
  let hash3 = 0x12345678;
  let hash4 = 0x9abcdef0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash1 = (hash1 ^ ch) * 0x01000193;
    hash2 = (hash2 ^ ch) * 0x01000193;
    hash3 = (hash3 + ch) * 31;
    hash4 = (hash4 ^ (ch << 5)) * 17;
  }
  const toHex8 = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  const h1 = toHex8(hash1);
  const h2 = toHex8(hash2);
  const h3 = toHex8(hash3);
  const h4 = toHex8(hash4);
  const full = (h1 + h2 + h3 + h4).slice(0, 32);
  return `${full.slice(0, 8)}-${full.slice(8, 12)}-4${full.slice(13, 16)}-a${full.slice(17, 20)}-${full.slice(20, 32)}`;
}

export function toDbUuid(id: string | null | undefined): string | null | undefined {
  if (!id || typeof id !== 'string') return id;
  if (stringToUuidMap.has(id)) return stringToUuidMap.get(id);
  if (UUID_REGEX.test(id)) return id;
  const generatedUuid = hashStringToUuid(id);
  stringToUuidMap.set(id, generatedUuid);
  uuidToStringMap.set(generatedUuid, id);
  return generatedUuid;
}

export function fromDbUuid(uuid: string | null | undefined): string | null | undefined {
  if (!uuid || typeof uuid !== 'string') return uuid;
  if (uuidToStringMap.has(uuid)) return uuidToStringMap.get(uuid);
  return uuid;
}
