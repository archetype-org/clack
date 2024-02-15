import { Clack } from './index.js'

test('createDesk', async function () {
	const clack = Clack({ ship: '../clack-scratchpad/zod' })
	const noun = await clack.createDesk('%js-created')
  expect(noun).toBe('success');
});

