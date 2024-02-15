import { builtins } from 'pythonia'

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

async function newtEncode (jammedNoun) {
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
	encodeStringToBytesInt,
	newtDecodeFromBytes,
	atomToPrimitive,
	newtEncode,
}
