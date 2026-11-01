const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '../node_modules/simple-zstd/dist/src/index.js');
if (fs.existsSync(target)) {
  let code = fs.readFileSync(target, 'utf8');
  if (code.includes('Can not access zstd! Is it installed?')) {
    code = code.replace(
      'catch {\n    throw new Error(\x27Can not access zstd! Is it installed?\x27);\n}\ntry {\n    node_fs_1.default.accessSync(bin, node_fs_1.default.constants.X_OK);\n}\ncatch {\n    throw new Error(\x27zstd is not executable\x27);\n}',
      'catch {\n    bin = \x27\x27;\n}\nif (bin) {\n  try {\n    node_fs_1.default.accessSync(bin, node_fs_1.default.constants.X_OK);\n  } catch { bin = \x27\x27; }\n}'
    );
    fs.writeFileSync(target, code, 'utf8');
    console.log('[Postinstall] Patched simple-zstd for Windows compatibility.');
  }
}
