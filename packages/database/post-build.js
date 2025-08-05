import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

async function fixImports(directory) {
  const files = await fs.readdir(directory, { recursive: true });

  for (const file of files.filter(f => f.endsWith('.js'))) {
    const filePath = path.join(directory, file);
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Simpler regex to find all import/export statements
    const newContent = content.replace(/(import|export)\s+.*?from\s+['"]([^'"]+)['"];?/g, (match, type, importPath) => {
      // Only process relative paths
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        return match;
      }
      
      // Handle imports from your own packages (e.g., '@dadgic/database')
      if (importPath.startsWith('@dadgic')) {
        return match;
      }
      
      // Check if the path is a directory that contains an index.js
      const fullPath = path.join(path.dirname(filePath), importPath);
      
      // Use a try-catch for statSync to handle non-existent files gracefully
      let isDirectory = false;
      try {
        isDirectory = fsSync.statSync(fullPath)?.isDirectory();
      } catch (e) {
        // We'll assume it's a file that just needs .js
      }
      
      let newImportPath = importPath;
      if (isDirectory) {
        // Correctly append /index.js
        newImportPath = `${importPath}/index.js`;
      } else {
        // Correctly append .js
        newImportPath = `${importPath}.js`;
      }
      
      return match.replace(importPath, newImportPath);
    });

    await fs.writeFile(filePath, newContent, 'utf-8');
  }
}

fixImports('./dist').catch(console.error);