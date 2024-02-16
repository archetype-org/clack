import { atomToPrimitive } from './bytes.js'

// Noun => tree 
// returns a tree built of 2-n js arrays, 
// where the leaves are all strings 
// that can be cast to a primitive
async function nounToTree (noun) {
  const isCell = (node) => 
    typeof node == 'object' &&
    node.constructor.name == 'Cell'
  const nounToTuples = async (node) => {
    // For each node:
    return [
      // 1. crawl head
      isCell(node.head) ? 
        await nounToTuples(node.head) :
        await atomToPrimitive(node.head),
      // 2. crawl tail
      isCell(node.tail) ? 
        await nounToTuples(node.tail) :
        await atomToPrimitive(node.tail)
    ]
  }
  return await nounToTuples(noun)
}

// handles truthy '0' from urbit Units
function unwrapUnit (noun) {
  if (noun[0] == '0' || !noun[0]) {
    return noun[1]
  } else {
    return null
  }
}

export {
	nounToTree,
	unwrapUnit,
}