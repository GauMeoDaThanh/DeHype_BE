const { Keypair } = require('@solana/web3.js');

// Example array of private key bytes (must be 64 bytes)
const privateKeyBytes = new Uint8Array([

]
);

function secretKeyToBase64(secretKey) {
  // Convert the Uint8Array to a Buffer
  const buffer = Buffer.from(secretKey);
  // Convert the Buffer to a Base64 string
  return buffer.toString('base64');
}

// Create a Keypair from the private key bytes
const keypair = Keypair.fromSecretKey(privateKeyBytes);

// Log the public key and secret key
console.log('Public Key:', keypair.publicKey.toBase58());
console.log('Secret Key:', keypair.secretKey);
const base64SecretKey = secretKeyToBase64(keypair.secretKey);

console.log('Base64 Encoded Secret Key:', base64SecretKey);