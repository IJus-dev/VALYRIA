import { ValidationError } from "./errors";

const encoder = new TextEncoder();
const HEX_RADIX = 16;
const CURRENCY_HEX_LENGTH = 40;
const SCHEMA_PREFIX = 0x56;

export interface SeriesDescriptor {
  commodity: string;
  region: string;
  year: number;
  cycle: string;
  grade: string;
  lotUnit: string;
  sequence: number;
  flags?: number;
}

function assertAsciiToken(fieldName: string, value: string, expectedLength: number): void {
  if (value.length !== expectedLength) {
    throw new ValidationError(`${fieldName} must be ${expectedLength} ASCII characters long.`);
  }

  if (!/^[A-Z0-9]+$/.test(value)) {
    throw new ValidationError(`${fieldName} must use uppercase ASCII alpha-numeric characters only.`);
  }
}

function writeAscii(bytes: Uint8Array, offset: number, length: number, value: string): void {
  const chunk = encoder.encode(value);

  if (chunk.length !== length) {
    throw new ValidationError(`Expected ${length} bytes but received ${chunk.length}.`);
  }

  bytes.set(chunk, offset);
}

function writeUint16(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = (value >> 8) & 0xff;
  bytes[offset + 1] = value & 0xff;
}

function writeUint32(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}

export function buildSeriesAlias(descriptor: SeriesDescriptor): string {
  return [
    descriptor.commodity,
    descriptor.region,
    descriptor.year.toString(),
    descriptor.cycle,
    descriptor.grade,
    descriptor.lotUnit,
    descriptor.sequence.toString().padStart(4, "0")
  ].join(".");
}

export function encodeSeriesCurrencyCode(descriptor: SeriesDescriptor): string {
  assertAsciiToken("commodity", descriptor.commodity, 3);
  assertAsciiToken("region", descriptor.region, 2);
  assertAsciiToken("cycle", descriptor.cycle, 2);
  assertAsciiToken("grade", descriptor.grade, 2);
  assertAsciiToken("lotUnit", descriptor.lotUnit, 2);

  if (descriptor.year < 2000 || descriptor.year > 65535) {
    throw new ValidationError("year must fit inside an unsigned 16-bit integer.");
  }

  if (descriptor.sequence < 0 || descriptor.sequence > 4294967295) {
    throw new ValidationError("sequence must fit inside an unsigned 32-bit integer.");
  }

  const bytes = new Uint8Array(20);
  bytes[0] = SCHEMA_PREFIX;

  writeAscii(bytes, 1, 3, descriptor.commodity);
  writeAscii(bytes, 4, 2, descriptor.region);
  writeUint16(bytes, 6, descriptor.year);
  writeAscii(bytes, 8, 2, descriptor.cycle);
  writeAscii(bytes, 10, 2, descriptor.grade);
  writeAscii(bytes, 12, 2, descriptor.lotUnit);
  writeUint32(bytes, 14, descriptor.sequence);
  writeUint16(bytes, 18, descriptor.flags ?? 0);

  const hex = Array.from(bytes, (byte) => byte.toString(HEX_RADIX).padStart(2, "0")).join("").toUpperCase();

  if (hex.length !== CURRENCY_HEX_LENGTH) {
    throw new ValidationError(`XRPL currency hex must be ${CURRENCY_HEX_LENGTH} characters long.`);
  }

  return hex;
}
