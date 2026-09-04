const fs = require('fs');
const path = require('path');

// Directorios y rutas
const frontendDir = path.resolve(__dirname, '..');
const envPath = path.join(frontendDir, '.env');
const envProdPath = path.join(frontendDir, '.env.production');
const envExamplePath = path.join(frontendDir, '.env.example');
const envDir = path.join(frontendDir, 'src', 'environments');

/**
 * Parser nativo y seguro de archivos .env (sin dependencias npm)
 */
function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = {};
    for (const rawLine of content.split('\n')) {
      const line = rawLine.replace(/[\r\u23ce]/g, '').trim();
      if (!line || line.startsWith('#')) continue;
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        result[key] = val;
      }
    }
    return result;
  } catch (err) {
    console.warn(`[set-env] Advertencia al leer ${filePath}:`, err.message);
    return {};
  }
}

// Cargar fuentes de configuración con prioridad: .env > process.env > .env.example > defaults
const localEnv = parseEnv(envPath);
const prodEnv = parseEnv(envProdPath);
const exampleEnv = parseEnv(envExamplePath);

function findValue(sources, keys) {
  for (const src of sources) {
    for (const k of keys) {
      if (src && src[k] !== undefined && src[k] !== '') {
        return src[k];
      }
    }
  }
  return null;
}

function getDevVar(keys, fallback = '') {
  return findValue([localEnv, process.env, exampleEnv], keys) || fallback;
}

function getProdVar(keys, fallback = '') {
  return findValue([prodEnv, localEnv, process.env, exampleEnv], keys) || fallback;
}

// Normalizar URLs asegurando /api
function normalizeApiUrl(url) {
  if (!url) return '';
  const cleanUrl = url.replace(/\/+$/, '');
  if (!cleanUrl.endsWith('/api') && !cleanUrl.includes('/api/')) {
    return `${cleanUrl}/api`;
  }
  return cleanUrl;
}

const rawDevApiUrl = getDevVar(
  ['API_BASE_URL', 'API_URL', 'VITE_API_BASE_URL'],
  'http://localhost:8000/api'
);
const devApiUrl = normalizeApiUrl(rawDevApiUrl);

const rawProdApiUrl = getProdVar(
  ['PRODUCTION_API_URL', 'PROD_API_URL', 'API_URL_PROD', 'VITE_PRODUCTION_API_URL'],
  'https://edubid-backend-production.up.railway.app/api'
);
const prodApiUrl = normalizeApiUrl(rawProdApiUrl);

const googleClientId = getDevVar(
  ['GOOGLE_CLIENT_ID', 'VITE_GOOGLE_CLIENT_ID'],
  ''
);

// Garantizar existencia del directorio src/environments
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
}

// Generar environment.ts (desarrollo)
const devContent = `// Archivo autogenerado por scripts/set-env.js a partir de .env
// NO EDITAR MANUALMENTE - NO SUBIR AL REPOSITORIO (ignorado por git)
export const environment = {
  production: false,
  apiUrl: '${devApiUrl}',
  googleClientId: '${googleClientId}',
};
`;

// Generar environment.prod.ts (producción)
const prodContent = `// Archivo autogenerado por scripts/set-env.js a partir de .env
// NO EDITAR MANUALMENTE - NO SUBIR AL REPOSITORIO (ignorado por git)
export const environment = {
  production: true,
  apiUrl: '${prodApiUrl}',
  googleClientId: '${googleClientId}',
};
`;

fs.writeFileSync(path.join(envDir, 'environment.ts'), devContent, 'utf8');
fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), prodContent, 'utf8');

console.log('✅ [set-env] Entornos sincronizados con éxito desde .env:');
console.log(`   • apiUrl (dev) : ${devApiUrl}`);
console.log(`   • apiUrl (prod): ${prodApiUrl}`);
console.log(`   • googleClientId: ${googleClientId ? `${googleClientId.substring(0, 16)}...` : '(no configurado)'}`);
