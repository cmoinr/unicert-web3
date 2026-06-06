import fs from 'fs';
import path from 'path';

const fonts = {
  regular: 'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf',
  bold: 'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Bold.ttf',
  italic: 'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Italic.ttf',
  boldItalic: 'https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-BoldItalic.ttf'
};

async function downloadAndConvert() {
  try {
    console.log('Descargando fuentes JetBrains Mono...');
    const result = {};

    for (const [key, url] of Object.entries(fonts)) {
      console.log(`Descargando ${key} desde ${url}...`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error descargando ${key}: ${response.statusText}`);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      result[key] = base64;
    }

    const outputContent = `// Archivo generado automáticamente con codificación Base64 de las fuentes JetBrains Mono
export const JETBRAINS_MONO_REGULAR = "${result.regular}";
export const JETBRAINS_MONO_BOLD = "${result.bold}";
export const JETBRAINS_MONO_ITALIC = "${result.italic}";
export const JETBRAINS_MONO_BOLDITALIC = "${result.boldItalic}";
`;

    const outputPath = path.resolve('src/utils/jetbrainsMonoBase64.js');
    fs.writeFileSync(outputPath, outputContent);
    console.log(`Fuentes exportadas exitosamente en: ${outputPath}`);
  } catch (error) {
    console.error('Error procesando las fuentes:', error);
  }
}

downloadAndConvert();
