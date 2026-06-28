const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');
const compsDir = path.join(__dirname, 'components');

function fixFile(filePath) {
    if (!filePath.endsWith('.jsx')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    let lines = content.split('\n');
    let newLines = lines.map(line => {
        if (line.includes('className=') && line.includes('bg-white')) {
            if (line.includes('card')) {
                line = line.replace(/ bg-white/g, '');
                line = line.replace(/ border border-surface-200(\/80)?/g, '');
                line = line.replace(/ shadow-sm/g, '');
                line = line.replace(/ p-6/g, '');
                line = line.replace(/ p-8/g, '');
                line = line.replace(/ rounded-3xl/g, '');
                line = line.replace(/ rounded-2xl/g, '');
                line = line.replace(/ rounded-xl/g, '');
            } else {
                if (line.includes('bg-white/95')) {
                    line = line.replace('bg-white/95', 'bg-white/95 dark:bg-[#0b1220]/95');
                } else if (line.includes('bg-white') && !line.includes('dark:bg-')) {
                    line = line.replace('bg-white', 'bg-white dark:bg-[#0b1220]');
                }
            }
        }
        
        if (line.includes('className=') && line.includes('text-surface-900') && !line.includes('dark:text-')) {
            line = line.replace(/text-surface-900/g, 'text-surface-900 dark:text-white');
        }
        return line;
    });
    
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
}

fs.readdirSync(pagesDir).forEach(file => fixFile(path.join(pagesDir, file)));
fs.readdirSync(compsDir).forEach(file => fixFile(path.join(compsDir, file)));
console.log('Done!');
