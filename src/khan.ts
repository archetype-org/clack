import net from 'net'
import { Cell, jam, dwim, Noun, enjs } from '@urbit/nockjs'
import { newtDecode, newtEncode } from './bytes'

// returns a js Noun Object with the structure of a %fyrd
function Fyrd(desk: string, thread: string, mark_out: string, mark_in: string, atom: string) {
  return dwim([
    0,
    'fyrd',
    desk,
    thread,
    mark_out,
    mark_in,
    atom
  ]);
}

// returns a js Fyrd, whose trailing atom is
// some hoon code to be run as a thread
function Thread (hoon: string) {
  return Fyrd('base', 'khan-eval', 'noun', 'ted-eval', hoon);
}

interface ThreadResponse {
  mark: string,
  node: {
    [key: string]: {
      mark: string;
      node: Noun;
    }
  }
}

function unwrapUnit(noun: Noun): Noun | null {
  if (noun instanceof Cell && noun.head.equals(dwim(0))) {
    return noun.tail;
  }

  return null;
}

// decodes response and unpacks it to a noun,
// if it has the expected structure of a fyrd response
function parseThreadResponse (data: Buffer): Noun | null {
  const noun = newtDecode(data);
  const unwrapped = unwrapUnit(noun);
  const inner = enjs.pairs([
    { nom: 'mark', get: enjs.cord },
    { nom: 'node', get: (n) => n as any }
  ]);
  const result =
      enjs.pairs([
        { nom: 'mark', get: enjs.cord},
        {
          nom: 'node',
          get: enjs.frond([
            { tag: '\x01', get: inner },
            { tag: '\x00', get: inner },
          ])
        }
      ])(unwrapped) as unknown as ThreadResponse;

  const { mark, node } = result;
  if (mark === 'avow') {
    // %.n in the "each" type
    if ('\x01' in node) {
      const { mark: innerMark, node: innerNode } = node['\x01'];
      if (innerMark === 'thread-fail') {
        return innerNode;
      }
    }

    // %.y in the "each" type
    if ('\x00' in node) {
      const { mark: innerMark, node: innerNode } = node['\x00'];
      if (innerMark === 'noun') {
        return innerNode;
      }
    }
  }

  return null
}

// Send a noun to khan and then parse it's response
async function sendKahn ({ ship, noun, responseParser }: { ship: string, noun: Noun, responseParser: (data: Buffer) => Noun | null }): Promise<Noun> {
  const socketPath = `${ship}/.urb/conn.sock`

  return new Promise((resolve, reject) => {
    let res: Noun;
    const client = net.connect(socketPath, () => {
      console.log(`Connected to urbit ship ${ship} through Conn.c`)
      const encoded = newtEncode(jam(noun));
      client.write(encoded)
    })

    client.on('data', (data) => {
      res = responseParser(data)
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
      reject('cancelled')
      process.exit(0)
    })
  })
}

export {
	Fyrd,
	Thread,
	parseThreadResponse,
	sendKahn,
}