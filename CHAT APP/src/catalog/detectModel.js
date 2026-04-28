import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vehiclesPath = path.join(__dirname, 'vehicles.json');
const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, 'utf-8'));

export function detectModelsFromText(textRaw) {
  const text = textRaw.toLowerCase();
  const detected = [];

  Object.entries(vehicles).forEach(([brand, models]) => {
    Object.keys(models).forEach((modelName) => {
      if (text.includes(modelName.toLowerCase())) {
        detected.push({ brand, model: modelName });
      }
    });
  });

  return detected;
}