const fs = require('fs');
let content = fs.readFileSync('index.tsx', 'utf8');

const regex = /window\.fetch = async \(input, init = \{\}\) => \{([\s\S]*?)\};\n/m;
const newCode = `Object.defineProperty(window, 'fetch', {
  configurable: true,
  writable: true,
  enumerable: true,
  value: async (input, init = {}) => {
$1
  }
});
`;

content = content.replace(regex, newCode);
fs.writeFileSync('index.tsx', content);
