const WebSocket = require('ws');
const http = require('http');
const phoneService = require('../src/services/phoneService');

http.get('http://127.0.0.1:56304/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const list = JSON.parse(data);
    const page = list.find(p => p.url && p.url.includes('web.whatsapp.com'));
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    ws.on('open', () => {
      ws.send(JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: `(async () => {
            const collections = window.require('WAWebCollections');
            const contacts = collections.Contact.getModelsArray();
            const results = [];
            for (const c of contacts) {
              const id = c.id?._serialized;
              const phone = c.phoneNumber ? c.phoneNumber.user : (c.id?.server === 'c.us' ? c.id.user : null);
              const lid = c.lid?._serialized || (c.id?.server === 'lid' ? c.id._serialized : null);
              const name = c.name || c.pushname;
              if (phone) {
                results.push({ id, phone, lid, name });
              }
            }
            return results;
          })()`,
          awaitPromise: true,
          returnByValue: true
        }
      }));
    });
    ws.on('message', (msg) => {
      const results = JSON.parse(msg).result?.result?.value || [];
      console.log(`Found ${results.length} contacts with real phone numbers!`);
      let mapped = 0;
      for (const item of results) {
        if (item.phone && phoneService.isRealPhone(item.phone)) {
          if (item.id) phoneService.setMapping(item.id, item.phone, item.name);
          if (item.lid) phoneService.setMapping(item.lid, item.phone, item.name);
          mapped++;
        }
      }
      console.log(`Mapped ${mapped} contacts into phoneService!`);
      ws.close();
      process.exit(0);
    });
  });
});

