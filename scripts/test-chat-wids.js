const WebSocket = require('ws');
const http = require('http');

http.get('http://127.0.0.1:56304/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const list = JSON.parse(data);
    const page = list.find(p => p.url && p.url.includes('web.whatsapp.com'));
    if (!page) { console.log('No WhatsApp page'); return; }
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(() => {
            const widFactory = window.require('WAWebWidFactory');
            const collections = window.require('WAWebCollections');
            const pnWid = widFactory.createWid('6282333893488@c.us');
            const lidWid = widFactory.createWid('92011503861900@lid');
            return {
              chatByPn: !!collections.Chat.get(pnWid),
              chatByLid: !!collections.Chat.get(lidWid)
            };
          })()`,
          returnByValue: true
        }
      }));
    });
    ws.on('message', (msg) => {
      console.log('Result:', JSON.parse(msg).result?.result?.value);
      ws.close();
      process.exit(0);
    });
  });
});

