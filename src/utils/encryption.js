import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

// Encrypt a message for a recipient
export function encryptMessage(plainText, recipientPublicKeyBase64, senderSecretKeyBase64) {
  try {
    const recipientPublicKey = util.decodeBase64(recipientPublicKeyBase64);
    const senderSecretKey = util.decodeBase64(senderSecretKeyBase64);
    
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const encrypted = nacl.box(
      util.decodeUTF8(plainText),
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
}

// Decrypt a message
export function decryptMessage(nonceBase64, ciphertextBase64, senderPublicKeyBase64, recipientSecretKeyBase64) {
  try {
    const nonce = util.decodeBase64(nonceBase64);
    const ciphertext = util.decodeBase64(ciphertextBase64);
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
}
