import 'dart:convert';
import 'package:pinenacl/x25519.dart';

class NaClService {
  // Encrypt a plaintext message for a recipient using Curve25519 + XSalsa20 + Poly1305
  static Map<String, String> encrypt(String plainText, String recipientPublicKeyBase64, String senderSecretKeyBase64) {
    try {
      final recipientPublicKeyBytes = base64.decode(recipientPublicKeyBase64.trim());
      final senderSecretKeyBytes = base64.decode(senderSecretKeyBase64.trim());

      final publicKey = PublicKey(recipientPublicKeyBytes);
      final privateKey = PrivateKey(senderSecretKeyBytes);

      // Create Box with other's public key and current user's secret key
      final box = Box(myPrivateKey: privateKey, theirPublicKey: publicKey);

      final messageBytes = utf8.encode(plainText);
      final encrypted = box.encrypt(messageBytes);

      return {
        'nonce': base64.encode(encrypted.nonce),
        'ciphertext': base64.encode(encrypted.cipherText),
      };
    } catch (e) {
      print('NaCl Encryption error: $e');
      return {
        'nonce': '',
        'ciphertext': plainText, // Fallback to plaintext if encryption fails
      };
    }
  }

  // Decrypt an E2EE message using Curve25519 + XSalsa20 + Poly1305
  static String decrypt(String nonceBase64, String ciphertextBase64, String senderPublicKeyBase64, String recipientSecretKeyBase64) {
    if (nonceBase64.isEmpty || ciphertextBase64.isEmpty || senderPublicKeyBase64.isEmpty || recipientSecretKeyBase64.isEmpty) {
      return ciphertextBase64; // Return plaintext if components are missing
    }
    try {
      final nonceBytes = base64.decode(nonceBase64.trim());
      final ciphertextBytes = base64.decode(ciphertextBase64.trim());
      final senderPublicKeyBytes = base64.decode(senderPublicKeyBase64.trim());
      final recipientSecretKeyBytes = base64.decode(recipientSecretKeyBase64.trim());

      final publicKey = PublicKey(senderPublicKeyBytes);
      final privateKey = PrivateKey(recipientSecretKeyBytes);

      final box = Box(myPrivateKey: privateKey, theirPublicKey: publicKey);

      final encryptedMessage = EncryptedMessage(
        nonce: nonceBytes,
        cipherText: ciphertextBytes,
      );

      final decryptedBytes = box.decrypt(encryptedMessage);
      return utf8.decode(decryptedBytes);
    } catch (e) {
      print('NaCl Decryption error: $e');
      return '[Decryption Failed]';
    }
  }
}
