import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

async function fixImports(directory) {
  const files = await fs.readdir(directory, { recursive: true });

  for (const file of files.filter(f => f.endsWith('.js'))) {
    const filePath = path.join(directory, file);
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Regular expression to find import/export statements with relative paths
    const newContent = content.replace(/(import|export)\s+.*\s+from\s+['"](\.\/.*)['"];/g, (match, type, importPath) => {
      // Check if the path is a directory that contains an index.js
      const fullPath = path.join(path.dirname(filePath), importPath);
      const isDirectory = fsSync.statSync(fullPath, { throwIfNoEntry: false })?.isDirectory();
      
      if (isDirectory) {
        // Correctly append /index.js
        return `${match.replace(importPath, `${importPath}/index.js`)}`;
      } else {
        // Correctly append .js
        return `${match.replace(importPath, `${importPath}.js`)}`;
      }
    });

    await fs.writeFile(filePath, newContent, 'utf-8');
  }
}

fixImports('./dist').catch(console.error);