const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const keyPath = path.join(__dirname, '../keys');

if (!fs.existsSync(keyPath)) {
  fs.mkdirSync(keyPath);
}

// Generate RSA keys if they don't exist
if (!fs.existsSync(path.join(keyPath, 'rsa_priv.pem'))){
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  fs.writeFileSync(path.join(keyPath, 'rsa_priv.pem'), privateKey);
  fs.writeFileSync(path.join(keyPath, 'rsa_pub.pem'), publicKey);
}

const getPrivateKey = () => {
  return fs.readFileSync(path.join(keyPath, 'rsa_priv.pem'), 'utf8');
};

const getPublicKey = () => {
  return fs.readFileSync(path.join(keyPath, 'rsa_pub.pem'), 'utf8');
};

module.exports = {
  getPrivateKey,
  getPublicKey
};