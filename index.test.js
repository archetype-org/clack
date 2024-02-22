import { Clack } from './index.js'

test('createDesk', async function () {
	const clack = Clack({ ship: '../clack-scratchpad/zod' })
	const noun = await clack.createDesk('%js-created')
  expect(noun).toBe('success');
});

test('mountDesk', async function () {
	const clack = Clack({ ship: '../clack-scratchpad/zod' })
	const noun = await clack.mountDesk('%js-created')
  expect(noun).toBe('success');
});

test('commitDesk', async function () {
	const clack = Clack({ ship: '../clack-scratchpad/zod' })
	const noun = await clack.commitDesk('%js-created')
  expect(noun).toBe('success');
});

test('reviveDesk', async function () {
	const clack = Clack({ ship: '../clack-scratchpad/zod' })
	const noun = await clack.reviveDesk('%js-created')
  expect(noun).toBe('success');
  await clack.close()
});

