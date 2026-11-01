const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../node_modules/whatsapp-web.js/src/util/Injected/Utils.js');
if (fs.existsSync(target)) {
  let code = fs.readFileSync(target, 'utf8');
  if (!code.includes('delete message.__x_id;') && code.includes('const message = {')) {
    code = code.replace(
      '...extraOptions,\n        };',
      '...extraOptions,\n        };\n\n        // Fix: Ensure message.id is always newMsgKey and not corrupted by mediaOptions.toJSON()\n        message.id = newMsgKey;\n        delete message.__x_id;'
    );
    fs.writeFileSync(target, code, 'utf8');
    console.log('[Postinstall] Patched whatsapp-web.js media message id memoize bug.');
  }
}

