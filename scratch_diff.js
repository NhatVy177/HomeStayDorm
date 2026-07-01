const fs = require('fs');
const diff = fs.readFileSync('d:\\NAM3\\HomeStayDorm\\diff.txt', 'utf8');
const lines = diff.split('\n');

let currentOld = '';
let currentNew = '';

for (let line of lines) {
  if (line.startsWith('-') && !line.startsWith('---')) {
    currentOld += line.substring(1) + '\n';
  } else if (line.startsWith('+') && !line.startsWith('+++')) {
    currentNew += line.substring(1) + '\n';
  } else {
    if (currentOld || currentNew) {
      // Compare old and new by ignoring non-ascii characters
      const oldClean = currentOld.replace(/[^\x00-\x7F]/g, '');
      const newClean = currentNew.replace(/[^\x00-\x7F]/g, '');
      if (oldClean !== newClean) {
        console.log('REAL CHANGE FOUND:');
        console.log('--- OLD');
        console.log(currentOld.trim());
        console.log('+++ NEW');
        console.log(currentNew.trim());
      }
      currentOld = '';
      currentNew = '';
    }
  }
}
