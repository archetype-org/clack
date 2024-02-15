import fs from 'fs'
import path from 'path'
import net from 'net'
import { Cell, jam, Atom, cue } from '@urbit/nockjs'
import { python } from 'pythonia'
import { encodeStringToBytesInt, newtDecodeFromBytes, newtEncode } from './lib/bytes.js'
import { parseNoun, unwrapUnit } from './lib/noun.js'
import { Fyrd, Thread, parseThreadResponse } from './lib/khan.js'

async function runThread ({ ship, thread }) {
  const hoon = thread
  const socketPath = `${ship}/.urb/conn.sock`

  return new Promise((resolve, reject) => {
    let res
    const client = net.connect(socketPath, async () => {
      console.log(`Connected to urbit ship ${ship} through Conn.c`)
      const binaryMessage = (await newtEncode(jam(await Thread(hoon))))
      client.write(binaryMessage)
    })

    client.on('data', async (data) => {
      res = await parseThreadResponse(data)
      python.exit()
      client.end()
    })

    client.on('end', () => {
      console.log(`Disconnected from urbit ship ${ship} through Conn.c`)
      resolve(res)
    })
    
    client.on('error', (err) => {
      console.error('Error:', err)
      reject(err)
    })

    // Handle socket cleanup on process exit
    process.on('exit', () => {
      if (client.destroyed === false) {
        client.end()
        reject('exit')
      }
    })

    // Handle socket cleanup on Ctrl+C
    process.on('SIGINT', () => {
      process.exit(0)
      reject('cancelled')
    })
  })
}

function Clack({ ship }) {
  return {
    ship,
    createDesk: async function (deskName) {
      return await runThread({
        ship,
        thread: `
=/  m  (strand ,vase)
;<  [=ship =desk =case]  bind:m  get-beak 
;<  ~  bind:m  
(poke-our %hood %kiln-merge !>([${deskName} ship %base case %auto]))  
(pure:m !>('success'))
`
      })
    },
    runThread: async function (thread) {
      return await runThread ({
        ship,
        thread,
      })
    }
  }
}

export {
  Clack,
  runThread,
  parseNoun,
  Fyrd,
}
