import { cpSync, mkdirSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const engineDir = join(root, "node_modules", "stockfish", "bin");
const engineName = "stockfish-19-lite-single";

if (!existsSync(join(engineDir, `${engineName}.js`)) ||
    !existsSync(join(engineDir, `${engineName}.wasm`))) {
  throw new Error("Stockfish JS/WASM файлдары табылмады. npm install жасап көріңіз.");
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "src"), { recursive: true });
mkdirSync(join(dist, "engine"), { recursive: true });

copyFileSync(join(root, "index.html"), join(dist, "index.html"));
copyFileSync(join(root, "src", "style.css"), join(dist, "src", "style.css"));
copyFileSync(join(root, "src", "app.js"), join(dist, "src", "app.js"));
copyFileSync(join(engineDir, `${engineName}.js`), join(dist, "engine", `${engineName}.js`));
copyFileSync(join(engineDir, `${engineName}.wasm`), join(dist, "engine", `${engineName}.wasm`));

console.log("CHESS ARENA build дайын: dist/");
