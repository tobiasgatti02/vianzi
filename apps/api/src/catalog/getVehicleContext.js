import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolver path absoluto al JSON
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vehiclesPath = path.join(__dirname, 'vehicles.json');
const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, 'utf-8'));

export function getVehicleContext(brand, model) {
  const versions = vehicles?.[brand]?.[model];
  if (!versions) return '';

  let context = `Información disponible del ${brand} ${model}:\n\n`;

  versions.forEach((v) => {
    context += `Versión: ${v.version}\n`;
    context += `Segmento: ${v.segment}\n`;
    context += `Motor: ${v.engine}\n`;
    context += `Transmisión: ${v.transmission}\n`;
    context += `Seguridad: ${v.safety.join(', ')}\n`;

    context += v.esp
      ? `Incluye control de estabilidad.\n`
      : `No incluye control de estabilidad.\n`;

    context += `Precio de lista aproximado: ${v.pricing.list} ${v.pricing.currency}.\n`;
    context += `Disponible contado: ${v.available.cash ? 'Sí' : 'No'}.\n`;
    context += `Disponible financiado: ${v.available.finance ? 'Sí' : 'No'}.\n\n`;
  });

  return context;
}