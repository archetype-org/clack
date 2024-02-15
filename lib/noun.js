import { atomToPrimitive } from './bytes.js'

async function parseNoun (noun) {
  const isCell = (node) => 
    typeof node == 'object' &&
    node.constructor.name == 'Cell'
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
  return await nounToTuples(noun)
}

function unwrapUnit (noun) {
  if (noun[0] == '0' || !noun[0]) {
    return noun[1]
  } else {
    return null
  }
}

export {
	parseNoun,
	unwrapUnit,
}