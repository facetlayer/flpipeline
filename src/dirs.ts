import path from "path";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_ROOT_DIR = path.resolve(scriptDir, '..');