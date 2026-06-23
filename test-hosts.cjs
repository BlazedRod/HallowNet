const https = require('https');
let count = 0;
https.get('https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const lines = data.split('\n');
    const domains = new Set();
    lines.forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const parts = line.split(/\s+/);
      if (parts.length >= 2 && (parts[0] === '0.0.0.0' || parts[0] === '127.0.0.1')) {
        if (parts[1] !== '0.0.0.0' && parts[1] !== 'localhost' && parts[1] !== 'broadcasthost') {
          domains.add(parts[1]);
        }
      }
    });
    console.log('Successfully parsed ' + domains.size + ' unique domains.');
  });
});
