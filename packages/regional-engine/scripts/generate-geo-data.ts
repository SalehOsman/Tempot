/**
 * Generates data/geo/EG.json from country-state-city + Arabic name mappings.
 * Run: npx tsx scripts/generate-geo-data.ts
 *
 * The country-state-city package provides structure; Arabic names are maintained
 * as a static map since the upstream database lacks Arabic translations.
 */
import { State, City } from 'country-state-city';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Arabic governorate names keyed by ISO code */
const STATE_NAMES_AR: Record<string, string> = {
  ALX: '\u0627\u0644\u0625\u0633\u0643\u0646\u062f\u0631\u064a\u0629',
  ASN: '\u0623\u0633\u0648\u0627\u0646',
  AST: '\u0623\u0633\u064a\u0648\u0637',
  BH: '\u0627\u0644\u0628\u062d\u064a\u0631\u0629',
  BNS: '\u0628\u0646\u064a \u0633\u0648\u064a\u0641',
  C: '\u0627\u0644\u0642\u0627\u0647\u0631\u0629',
  DK: '\u0627\u0644\u062f\u0642\u0647\u0644\u064a\u0629',
  DT: '\u062f\u0645\u064a\u0627\u0637',
  FYM: '\u0627\u0644\u0641\u064a\u0648\u0645',
  GH: '\u0627\u0644\u063a\u0631\u0628\u064a\u0629',
  GZ: '\u0627\u0644\u062c\u064a\u0632\u0629',
  IS: '\u0627\u0644\u0625\u0633\u0645\u0627\u0639\u064a\u0644\u064a\u0629',
  KFS: '\u0643\u0641\u0631 \u0627\u0644\u0634\u064a\u062e',
  LX: '\u0627\u0644\u0623\u0642\u0635\u0631',
  MT: '\u0645\u0637\u0631\u0648\u062d',
  MN: '\u0627\u0644\u0645\u0646\u064a\u0627',
  MNF: '\u0627\u0644\u0645\u0646\u0648\u0641\u064a\u0629',
  WAD: '\u0627\u0644\u0648\u0627\u062f\u064a \u0627\u0644\u062c\u062f\u064a\u062f',
  SIN: '\u0634\u0645\u0627\u0644 \u0633\u064a\u0646\u0627\u0621',
  PTS: '\u0628\u0648\u0631\u0633\u0639\u064a\u062f',
  KB: '\u0627\u0644\u0642\u0644\u064a\u0648\u0628\u064a\u0629',
  KN: '\u0642\u0646\u0627',
  BA: '\u0627\u0644\u0628\u062d\u0631 \u0627\u0644\u0623\u062d\u0645\u0631',
  SHR: '\u0627\u0644\u0634\u0631\u0642\u064a\u0629',
  SHG: '\u0633\u0648\u0647\u0627\u062c',
  JS: '\u062c\u0646\u0648\u0628 \u0633\u064a\u0646\u0627\u0621',
  SUZ: '\u0627\u0644\u0633\u0648\u064a\u0633',
};

const COUNTRY_CODE = 'EG';

interface GeoStateOutput {
  id: string;
  code: string;
  name: string;
  name_ar: string;
  i18nKey: string;
  countryCode: string;
}

interface GeoCityOutput {
  id: string;
  stateId: string;
  name: string;
  name_ar: string;
  i18nKey: string;
}

const states = State.getStatesOfCountry(COUNTRY_CODE);

const geoStates: GeoStateOutput[] = states.map((state, index) => ({
  id: String(index + 1),
  code: state.isoCode,
  name: state.name,
  name_ar: STATE_NAMES_AR[state.isoCode] ?? state.name,
  i18nKey: `geo.${COUNTRY_CODE}.states.${state.isoCode}`,
  countryCode: COUNTRY_CODE,
}));

let cityCounter = 1;
const geoCities: GeoCityOutput[] = [];

for (const geoState of geoStates) {
  const cities = City.getCitiesOfState(COUNTRY_CODE, geoState.code);
  for (const city of cities) {
    const slugName = city.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    geoCities.push({
      id: String(cityCounter++),
      stateId: geoState.id,
      name: city.name,
      // Use city name as Arabic fallback — upstream lacks Arabic city names
      name_ar: city.name,
      i18nKey: `geo.${COUNTRY_CODE}.cities.${geoState.code}.${slugName}`,
    });
  }
}

const output = {
  countryCode: COUNTRY_CODE,
  states: geoStates,
  cities: geoCities,
};

const outPath = join(__dirname, '..', 'data', 'geo', 'EG.json');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n', 'utf-8');

process.stderr.write(
  `Generated ${outPath}: ${geoStates.length} states, ${geoCities.length} cities\n`,
);
