import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '../public/icons');

// Ensure icons directory exists
mkdirSync(iconsDir, { recursive: true });

const svgContent = readFileSync(join(iconsDir, 'icon.svg'));

// Badge SVG (simpler version for notifications)
const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72">
  <rect width="72" height="72" rx="14" fill="#6366f1"/>
  <path d="M12 20 Q12 12 20 12 L52 12 Q60 12 60 20 L60 28 Q56 28 56 32 Q56 36 60 36 L60 52 Q60 60 52 60 L20 60 Q12 60 12 52 L12 36 Q16 36 16 32 Q16 28 12 28 Z" fill="white" opacity="0.95"/>
</svg>`;

async function generateIcons() {
  console.log('Generating PWA icons...');

  // Generate main icons
  await sharp(svgContent)
    .resize(192, 192)
    .png()
    .toFile(join(iconsDir, 'icon-192.png'));
  console.log('✓ icon-192.png');

  await sharp(svgContent)
    .resize(512, 512)
    .png()
    .toFile(join(iconsDir, 'icon-512.png'));
  console.log('✓ icon-512.png');

  // Generate badge icon
  await sharp(Buffer.from(badgeSvg))
    .resize(72, 72)
    .png()
    .toFile(join(iconsDir, 'badge-72.png'));
  console.log('✓ badge-72.png');

  // Generate favicon
  await sharp(svgContent)
    .resize(32, 32)
    .png()
    .toFile(join(__dirname, '../public/favicon.png'));
  console.log('✓ favicon.png');

  // Generate Apple touch icon
  await sharp(svgContent)
    .resize(180, 180)
    .png()
    .toFile(join(iconsDir, 'apple-touch-icon.png'));
  console.log('✓ apple-touch-icon.png');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
