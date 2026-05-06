import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vehiclesPath = path.join(__dirname, "vehicles.json");
const vehicles = JSON.parse(fs.readFileSync(vehiclesPath, "utf-8")) as Record<string, any>;

export function detectModelsFromText(textRaw: string) {
  const text = (textRaw || "").toLowerCase();
  const detected: Array<{ brand: string; model: string }> = [];

  Object.entries(vehicles).forEach(([brand, models]) => {
    Object.keys(models as Record<string, any>).forEach((modelName) => {
      if (text.includes(modelName.toLowerCase())) {
        detected.push({ brand, model: modelName });
      }
    });
  });

  return detected;
}
