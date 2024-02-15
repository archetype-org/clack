import fs from 'fs'
import path from 'path'
import net from 'net'
import { Cell, jam, Atom, cue } from '@urbit/nockjs'
import { py, python, builtins } from 'pythonia'

// Python functions (for byte handling):

async function pyExec (pythonCode, forceBigInt=false) {
  let val
  const returnToNode = (res) => val = forceBigInt ? BigInt(res) : res
  await builtins.exec(pythonCode, { returnToNode })
  return val
}

async function encodeStringToBytesInt (s) {
  return await pyExec(`returnToNode(str(int.from_bytes('''${s}'''.encode(), 'little')))`, true)
}

async function newtDecodeFromBytes (s) {
  return await pyExec(`returnToNode(str(int.from_bytes(bytes.fromhex(\'${s}\')[5:], 'little')))`, true)
}

async function atomToPrimitive (s) {
  return await pyExec(`
def byte_len(i):
    lyn = i.bit_length()
    byt = lyn >> 3
    return byt + 1 if lyn & 7 else byt

def intbytes(i):
    return i.to_bytes(byte_len(i), 'little', signed=False)

returnToNode(str(intbytes(${s}).decode()))
`)
}

async function newt_encode (jammedNoun) {
  return await pyExec(`
def byte_len(i: int):
    lyn = i.bit_length()
    byt = lyn >> 3
    return byt + 1 if lyn & 7 else byt

def newt_encode(jammed_noun):
    version = (0).to_bytes(1, 'little')
    jammed_noun = jammed_noun.to_bytes(byte_len(jammed_noun), 'little', signed=False)
    length = len(jammed_noun).to_bytes(4, 'little')
    return version+length+jammed_noun

returnToNode(str(newt_encode(${jammedNoun}).hex()))
`)
}

// JS Functions

async function jam_fyrd(desk, thread, mark_out, mark_in, atom) {
    let pid = await encodeStringToBytesInt('0')
    let fyrd = await encodeStringToBytesInt('fyrd')
    desk = await encodeStringToBytesInt(desk)
    thread = await encodeStringToBytesInt(thread)
    mark_out = await encodeStringToBytesInt(mark_out)
    mark_in = await encodeStringToBytesInt(mark_in)
    atom = await encodeStringToBytesInt(atom)
    return jam(new Cell(new Atom(BigInt(pid)), new Cell(new Atom(BigInt(fyrd)), new Cell(new Atom(BigInt(desk)), new Cell(new Atom(BigInt(thread)), new Cell(new Atom(BigInt(mark_out)), new Cell(new Atom(BigInt(mark_in)), new Atom(BigInt(atom)))))))))
}

async function parseNoun (cued_noun) {
  const isCell = (item) => 
    typeof item == 'object' &&
    item.constructor.name == 'Cell'
  const nounToTuples = async (node) => {
    // For each node:
    return [
      // 1. crawl head
      isCell(node.head) ? 
        await nounToTuples(node.head) :
        await atomToPrimitive(node.head.number),
      // 2. crawl tail
      isCell(node.tail) ? 
        await nounToTuples(node.tail) :
        await atomToPrimitive(node.tail.number)
    ]
  }
  return await nounToTuples(cued_noun)
}

function unwrapUnit (noun) {
  if (noun[0] == '0' || !noun[0]) {
    return noun[1]
  } else {
    return null
  }
}

async function runThread ({ ship, thread }) {
  const socketPath = `${ship}/.urb/conn.sock`

  async function sendThread (hoon) {
    const msg = (await newt_encode(await jam_fyrd('base', 'khan-eval', 'noun', 'ted-eval', hoon)))
    return Buffer.from(msg, 'hex')
  }

  async function parseThreadResponse (data) {
    const byteString = await newtDecodeFromBytes(data.toString('hex'))
    const cued_noun = cue(new Atom(byteString))
    const parsedNoun = await parseNoun(cued_noun)
    let [mark, noun] = unwrapUnit(parsedNoun)
    if (mark == 'avow') {
      [mark, noun] = unwrapUnit(noun)
      if (mark == 'noun') {
        return noun
      }
    }
    return null
  }

  return new Promise((resolve, reject) => {
    let res
    const client = net.connect(socketPath, async () => {
      console.log(`Connected to urbit ship ${ship} through Conn.c`)
      const binaryMessage = await sendThread (thread)
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
  jam_fyrd,
}
