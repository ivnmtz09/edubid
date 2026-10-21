/**
 * Generador de Código QR Vectorial Autónomo (Pure TypeScript)
 * Implementación ligera y robusta de QR Code (Model 2, Byte Mode, Reed-Solomon ECC).
 * Zero dependencias externas (compatible con entornos con restricciones de npm).
 */

// Tablas de Galois Field GF(256) para Reed-Solomon
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);

(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_EXP[i + 255] = x;
    GF256_LOG[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
})();

function gfMultiply(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF256_EXP[GF256_LOG[x] + GF256_LOG[y]];
}

function polyMultiply(p1: number[], p2: number[]): number[] {
  const result = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      result[i + j] ^= gfMultiply(p1[i], p2[j]);
    }
  }
  return result;
}

function getGeneratorPoly(degree: number): number[] {
  let g = [1];
  for (let i = 0; i < degree; i++) {
    g = polyMultiply(g, [1, GF256_EXP[i]]);
  }
  return g;
}

function rsRemainder(data: number[], degree: number): number[] {
  const gen = getGeneratorPoly(degree);
  const result = [...data, ...new Array(degree).fill(0)];
  for (let i = 0; i < data.length; i++) {
    const factor = result[i];
    if (factor !== 0) {
      for (let j = 0; j < gen.length; j++) {
        result[i + j] ^= gfMultiply(gen[j], factor);
      }
    }
  }
  return result.slice(data.length);
}

// Configuración de versiones estándar para URLs (Versión 3, 4, 5, 6 con nivel M)
interface QRVersionConfig {
  version: number;
  size: number;
  totalBytes: number;
  dataBytes: number;
  ecBytes: number;
  alignPos: number[];
}

const QR_CONFIGS: QRVersionConfig[] = [
  { version: 2, size: 25, totalBytes: 44, dataBytes: 28, ecBytes: 16, alignPos: [6, 18] },
  { version: 3, size: 29, totalBytes: 70, dataBytes: 44, ecBytes: 26, alignPos: [6, 22] },
  { version: 4, size: 33, totalBytes: 100, dataBytes: 64, ecBytes: 36, alignPos: [6, 26] },
  { version: 5, size: 37, totalBytes: 134, dataBytes: 86, ecBytes: 48, alignPos: [6, 30] },
  { version: 6, size: 41, totalBytes: 172, dataBytes: 108, ecBytes: 64, alignPos: [6, 34] },
  { version: 7, size: 45, totalBytes: 196, dataBytes: 124, ecBytes: 72, alignPos: [6, 22, 38] },
];

export interface QrOptions {
  size?: number;
  color?: string;
  bgColor?: string;
  margin?: number;
}

/**
 * Codifica texto en una matriz booleana bidimensional de QR Code
 */
export function generateQrMatrix(text: string): boolean[][] {
  const utf8Bytes = new TextEncoder().encode(text);
  const dataLen = utf8Bytes.length;

  // Seleccionar la versión adecuada según la longitud de datos
  let cfg = QR_CONFIGS.find(c => c.dataBytes >= dataLen + 3);
  if (!cfg) {
    cfg = QR_CONFIGS[QR_CONFIGS.length - 1];
  }

  const { size, dataBytes, ecBytes, alignPos } = cfg;

  // Construir flujo de bits: Modo Byte (0100) + Longitud (8 bits) + Datos + Terminador
  const bitArray: number[] = [];
  const pushBits = (val: number, bits: number) => {
    for (let i = bits - 1; i >= 0; i--) {
      bitArray.push((val >> i) & 1);
    }
  };

  pushBits(0b0100, 4); // Byte mode
  pushBits(dataLen, 8); // Longitud
  for (const b of utf8Bytes) {
    pushBits(b, 8);
  }
  pushBits(0, Math.min(4, dataBytes * 8 - bitArray.length)); // Terminador

  while (bitArray.length % 8 !== 0) {
    bitArray.push(0);
  }

  // Padding con bytes alternados 0xEC y 0x11
  const padPatterns = [0xec, 0x11];
  let padIdx = 0;
  while (bitArray.length < dataBytes * 8) {
    pushBits(padPatterns[padIdx % 2], 8);
    padIdx++;
  }

  // Convertir bits en bytes de datos
  const dataCodewords: number[] = [];
  for (let i = 0; i < bitArray.length; i += 8) {
    let byte = 0;
    for (let b = 0; b < 8; b++) {
      byte = (byte << 1) | bitArray[i + b];
    }
    dataCodewords.push(byte);
  }

  // Calcular corrección de errores Reed-Solomon
  const ecCodewords = rsRemainder(dataCodewords, ecBytes);
  const allCodewords = [...dataCodewords, ...ecCodewords];

  // Matriz de módulos y máscara de función
  const matrix: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));

  const setModule = (r: number, c: number, val: boolean, isRes = true) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
      if (isRes) reserved[r][c] = true;
    }
  };

  // 1. Patrones de búsqueda (Finder Patterns) 7x7 en las esquinas
  const drawFinder = (top: number, left: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = top + r;
        const col = left + c;
        if (row >= 0 && row < size && col >= 0 && col < size) {
          const isBlack =
            (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
            (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          setModule(row, col, isBlack);
        }
      }
    }
  };

  drawFinder(0, 0); // Top-Left
  drawFinder(0, size - 7); // Top-Right
  drawFinder(size - 7, 0); // Bottom-Left

  // 2. Patrones de Alineación
  if (alignPos && alignPos.length > 0) {
    for (const r of alignPos) {
      for (const c of alignPos) {
        if (reserved[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBlack = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
            setModule(r + dr, c + dc, isBlack);
          }
        }
      }
    }
  }

  // 3. Patrones de Temporización (Timing Patterns)
  for (let i = 8; i < size - 8; i++) {
    const isBlack = i % 2 === 0;
    setModule(6, i, isBlack);
    setModule(i, 6, isBlack);
  }

  // 4. Módulo oscuro fijo
  setModule(size - 8, 8, true);

  // 5. Reserva de formato
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      setModule(8, i, false);
      setModule(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setModule(8, size - 1 - i, false);
    setModule(size - 1 - i, 8, false);
  }

  // 6. Colocar datos en zigzag con máscara estándar (patrón checkerboard: (row + col) % 2 === 0)
  let bitIdx = 0;
  const totalBits = allCodewords.length * 8;
  let dir = -1;
  let r = size - 1;
  let c = size - 1;

  while (c > 0) {
    if (c === 6) c--; // Saltar columna de temporización
    for (let step = 0; step < size; step++) {
      const row = r;
      for (let colOffset = 0; colOffset < 2; colOffset++) {
        const col = c - colOffset;
        if (!reserved[row][col]) {
          let bit = false;
          if (bitIdx < totalBits) {
            const byte = allCodewords[Math.floor(bitIdx / 8)];
            bit = ((byte >> (7 - (bitIdx % 8))) & 1) === 1;
            bitIdx++;
          }
          // Aplicar máscara checkerboard (Pattern 0)
          const mask = (row + col) % 2 === 0;
          matrix[row][col] = bit !== mask;
        }
      }
      r += dir;
    }
    dir = -dir;
    r += dir;
    c -= 2;
  }

  // 7. Información de Formato (Nivel M, Máscara 000: 0x5412)
  const formatBits = 0x5412;
  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >> i) & 1) === 1;
    // Top-Left
    if (i < 6) setModule(8, i, bit, false);
    else if (i === 6) setModule(8, 7, bit, false);
    else if (i === 7) setModule(8, 8, bit, false);
    else if (i === 8) setModule(7, 8, bit, false);
    else setModule(14 - i, 8, bit, false);

    // Esquinas opuestas
    if (i < 8) setModule(size - 1 - i, 8, bit, false);
    else setModule(8, size - 15 + i, bit, false);
  }

  return matrix;
}

/**
 * Genera un SVG string independiente del código QR con estilos y colores personalizados.
 */
export function generateQrSvg(text: string, options: QrOptions = {}): string {
  const matrix = generateQrMatrix(text);
  const count = matrix.length;
  const margin = options.margin ?? 2;
  const size = options.size ?? 240;
  const color = options.color ?? '#0f172a';
  const bgColor = options.bgColor ?? '#ffffff';

  const totalSize = count + margin * 2;
  let pathData = '';

  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (matrix[r][c]) {
        const x = c + margin;
        const y = r + margin;
        pathData += `M${x},${y}h1v1h-1z `;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${size}" height="${size}" shape-rendering="crispEdges">
    <rect width="${totalSize}" height="${totalSize}" fill="${bgColor}" rx="1"/>
    <path d="${pathData.trim()}" fill="${color}"/>
  </svg>`;
}

/**
 * Descarga el código QR como imagen PNG renderizándolo a través de un canvas HTML5.
 */
export function downloadQrAsPng(svgString: string, filename: string, targetSize = 600): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetSize, targetSize);
    ctx.drawImage(img, 0, 0, targetSize, targetSize);
    URL.revokeObjectURL(url);

    const a = document.createElement('a');
    a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    a.href = canvas.toDataURL('image/png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  img.src = url;
}
