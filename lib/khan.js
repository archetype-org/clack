import { Cell, Atom, cue } from '@urbit/nockjs'
import { encodeStringToBytesInt, newtDecodeFromBytes } from './bytes.js'
import { parseNoun, unwrapUnit } from './noun.js'

async function Fyrd(desk, thread, mark_out, mark_in, atom) {
    let pid = await encodeStringToBytesInt('0')
    let fyrd = await encodeStringToBytesInt('fyrd')
    desk = await encodeStringToBytesInt(desk)
    thread = await encodeStringToBytesInt(thread)
    mark_out = await encodeStringToBytesInt(mark_out)
    mark_in = await encodeStringToBytesInt(mark_in)
    atom = await encodeStringToBytesInt(atom)
    return (new Cell(new Atom(BigInt(pid)), new Cell(new Atom(BigInt(fyrd)), new Cell(new Atom(BigInt(desk)), new Cell(new Atom(BigInt(thread)), new Cell(new Atom(BigInt(mark_out)), new Cell(new Atom(BigInt(mark_in)), new Atom(BigInt(atom)))))))))
}

async function Thread (hoon) {
  return await Fyrd('base', 'khan-eval', 'noun', 'ted-eval', hoon)
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

export {
	Fyrd,
	Thread,
	parseThreadResponse,
}