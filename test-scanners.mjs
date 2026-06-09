// Quick smoke test for the new fetch-based scanners
import { checkISOStandards } from './scanner/sources/iso.js';
import { checkIECStandards } from './scanner/sources/iec.js';

const isoRegs = [
  { code: 'ISO 13485', body: 'ISO' },
  { code: 'ISO 14971', body: 'ISO' },
];
const iecRegs = [
  { code: 'IEC 62366-1', body: 'IEC' },
  { code: 'IEC 60601-2-44', body: 'IEC' },
];

console.log('=== ISO ===');
const isoResults = await checkISOStandards(isoRegs);
console.log(isoResults);

console.log('\n=== IEC ===');
const iecResults = await checkIECStandards(iecRegs);
console.log(iecResults);
