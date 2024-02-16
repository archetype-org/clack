import { builtins } from 'pythonia'
import { Atom } from '@urbit/nockjs'

// to run python functions (for byte handling):
async function pyExec (pythonCode, forceBigInt=false) {
  let val
  const returnToNode = (res) => val = forceBigInt ? BigInt(res) : res
  await builtins.exec(pythonCode, { returnToNode })
  return val
}

// str(js primative) => Atom
async function primitiveToAtom (s) {
  return await pyExec(`returnToNode(str(int.from_bytes('''${s}'''.encode(), 'little')))`, true)
}

// Atom => str(js primative)
async function atomToPrimitive (atom) {
  return await pyExec(`
def byte_len(i):
    lyn = i.bit_length()
    byt = lyn >> 3
    return byt + 1 if lyn & 7 else byt

def intbytes(i):
    return i.to_bytes(byte_len(i), 'little', signed=False)

returnToNode(str(intbytes(${atom.number}).decode()))
`)
}

// Buffer => Atom
async function newtDecode (buffer) {
  const hexByteString = buffer.toString('hex')
  return new Atom(await pyExec(`
byte_string = bytes.fromhex('''${hexByteString}''')
newt_decoded_byte_string = byte_string[5:]
raw_atom = int.from_bytes(newt_decoded_byte_string, 'little')
returnToNode(str(raw_atom))`, true))
}

// Atom => Buffer
async function newtEncode (jammedNoun) {
  if ((typeof jammedNoun) != 'bigint') {
    throw new Error(`${jammedNoun} is not of type BigInt`)
  }
  return Buffer.from(await pyExec(`
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
`), 'hex')
}

export {
	primitiveToAtom,
  atomToPrimitive,
	newtDecode,
	newtEncode,
}
