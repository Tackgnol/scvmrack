import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, '..', '.env.mydevil');

try {
    const data = fs.readFileSync(ENV_PATH, 'utf8');

    const vars = data
        .split('\n')
        .map(line => line.replace(/\r/g, '').trim())
        .filter(line => line.length > 0 && !line.startsWith('#'))
        .map(line => {
            // Find first separator (supports both : and =)
            const match = line.match(/[:=]/);
            if (!match) return null;

            const separatorIndex = match.index;
            const key = line.substring(0, separatorIndex).trim();
            const value = line.substring(separatorIndex + 1).trim();

            return `export ${key}='${value}'`;
        })
        .filter(Boolean);

    console.log("\n--- COPY AND PASTE INTO .bash_profile ---");
    console.log("\n# --- MYDEVIL_ENV_VARS ---");
    console.log(vars.join('\n'));
    console.log("# --- MYDEVIL_ENV_VARS END ---\n");

} catch (err) {
    console.error(`Error: ${err.message}`);
}
