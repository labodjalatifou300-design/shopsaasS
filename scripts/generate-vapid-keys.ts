import { exportApplicationServerKey, exportVapidKeys, generateVapidKeys } from 'jsr:@negrel/webpush@0.5.0'

const keys = await generateVapidKeys({ extractable: true })
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${await exportApplicationServerKey(keys)}`)
console.log(`VAPID_KEYS_JSON=${JSON.stringify(await exportVapidKeys(keys))}`)
