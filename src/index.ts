import { dwim } from '@urbit/nockjs';
import { newtEncode, newtDecode } from './bytes'
import { Fyrd, Thread, parseThreadResponse, sendKahn } from './khan'

interface ClackParams {
  ship: string;
}

function Clack({ ship }: ClackParams) {
  return {
    ship,
    createDesk: async function (deskName: string) {
      return sendKahn({
        ship,
        noun: Thread(`
=/  m  (strand ,vase)
;<  [=ship =desk =case]  bind:m  get-beak
;<  ~  bind:m
(poke-our %hood %kiln-merge !>([${deskName} ship %base case %auto]))
(pure:m !>('success'))
`),
        responseParser: parseThreadResponse
      })
    },
    mountDesk: async function (deskName: string) {
      return sendKahn({
        ship,
        noun: Thread(`
=/  m  (strand ,vase)
;<  [=ship =desk =case]  bind:m  get-beak
;<  ~  bind:m
=/  pax=path  (en-beam [ship ${deskName} case] /)
(poke-our %hood %kiln-mount !>([pax ${deskName}]))
(pure:m !>('success'))
`),
        responseParser: parseThreadResponse
      })
    },
    commitDesk: async function (deskName: string) {
      return sendKahn({
        ship,
        noun: Thread(`
=/  m  (strand ,vase)
;<  [=ship =desk =case]  bind:m  get-beak
;<  ~  bind:m
(poke-our %hood %kiln-commit !>([${deskName} |]))
(pure:m !>('success'))
`),
        responseParser: parseThreadResponse
      })
    },
    reviveDesk: async function (deskName: string) {
      return sendKahn({
        ship,
        noun: Thread(`
=/  m  (strand ,vase)
;<  [=ship =desk =case]  bind:m  get-beak
;<  ~  bind:m
(poke-our %hood %kiln-revive !>(${deskName}))
(pure:m !>('success'))
`),
        responseParser: parseThreadResponse
      })
    },
    runThread: async function (thread: string, responseParser=parseThreadResponse) {
      return await sendKahn({
        ship,
        noun: dwim(thread),
        responseParser,
      })
    },
    close: async function() {
    }
  }
}

export {
  Clack,
  newtDecode,
  newtEncode,
  Fyrd,
  Thread,
  parseThreadResponse,
  sendKahn,
}
