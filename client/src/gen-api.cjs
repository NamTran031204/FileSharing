const fs = require('node:fs');
const path = require('node:path');
const {codegen} = require('swagger-axios-codegen');

const OUTPUT_DIR = './src/api/api';
const CONTROLLER_FILE_PATTERN = /ControllerService\.ts$/;
const RUNTIME_EXPORTS = new Set(['getConfigs', 'axios', 'basePath']);

function toTypeOnlyImports(content) {
    const importPattern = /import\s*\{([\s\S]*?)\}\s*from\s*['"]\.\/index\.defs['"];?/m;
    const match = content.match(importPattern);

    if (!match) {
        return content;
    }

    const rawSpecifiers = match[1]
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part.replace(/^type\s+/, '').trim());

    const nextSpecifiers = rawSpecifiers.map((name) => (
        RUNTIME_EXPORTS.has(name) ? name : `type ${name}`
    ));

    const rewrittenImport = `import {\n  ${nextSpecifiers.join(',\n  ')}\n} from './index.defs';`;
    return content.replace(importPattern, rewrittenImport);
}

function patchGeneratedControllers() {
    const outputPath = path.resolve(process.cwd(), OUTPUT_DIR);

    if (!fs.existsSync(outputPath)) {
        throw new Error(`Generated output folder not found: ${outputPath}`);
    }

    const files = fs.readdirSync(outputPath)
        .filter((fileName) => CONTROLLER_FILE_PATTERN.test(fileName));

    for (const fileName of files) {
        const fullPath = path.join(outputPath, fileName);
        const original = fs.readFileSync(fullPath, 'utf8');
        const updated = toTypeOnlyImports(original);

        if (updated !== original) {
            fs.writeFileSync(fullPath, updated, 'utf8');
        }
    }
}

async function run() {
    await codegen({
        methodNameMode: 'path',
        remoteUrl: 'http://localhost:5000/v3/api-docs',
        outputDir: OUTPUT_DIR,
        strictNullChecks: false,
        modelMode: 'interface',
        multipleFileMode: true,
        useStaticMethod: true,
    });

    patchGeneratedControllers();
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});