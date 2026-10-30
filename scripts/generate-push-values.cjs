const { generateKeyPairSync, randomBytes } = require('node:crypto')
const { writeFileSync } = require('node:fs')
const { join } = require('node:path')

try {
  const { publicKey, privateKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  })
  const publicJwk = publicKey.export({ format: 'jwk' })
  const privateJwk = privateKey.export({ format: 'jwk' })
  const rawPublicKey = Buffer.concat([
    Buffer.from([0x04]),
    Buffer.from(publicJwk.x, 'base64url'),
    Buffer.from(publicJwk.y, 'base64url'),
  ]).toString('base64url')

  const values = [
    '# Keep this private. Do not send this file or commit it to GitHub.',
    `NEXT_PUBLIC_VAPID_PUBLIC_KEY=${rawPublicKey}`,
    `PUSH_HOOK_SECRET=${randomBytes(32).toString('hex')}`,
    `VAPID_KEYS_JSON=${JSON.stringify({ publicKey: publicJwk, privateKey: privateJwk })}`,
    'VAPID_SUBJECT=mailto:YOUR-EMAIL@example.com',
    '',
  ].join('\r\n')

  writeFileSync(join(process.cwd(), 'PUSH-VALUES.txt'), values, {
    encoding: 'utf8',
    mode: 0o600,
    flag: 'wx',
  })
  console.log('OK: PUSH-VALUES.txt created in the project folder.')
  console.log('Open that file. Change YOUR-EMAIL@example.com to your email.')
  console.log('Keep the file private. It will be ignored by Git.')
} catch (error) {
  if (error.code === 'EEXIST') {
    console.error('PUSH-VALUES.txt already exists. Keep it; do not generate new keys.')
  } else {
    console.error('Could not create push keys:', error.message)
  }
  process.exitCode = 1
}
