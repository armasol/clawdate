const nacl = require('tweetnacl');
const naclUtil = require('tweetnacl-util');

/**
 * Generate a new ed25519 keypair for an agent
 */
function generateKeypair() {
  const keypair = nacl.sign.keyPair();
  return {
    publicKey: naclUtil.encodeBase64(keypair.publicKey),
    secretKey: naclUtil.encodeBase64(keypair.secretKey),
  };
}

/**
 * Sign a message with ed25519 private key
 */
function signMessage(message, secretKeyBase64) {
  const secretKey = naclUtil.decodeBase64(secretKeyBase64);
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, secretKey);
  return naclUtil.encodeBase64(signature);
}

/**
 * Verify a signature with ed25519 public key
 */
function verifySignature(message, signatureBase64, publicKeyBase64) {
  try {
    const publicKey = naclUtil.decodeBase64(publicKeyBase64);
    const signature = naclUtil.decodeBase64(signatureBase64);
    const messageBytes = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(messageBytes, signature, publicKey);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Generate a random challenge for authentication
 */
function generateChallenge() {
  const challengeBytes = nacl.randomBytes(32);
  return naclUtil.encodeBase64(challengeBytes);
}

/**
 * Create a handshake payload
 */
function createHandshakePayload(from, capabilities, objective, timestamp, secretKey) {
  const payload = JSON.stringify({
    from,
    capabilities,
    objective,
    timestamp,
  });
  const signature = signMessage(payload, secretKey);
  return {
    from,
    capabilities,
    objective,
    timestamp,
    signature,
  };
}

module.exports = {
  generateKeypair,
  signMessage,
  verifySignature,
  generateChallenge,
  createHandshakePayload,
};
