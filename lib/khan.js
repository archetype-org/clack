import net from 'net'
import { Cell, Atom, cue, jam } from '@urbit/nockjs'
import { python } from 'pythonia'

import { primitiveToAtom, newtDecode } from './bytes.js'
import { nounToTree, unwrapUnit } from './noun.js'
import { newtEncode } from './bytes.js'

// returns a js Noun Object with the structure of a %fyrd
async function Fyrd(desk, thread, mark_out, mark_in, atom) {
    let pid = await primitiveToAtom('0')
    let fyrd = await primitiveToAtom('fyrd')
    desk = await primitiveToAtom(desk)
    thread = await primitiveToAtom(thread)
    mark_out = await primitiveToAtom(mark_out)
    mark_in = await primitiveToAtom(mark_in)
    atom = await primitiveToAtom(atom)
    return (new Cell(new Atom(BigInt(pid)), new Cell(new Atom(BigInt(fyrd)), new Cell(new Atom(BigInt(desk)), new Cell(new Atom(BigInt(thread)), new Cell(new Atom(BigInt(mark_out)), new Cell(new Atom(BigInt(mark_in)), new Atom(BigInt(atom)))))))))
}

// returns a js Fyrd, whose trailing atom is
// some hoon code to be run as a thread
async function Thread (hoon) {
  return await Fyrd('base', 'khan-eval', 'noun', 'ted-eval', hoon)
}

// decodes response and unpacks it to a noun, 
// if it has the expected structure of a fyrd response
async function parseThreadResponse (data) {
  const atom = await newtDecode(data)
  const noun = cue(atom)
  const tree = await nounToTree(noun)
  let [mark, node] = unwrapUnit(tree)
  if (mark == 'avow') {
    [mark, node] = unwrapUnit(node)
    if (mark == 'noun') {
      return node
    }
  }
  return null
}

// Send a noun to khan and then parse it's response
async function sendKahn ({ ship, noun, responseParser }) {
  const socketPath = `${ship}/.urb/conn.sock`

  return new Promise((resolve, reject) => {
    let res
    const client = net.connect(socketPath, async () => {
      console.log(`Connected to urbit ship ${ship} through Conn.c`)
      client.write(await newtEncode(jam(noun).number))
    })

    client.on('data', async (data) => {
      res = await responseParser(data)
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
      python.exit()
      process.exit(0)
      reject('cancelled')
    })
  })
}

export {
	Fyrd,
	Thread,
	parseThreadResponse,
	sendKahn,
}