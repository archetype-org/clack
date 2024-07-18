import { Atom, bigintToDataView, cue_bytes, Noun } from '@urbit/nockjs'

// Buffer => Noun
function newtDecode (buffer: Buffer): Noun {
  const trimmed = buffer.subarray(5);
  const uint8arr = new Uint8Array(trimmed.byteLength);
  trimmed.copy(uint8arr, 0, 0, trimmed.byteLength);

  return cue_bytes(new DataView(uint8arr.buffer));
}

// Noun (Atom) => Buffer
function newtEncode (jammedNoun: Atom): Buffer {
  if (!(jammedNoun instanceof Atom)) {
    throw new Error(`${jammedNoun} is not a Noun`)
  }

  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(jammedNoun.bytes().length);
  return Buffer.concat([
    Buffer.from([0x0]),
    lengthBuffer,
    Buffer.from(bigintToDataView(jammedNoun.number).buffer)
  ])
}

export {
	newtDecode,
	newtEncode,
}
