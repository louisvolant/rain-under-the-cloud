// bundle-code.js
const fs = require('fs');
const path = require('path');

async function concatenateCode(
    rootDirectory,
    outputFilePath,
    includeExtensions = [],
    excludeDirectories = ['node_modules', '.git', '.next', '.vscode', 'dist', 'build'],
    excludeFiles = ['.DS_Store', 'Thumbs.db', 'package-lock.json', 'yarn.lock'],
    maxFileSizeKB = 1000 // Max file size to include (e.g., 1MB)
) {
    let concatenatedContent = '';
    const processedFiles = [];
    const skippedFiles = [];
    const skippedDirectories = [];

    // Resolve the root directory to an absolute path immediately
    const absoluteRootDirectory = path.resolve(rootDirectory);
    console.log(`Resolved root directory: ${absoluteRootDirectory}`);

    /**
     * Recursively reads a directory and processes its files.
     * @param {string} currentAbsolutePath The current absolute directory path to read.
     */
    async function readDirectory(currentAbsolutePath) {
        let items;
        try {
            items = await fs.promises.readdir(currentAbsolutePath, { withFileTypes: true });
        } catch (err) {
            console.warn(`Warning: Could not read directory "${path.relative(absoluteRootDirectory, currentAbsolutePath)}". Skipping. Error: ${err.message}`);
            skippedDirectories.push(`${path.relative(absoluteRootDirectory, currentAbsolutePath)} (read error)`);
            return;
        }

        for (const item of items) {
            const itemAbsolutePath = path.join(currentAbsolutePath, item.name);
            const relativePathFromRoot = path.relative(absoluteRootDirectory, itemAbsolutePath);

            if (item.isDirectory()) {
                if (excludeDirectories.includes(item.name) || item.name.startsWith('.')) { // Exclude dot-directories like .vscode
                    skippedDirectories.push(relativePathFromRoot);
                    // console.log(`Skipping excluded directory: ${relativePathFromRoot}/`); // Optional: for detailed debugging
                    continue; // Skip excluded directories
                }
                // console.log(`Entering directory: ${relativePathFromRoot}/`); // Optional: for detailed debugging
                await readDirectory(itemAbsolutePath); // Recurse into subdirectories
            } else if (item.isFile()) {
                const fileExtension = path.extname(item.name).toLowerCase();
                const isExcludedFile = excludeFiles.includes(item.name);
                const isAllowedExtension = includeExtensions.length === 0 || includeExtensions.includes(fileExtension);

                if (isExcludedFile || !isAllowedExtension || item.name.startsWith('.')) { // Exclude dot-files like .DS_Store
                    skippedFiles.push(relativePathFromRoot);
                    // console.log(`Skipping excluded file: ${relativePathFromRoot}`); // Optional: for detailed debugging
                    continue; // Skip excluded files or files not in includeExtensions
                }

                try {
                    const stats = await fs.promises.stat(itemAbsolutePath);
                    if (stats.size > maxFileSizeKB * 1024) {
                        skippedFiles.push(`${relativePathFromRoot} (size: ${(stats.size / 1024 / 1024).toFixed(2)}MB, exceeds ${maxFileSizeKB}KB limit)`);
                        continue; // Skip large files
                    }

                    const content = await fs.promises.readFile(itemAbsolutePath, 'utf8');
                    concatenatedContent += `\n/* --- File: ${relativePathFromRoot} --- */\n\n`;
                    concatenatedContent += content;
                    concatenatedContent += `\n/* --- End of File: ${relativePathFromRoot} --- */\n\n`;
                    processedFiles.push(relativePathFromRoot);
                    // console.log(`Processed file: ${relativePathFromRoot}`); // Optional: for detailed debugging
                } catch (readError) {
                    console.error(`Error reading file ${relativePathFromRoot}: ${readError.message}`);
                    skippedFiles.push(`${relativePathFromRoot} (read error)`);
                }
            }
        }
    }

    // Start processing from the root directory
    console.log(`Starting recursive code extraction from: ${absoluteRootDirectory}`);
    await readDirectory(absoluteRootDirectory);

    try {
        await fs.promises.writeFile(outputFilePath, concatenatedContent, 'utf8');
        console.log(`\nSuccessfully concatenated code into: ${outputFilePath}`);
        console.log(`Total files processed: ${processedFiles.length}`);
        if (processedFiles.length > 0) {
            console.log("Processed files (first 10):");
            processedFiles.slice(0, 10).forEach(file => console.log(`  - ${file}`));
            if (processedFiles.length > 10) console.log(`  ...and ${processedFiles.length - 10} more.`);
        }

        if (skippedFiles.length > 0) {
            console.warn(`\nSkipped ${skippedFiles.length} files:`);
            skippedFiles.forEach(file => console.warn(`  - ${file}`));
        }
        if (skippedDirectories.length > 0) {
            console.warn(`\nSkipped ${skippedDirectories.length} directories:`);
            skippedDirectories.forEach(dir => console.warn(`  - ${dir}/`));
        }
    } catch (writeError) {
        console.error(`Error writing output file: ${writeError.message}`);
    }
}

// --- Configuration ---
// Adjust PROJECT_ROOT if your script is not in the very top-level project directory.
// For example, if script is in 'scripts/concatenate.js' and project root is '../', use path.resolve(__dirname, '../')
const PROJECT_ROOT = __dirname; // Assuming the script is at the project root level (where frontend/ and backend/ reside)
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'concatenated_codebase.txt');

// Define file extensions to include (e.g., for JavaScript, TypeScript, CSS, HTML, JSON)
// If empty, all non-excluded files will be included.
const INCLUDED_EXTENSIONS = [
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', // JavaScript/TypeScript
    '.json', '.css', '.scss', '.less', '.html', '.htm', // Web files
    '.md', '.env', '.env.example', // Documentation, environment examples
    '.sql', '.graphql', '.yml', '.yaml', // Backend/Config files
    '.txt', // Plain text files
    // Add other extensions relevant to your project, e.g., '.py', '.java', '.go'
];

// Directories to exclude (e.g., build artifacts, version control, dependencies)
const EXCLUDED_DIRS = [
    'node_modules',
    '.git',
    '.next',
    'build',
    'dist',
    'coverage',
    'logs',
    '.vscode',
    'temp',
    'tmp',
    '__pycache__', // If you have Python
    'target', // If you have Java/Maven
    'out', // Common for Next.js static exports, or general build outputs
    'public', // Often contains assets that aren't 'code'
];

// Files to exclude (e.g., lock files, hidden files, executables)
const EXCLUDED_FILES = [
    '.DS_Store',
    'Thumbs.db',
    'package-lock.json',
    'yarn.lock',
    'npm-debug.log',
    '.env.local', // Specific environment files if you don't want them in output
    '.env.development',
    '.env.production',
    'README.md', // Usually large, descriptive, not 'code'
    'LICENSE',
    // Add any other specific files you want to ignore
];

// Max file size in KB to include (e.g., 500 KB = 0.5 MB)
const MAX_FILE_SIZE_KB = 500; // Adjust as needed. Large binary files can be skipped.

// --- Run the script ---
concatenateCode(
    PROJECT_ROOT,
    OUTPUT_FILE,
    INCLUDED_EXTENSIONS,
    EXCLUDED_DIRS,
    EXCLUDED_FILES,
    MAX_FILE_SIZE_KB
);