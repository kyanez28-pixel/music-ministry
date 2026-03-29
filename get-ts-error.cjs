const { execSync } = require('child_process');
try {
  execSync('npx tsc -p tsconfig.app.json --noEmit', { stdio: 'pipe' });
  console.log("No errors");
} catch (e) {
  require('fs').writeFileSync('ts-error-clean.txt', e.stdout.toString() + (e.stderr ? e.stderr.toString() : ''));
}
