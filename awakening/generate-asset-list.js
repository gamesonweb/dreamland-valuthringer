// generate-asset-list.js
const fs = require('fs');
const path = require('path');

const assetsRootDir = path.resolve(__dirname, 'public/models/assets');
const outputDir = path.resolve(__dirname, 'src/assets/list');

// Crée le dossier de sortie s'il n'existe pas
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const folders = fs.readdirSync(assetsRootDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

folders.forEach(folderName => {
  const folderPath = path.join(assetsRootDir, folderName);
  const files = fs.readdirSync(folderPath)
    .filter(file => file.endsWith('.glb'))
    .map(file => `"${file}"`);

  const varName = folderName.replace(/[-\s]/g, '_'); // Nom variable TS (remplace tirets/espace par underscore)

  const content = `// This file is auto-generated\n` +
    `export const ${varName} = [\n  ${files.join(',\n  ')}\n];\n`;

  const outputFile = path.join(outputDir, `${folderName}.ts`);

  fs.writeFileSync(outputFile, content);
  console.log(`✅ Liste générée dans ${outputFile}`);
});

