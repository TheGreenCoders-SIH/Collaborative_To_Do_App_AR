const nacl = require('tweetnacl');
const util = require('tweetnacl-util');

// Generate a key pair for a user (do this once during user creation)
const generateKeyPair = () => {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: util.encodeBase64(keyPair.publicKey),
    secretKey: util.encodeBase64(keyPair.secretKey),
  };
};

// Encrypt a message for a recipient
const encryptMessage = (plain_text, recipientPublicKeyBase64, senderSecretKeyBase64) => {
  try {
    const recipientPublicKey = util.decodeBase64(recipientPublicKeyBase64);
    const senderSecretKey = util.decodeBase64(senderSecretKeyBase64);
    
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const encrypted = nacl.box(
      util.decodeUTF8(plain_text),
      nonce,
      recipientPublicKey,
      senderSecretKey
    );
    
    return {
      nonce: util.encodeBase64(nonce),
      ciphertext: util.encodeBase64(encrypted),
    };
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt message');
  }
};

// Decrypt a message
const decryptMessage = (nonce_base64, ciphertext_base64, senderPublicKeyBase64, recipientSecretKeyBase64) => {
  try {
    const nonce = util.decodeBase64(nonce_base64);
    const ciphertext = util.decodeBase64(ciphertext_base64);
    const senderPublicKey = util.decodeBase64(senderPublicKeyBase64);
    const recipientSecretKey = util.decodeBase64(recipientSecretKeyBase64);
    
    const decrypted = nacl.box.open(
      ciphertext,
      nonce,
      senderPublicKey,
      recipientSecretKey
    );
    
    if (!decrypted) {
      throw new Error('Decryption failed');
    }
    
    return util.encodeUTF8(decrypted);
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt message');
  }
};

module.exports = {
  generateKeyPair,
  encryptMessage,
  decryptMessage,
};
