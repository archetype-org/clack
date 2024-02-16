import fs from 'fs'
import path from 'path'
import net from 'net'
import { Cell, jam, Atom, cue } from '@urbit/nockjs'

import { newtEncode, newtDecode, primitiveToAtom, atomToPrimitive } from './lib/bytes.js'
import { nounToTree, unwrapUnit } from './lib/noun.js'
import { Fyrd, Thread, parseThreadResponse, sendKahn } from './lib/khan.js'

function Clack({ ship }) {
  return {
    ship,
    createDesk: async function (deskName) {
      return await sendKahn({
        ship,
        noun: await Thread(`
=/  m  (strand ,vase)
;<  [=ship =desk =case]  bind:m  get-beak 
;<  ~  bind:m  
(poke-our %hood %kiln-merge !>([${deskName} ship %base case %auto]))  
(pure:m !>('success'))
`),
        responseParser: parseThreadResponse
      })
    },
    runThread: async function (thread, responseParser=parseThreadResponse) {
      return await sendKahn({
        ship,
        noun: thread,
        responseParser,
      })
    }
  }
}

export {
  Clack,
  primitiveToAtom,
  atomToPrimitive,
  newtDecode,
  newtEncode,
  nounToTree,
  Fyrd,
  Thread,
  parseThreadResponse,
  sendKahn,
}
