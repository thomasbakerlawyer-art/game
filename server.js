// Starts a small server on your Mac so the phone games and the consoles can talk.
// Run:  node server.js     (keep all the .html files and this file in the same folder)
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const GAMES = {
  blackjack: ['blackjack.html', 'blackjack-console.html'],
  limbo: ['limbo.html', 'limbo-console.html'],
  plinko: ['plinko.html', 'plinko-console.html'],
  dice: ['dice.html', 'dice-console.html'],
  mines: ['mines-phone.html', 'mines-console.html'],
  coinflip: ['coinflip.html', 'coinflip-console.html']
};
const pages = { '/': GAMES.blackjack[0], '/console': GAMES.blackjack[1] };
Object.keys(GAMES).forEach((g) => {
  pages['/' + g] = GAMES[g][0];
  pages['/' + g + '-console'] = GAMES[g][1];
});

const latest = {};   // game -> { user -> last state (JSON text) }
const clients = {};  // game -> set of open console connections
const users = (g) => latest[g] || (latest[g] = {});
const conns = (g) => clients[g] || (clients[g] = new Set());
const gameOf = (url, prefix) => url.slice(prefix.length).replace(/^\//, '') || 'blackjack';

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (req.method === 'POST' && (url === '/state' || url.startsWith('/state/'))) {
    const game = gameOf(url, '/state');
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 2e6) req.destroy(); });
    req.on('end', () => {
      let user = 'Player';
      try { user = JSON.parse(body).user || 'Player'; } catch (e) {}
      users(game)[user] = body;
      conns(game).forEach((c) => c.write('data: ' + body + '\n\n'));
      res.writeHead(204);
      res.end();
    });
    return;
  }

  if (url === '/events' || url.startsWith('/events/')) {
    const game = gameOf(url, '/events');
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'Connection': 'keep-alive' });
    res.write('retry: 1500\n\n');
    Object.values(users(game)).forEach((b) => res.write('data: ' + b + '\n\n'));
    conns(game).add(res);
    const beat = setInterval(() => res.write(': ping\n\n'), 20000);
    req.on('close', () => { clearInterval(beat); conns(game).delete(res); });
    return;
  }

  const file = pages[url];
  if (file) {
    fs.readFile(path.join(__dirname, file), (err, data) => {
      if (err) { res.writeHead(404); res.end('File not found: ' + file); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(data);
    });
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = [];
  const nets = os.networkInterfaces();
  Object.keys(nets).forEach((n) => nets[n].forEach((a) => { if (a.family === 'IPv4' && !a.internal) ips.push(a.address); }));
  const name = os.hostname().replace(/\.local$/i, '') + '.local';
  const pad = (g) => (g + ':').padEnd(11);
  console.log('');
  console.log('CONSOLES (open these on your Mac):');
  Object.keys(GAMES).forEach((g) => console.log('  ' + pad(g) + 'http://localhost:' + PORT + '/' + g + '-console'));
  console.log('');
  console.log('GAMES (open these on your phone, same Wi-Fi as the Mac):');
  console.log('  By name (use this one):');
  Object.keys(GAMES).forEach((g) => console.log('    ' + pad(g) + 'http://' + name + ':' + PORT + '/' + g));
  console.log('  By number (only if the name does not open):');
  ips.forEach((ip) => Object.keys(GAMES).forEach((g) => console.log('    ' + pad(g) + 'http://' + ip + ':' + PORT + '/' + g)));
  console.log('');
  console.log('Press Ctrl+C to stop.');
});
