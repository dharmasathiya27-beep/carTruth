import { VehicleDetails } from '@/lib/api';

export type VehicleBodyType = 'sedan' | 'hatchback' | 'SUV' | 'coupe' | 'estate' | 'van';
export type VehicleThemeName = 'black' | 'white' | 'blue' | 'red' | 'grey/silver' | 'green';

export interface VehicleVisualTheme {
  name: VehicleThemeName;
  base: string;
  accent: string;
  glow: string;
  surface: string;
  highlight: string;
  text: string;
}

export interface VehicleVisualProfile {
  bodyType: VehicleBodyType;
  theme: VehicleVisualTheme;
  manufacturer: {
    name: string;
    initials: string;
    logoText: string;
  };
  confidence: 'High' | 'Medium' | 'Low';
  inferenceNotes: string[];
  disclaimer: string;
}

const THEMES: Record<VehicleThemeName, VehicleVisualTheme> = {
  black: {
    name: 'black',
    base: '#020617',
    accent: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.34)',
    surface: 'rgba(15, 23, 42, 0.86)',
    highlight: '#e2e8f0',
    text: '#f8fafc',
  },
  white: {
    name: 'white',
    base: '#e2e8f0',
    accent: '#38bdf8',
    glow: 'rgba(226, 232, 240, 0.44)',
    surface: 'rgba(248, 250, 252, 0.9)',
    highlight: '#ffffff',
    text: '#0f172a',
  },
  blue: {
    name: 'blue',
    base: '#1d4ed8',
    accent: '#67e8f9',
    glow: 'rgba(37, 99, 235, 0.5)',
    surface: 'rgba(30, 64, 175, 0.88)',
    highlight: '#bfdbfe',
    text: '#eff6ff',
  },
  red: {
    name: 'red',
    base: '#991b1b',
    accent: '#fb7185',
    glow: 'rgba(239, 68, 68, 0.42)',
    surface: 'rgba(127, 29, 29, 0.88)',
    highlight: '#fecdd3',
    text: '#fff1f2',
  },
  'grey/silver': {
    name: 'grey/silver',
    base: '#475569',
    accent: '#cbd5e1',
    glow: 'rgba(203, 213, 225, 0.34)',
    surface: 'rgba(51, 65, 85, 0.9)',
    highlight: '#f8fafc',
    text: '#f8fafc',
  },
  green: {
    name: 'green',
    base: '#166534',
    accent: '#86efac',
    glow: 'rgba(34, 197, 94, 0.42)',
    surface: 'rgba(20, 83, 45, 0.88)',
    highlight: '#dcfce7',
    text: '#f0fdf4',
  },
};

const BODY_HINTS: Record<VehicleBodyType, string[]> = {
  van: [
    'van',
    'transit',
    'transporter',
    'sprinter',
    'vivaro',
    'trafic',
    'boxer',
    'relay',
    'partner',
    'berlingo',
    'caddy',
    'vito',
    'ducato',
  ],
  SUV: [
    'suv',
    'crossover',
    '4x4',
    'range rover',
    'discovery',
    'evoque',
    'sportage',
    'qashqai',
    'juke',
    'mokka',
    'tiguan',
    'touareg',
    'rav4',
    'kuga',
    'x3',
    'x5',
    'xc40',
    'xc60',
    'captur',
    'kadjar',
    'tucson',
    'kona',
    'cr-v',
    'vitara',
    'duster',
  ],
  estate: [
    'estate',
    'touring',
    'avant',
    'sportwagon',
    'sportswagon',
    'tourer',
    'wagon',
    'sw',
    'shooting brake',
  ],
  coupe: [
    'coupe',
    'coupé',
    'convertible',
    'cabriolet',
    'roadster',
    'mx-5',
    'tt',
    'z4',
    'slk',
    'cayman',
    'boxster',
    '911',
    'brz',
    'gt86',
  ],
  hatchback: [
    'hatchback',
    'hatch',
    'golf',
    'polo',
    'fiesta',
    'focus',
    'corsa',
    'astra',
    'clio',
    'megane',
    'yaris',
    'aygo',
    'auris',
    'civic',
    'leon',
    'ibiza',
    'mini',
    'a1',
    'a3',
  ],
  sedan: ['sedan', 'saloon', 'passat', 'mondeo', 'insignia', 'accord', 'camry', 'model 3'],
};

const THEME_HINTS: Array<[VehicleThemeName, string[]]> = [
  ['black', ['black']],
  ['white', ['white', 'cream', 'ivory']],
  ['blue', ['blue']],
  ['red', ['red', 'maroon', 'burgundy']],
  ['grey/silver', ['grey', 'gray', 'silver', 'beige', 'bronze', 'gold']],
  ['green', ['green']],
];

function normalise(value?: string | number | null) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function inferBodyType(
  vehicle: VehicleDetails,
): Pick<VehicleVisualProfile, 'bodyType' | 'confidence' | 'inferenceNotes'> {
  const explicitBody = normalise(
    vehicle.body_style || vehicle.bodyStyle || vehicle.body_type || vehicle.bodyType,
  );
  const wheelplan = normalise(vehicle.wheelplan);
  const modelText = `${normalise(vehicle.make)} ${normalise(vehicle.model)}`;
  const notes: string[] = [];

  if (explicitBody) {
    for (const [bodyType, hints] of Object.entries(BODY_HINTS) as Array<
      [VehicleBodyType, string[]]
    >) {
      if (hints.some((hint) => explicitBody.includes(hint))) {
        notes.push(`Body style matched "${explicitBody}".`);
        return { bodyType, confidence: 'High', inferenceNotes: notes };
      }
    }
  }

  if (
    wheelplan.includes('rigid') &&
    modelText.match(/transit|sprinter|vivaro|trafic|boxer|relay/)
  ) {
    notes.push('Wheelplan and model hints suggest a van.');
    return { bodyType: 'van', confidence: 'Medium', inferenceNotes: notes };
  }

  for (const [bodyType, hints] of Object.entries(BODY_HINTS) as Array<
    [VehicleBodyType, string[]]
  >) {
    if (hints.some((hint) => modelText.includes(hint))) {
      notes.push(`Make/model hint matched ${bodyType}.`);
      return { bodyType, confidence: 'Medium', inferenceNotes: notes };
    }
  }

  if (wheelplan.includes('2 axle rigid body')) {
    notes.push('DVLA wheelplan is a standard passenger-vehicle pattern.');
    return { bodyType: 'sedan', confidence: 'Low', inferenceNotes: notes };
  }

  notes.push('No exact body-style signal available; using a neutral sedan silhouette.');
  return { bodyType: 'sedan', confidence: 'Low', inferenceNotes: notes };
}

function inferTheme(colour?: string) {
  const colourText = normalise(colour);
  const matchedTheme = THEME_HINTS.find(([, hints]) =>
    hints.some((hint) => colourText.includes(hint)),
  )?.[0];

  return THEMES[matchedTheme || 'grey/silver'];
}

function manufacturerProfile(make?: string) {
  const cleanMake = titleCase(make || 'Unknown');
  const words = cleanMake.split(/\s+/).filter(Boolean);
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('');

  return {
    name: cleanMake,
    initials: initials || 'CT',
    logoText: cleanMake === 'Unknown' ? 'Manufacturer' : cleanMake.toUpperCase(),
  };
}

export function getVehicleVisualProfile(vehicle: VehicleDetails): VehicleVisualProfile {
  const body = inferBodyType(vehicle);

  return {
    ...body,
    theme: inferTheme(vehicle.colour),
    manufacturer: manufacturerProfile(vehicle.make),
    disclaimer: 'Representative visual identity only. This is not an exact image of the vehicle.',
  };
}
