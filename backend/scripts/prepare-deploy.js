import fs from "fs";
import path from "path";
import { execSync } from "child_process"; // Added to run build commands

const out = "public_nodejs";

// --- 1. PREPARE FRONTEND ENV ---
const clientPath = path.join(process.cwd(), "..", "frontend");
const feEnvDefault = path.join(clientPath, ".env");
const feEnvMyDevil = path.join(clientPath, ".env.mydevil");

if (fs.existsSync(feEnvMyDevil)) {
    console.log("🚀 Swapping to MyDevil environment for Frontend build...");
    // Backup original .env if it exists
    if (fs.existsSync(feEnvDefault)) {
        fs.renameSync(feEnvDefault, feEnvDefault + ".bak");
    }
    // Copy MyDevil env to the main .env position
    fs.copyFileSync(feEnvMyDevil, feEnvDefault);
}

// --- 2. RUN THE BUILD ---
console.log("📦 Building Frontend...");
// Adjust this command to whatever you use (npm run build, vite build, etc)
execSync("npm run build --prefix ../frontend", { stdio: "inherit" });

// --- 3. CLEANUP ENV (Restore original) ---
if (fs.existsSync(feEnvDefault + ".bak")) {
    fs.renameSync(feEnvDefault + ".bak", feEnvDefault);
    console.log("♻️  Restored local .env for Frontend.");
}

// --- 4. DEPLOYMENT STEPS (Your original code) ---
console.log("📂 Preparing public_nodejs folder...");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

fs.cpSync("dist", path.join(out, "dist"), { recursive: true });
fs.cpSync(path.join(clientPath, "dist"), path.join(out, "public"), { recursive: true });

fs.copyFileSync("app.js", path.join(out, "app.js"));

// Copy backend .env.mydevil as .env so dotenv loads it at runtime
const beEnvMyDevil = path.join(process.cwd(), ".env.mydevil");
if (fs.existsSync(beEnvMyDevil)) {
    fs.copyFileSync(beEnvMyDevil, path.join(out, ".env"));
    console.log("📋 Copied .env.mydevil as .env for backend");
}

// Deploy package.json without "type": "module" so Passenger can require() app.js as CJS.
// A separate dist/package.json with "type": "module" ensures compiled files stay ESM.
const pkg = JSON.parse(fs.readFileSync("package.json", "utf-8"));
delete pkg.type;
pkg.main = "app.js";
fs.writeFileSync(path.join(out, "package.json"), JSON.stringify(pkg, null, 2));

// Mark dist/ as ESM so compiled TypeScript imports work correctly
fs.writeFileSync(path.join(out, "dist", "package.json"), JSON.stringify({ type: "module" }, null, 2));

fs.copyFileSync("package-lock.json", path.join(out, "package-lock.json"));

console.log("✅ Build and deployment preparation complete!");
