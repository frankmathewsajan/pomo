import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execSync } from 'node:child_process';
import readline from 'node:readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Wrapper to execute shell commands natively 
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
const runSilent = (cmd) => {
    try { return execSync(cmd, { stdio: 'pipe' }).toString().trim(); } 
    catch (e) { return null; }
};

async function main() {
    const pkgPath = 'package.json';
    const tauriConfPath = 'src-tauri/tauri.conf.json';
    const cargoPath = 'src-tauri/Cargo.toml';

    let pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    let currentVersion = pkg.version;
    console.log(`Current version is ${currentVersion}`);

    const updatePrompt = await question('Do you want to update the version before releasing? (y/N): ');
    let targetVersion = currentVersion;

    if (updatePrompt.toLowerCase() === 'y') {
        const bumpChoice = await question("Enter 'patch', 'minor', 'major', or specific version [default: patch]: ") || 'patch';
        
        if (['patch', 'minor', 'major'].includes(bumpChoice)) {
            const parts = currentVersion.split('.').map(Number);
            if (bumpChoice === 'patch') parts[2]++;
            if (bumpChoice === 'minor') { parts[1]++; parts[2] = 0; }
            if (bumpChoice === 'major') { parts[0]++; parts[1] = 0; parts[2] = 0; }
            targetVersion = parts.join('.');
        } else {
            targetVersion = bumpChoice;
        }

        console.log(`\nSyncing version ${targetVersion} across files...`);

        // 1. Mutate the JSON sources of truth
        const updateJson = (path, mutator) => {
            if (!existsSync(path)) return;
            const data = JSON.parse(readFileSync(path, 'utf8'));
            mutator(data);
            writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
        };

        updateJson(pkgPath, d => d.version = targetVersion);
        updateJson(tauriConfPath, d => d.version = targetVersion);

        // 2. Mutate the Cargo configuration
        let cargo = readFileSync(cargoPath, 'utf8');
        cargo = cargo.replace(/^(\[package\][\s\S]*?^version\s*=\s*")[^"]+(")/m, `$1${targetVersion}$2`);
        writeFileSync(cargoPath, cargo);

        // 3. Delegate lockfile cryptographic synchronization to Bun
        console.log(`Synchronizing bun.lock via bun install...`);
        runSilent('bun install');
    }

    const tagName = `v${targetVersion}`;
    console.log(`\nPreparing release for ${tagName}...`);

    // Determine OS architecture and map to corresponding Tauri build flags
    const isWin = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    
    console.log(`Building Tauri app for ${process.platform}...`);
    if (isWin) {
        run('bun run tauri build');
    } else if (isMac) {
        run('bun run tauri build -- --bundles app,dmg');
    } else {
        run('bun run tauri build -- --bundles deb,rpm,appimage');
    }

    // Git Tagging Matrix (gracefully handle existing remote tags)
    console.log(`\nHandling Git Tag ${tagName}...`);
    const tagExists = runSilent(`git ls-remote --tags origin ${tagName}`);
    if (!tagExists) {
        try {
            run(`git tag ${tagName}`);
            run(`git push origin ${tagName}`);
        } catch (e) {
            console.log("Local tag collision detected. Bypassing creation...");
        }
    } else {
        console.log(`Tag ${tagName} already exists on remote.`);
    }

    // Artifact Collection Engine
    const bundleDir = 'src-tauri/target/release/bundle';
    const allowedExts = ['.msi', '.exe', '.deb', '.rpm', '.AppImage', '.dmg'];
    let artifacts = [];

    const findArtifacts = (dir) => {
        if (!existsSync(dir)) return;
        const files = readdirSync(dir);
        for (const file of files) {
            const fullPath = join(dir, file);
            if (statSync(fullPath).isDirectory()) {
                findArtifacts(fullPath);
            } else if (allowedExts.includes(extname(fullPath))) {
                if (file.includes(targetVersion)) {
                    artifacts.push(fullPath);
                } else {
                    console.log(`Ignoring stale artifact: ${file}`);
                }
            }
        }
    };

    findArtifacts(bundleDir);

    if (artifacts.length === 0) {
        console.error('\nFatal Error: No compiled binaries located. Terminating GitHub upload.');
        process.exit(1);
    }

    console.log('\nDeploying the following artifacts:', artifacts);

    // GitHub Release Authentication and Upload Engine
    const releaseExists = runSilent(`gh release view ${tagName}`) !== null;

    if (releaseExists) {
        console.log(`\nRelease ${tagName} detected. Appending artifacts...`);
        run(`gh release upload ${tagName} ${artifacts.map(a => `"${a}"`).join(' ')} --clobber`);
    } else {
        console.log(`\nInstantiating new release ${tagName}...`);
        run(`gh release create ${tagName} ${artifacts.map(a => `"${a}"`).join(' ')} --title "Release ${tagName}" --generate-notes`);
    }

    console.log('\nDeployment cycle successfully terminated.');
    rl.close();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});