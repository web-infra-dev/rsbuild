export const JSExtension = '.js';

export const CSSExtension = '.css';

export const HtmlExtension = '.html';

export const ImgExtensions = [
  '.png',
  '.jpg',
  '.svg',
  '.webp',
  '.jpeg',
  '.gif',
  '.bmp',
];

export const MediaExtensions = [
  '.mp3',
  '.mp4',
  '.avi',
  '.wav',
  '.flv',
  '.mov',
  '.mpg',
  '.mpeg',
];

export const FontExtensions = ['.ttf', '.fnt', '.fon', '.otf'];

export const MapExtensions = ['.js.map', '.ts.map', '.LICENSE.txt'];

export const DoctorOutputFolder = '.rsbuild-doctor';

export const DoctorOutputManifest = 'manifest.json';

export const DoctorOutputManifestPath =
  `${DoctorOutputFolder}/${DoctorOutputManifest}` as const;

export const StatsFilePath = 'dist/stats.json';

export const DoctorMonitorNodeBId = 'Rsbuild-Doctor';

export const DoctorMonitorWebBId = 'Rsbuild-Doctor-Client';

export const DoctorMonitorDocBId = 'Rsbuild-Doctor-Doc';

export const DoctorProcessEnvDebugKey = 'RSBUILD_DOCTOR_DEBUG';
