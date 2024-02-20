# %clack

a nodejs library for sending IPC commands to an Urbit ship over Conn.c

## Installation

To start using %clack in your node project install with npm:

```bash
npm install --save @archetype-org/clack
```

## Basic Usage

Basic usage has the following pattern.

```js
import { Clack } from '@archetype-org/clack'

const clack = Clack({ ship: './path/to/your/zod' })
const noun = await clack.createDesk('%js-created')
```

In this example, the top level `Clack` object is imported from the package, and then initialized with the path to the ship you want to connect to through `conn.c`/`kahn`. Once it is setup, you can use the Clack object's methods, such as `clack.createDesk()` to script the behavior of your ship


## Advanced Usage

If you know hoon, you can also directly send threads or any other `%fyrd` message to the ship using long form templatestrings for your hoon code. We expose the `sendKahn()` Function to allow this:

```js
import { sendKahn, Thread, parseThreadResponse } from '@archetype-org/clack'

sendKahn({
	ship: './path/to/your/zod',
	hoon:  Thread(`
=/  m  (strand ,vase)
;<  ~  bind:m
~&  (add 40 2)
(poke [~zod %hood] %helm-hi !>(\'\'))
(pure:m !>([%res 'success']))
`),
	responseParser: parseThreadResponse,
})
```

## Reference

Below You can find the full API reference for the methods and functions exported by the library. In addition to the top level `clack` object, we also expose some internal methods useful for advanced users sending custom messages through `conn.c`. These generally fall into two categories: encoding functions for doing bitwise operations to nouns an atoms (i.e. newt-encoding) and Khan specific types that provide more syntactic sugar for formatting nouns than using nockjs directly. 

### Clack Methods

#### Clack() Constructor

* *Clack ( payload = { ship }) => clack: Clack*

Takes a payload object that specifies a ship, and returns a `Clack` instance that controls that ship. Implemented as a closure, does not require the `new` keyword to create.

* **payload.ship** — string, path to the urbit pier you want to control
	* EX: *'./my-folder/zod'* 
* returns — **Clack** obj

#### clack.createDesk()

* *clack.createDesk(deskName: string)*

Takes a deskname and creates/mounts it in the controlled desk

* **deskName** — string, name of the desk you want to create. Must be a valid desk name (starts with `%` etc.)
* returns — **Promise<ThreadResponse>**, a parsed thread response, whose tail is the noun returned by the thread

### Reference — Encoding Functions

Encoding functions: converting between hoon Atoms and JS primitives, and newt encoding/decoding.

*Dev Note: parts of these use python subprocesses to do byte manipulation because it is more strightforward than using Buffers for everything; there should be no system dependancies aside from a working python 2 or 3 installation*

#### primitiveToAtom()

* *primitiveToAtom(primitive: string) => atom: BigInt*

Takes a string that casts to a JS primitive and transforms it into a nock atom; uses BigInt to represent the atom.

* **primitive** — string, must cast to a JS primitive or it will be interpreted as a string
	* EX: *'420'* => Number/@ud
	* EX: *'True'* => Boolean/loobean
	* EX: *'foo'* => String/cord
	* EX: *'foo'* => %foo/@tas
* returns — **atom**, BigInt, the integer representing the nock atom

#### atomToPrimitive()

* *atomToPrimitive(atom: Atom) => primitive: string*

Takes a nockJS atom object and decodes the `atom.number` property to a string which can be parsed to a JS primitive

* **atom** — (atom : Atom), the nockjs Atom type
* returns — **primitive**, string, can be cast to a JS primitive
	* EX: *'420'* => Number/@ud
	* EX: *'True'* => Boolean/loobean
	* EX: *'foo'* => String
	* EX: *'foo'* => %foo/@tas
		* *Note: yes, this means that if you send `%foo` as part of the return atom, it will come over as `'foo'` Not `'%foo'` on the JS side*

#### newtDecode()

* *newtDecode(buffer: Buffer) => atom: Atom* 

Takes a Buffer (received through Conn.c) and decodes it into a nockjs `Atom` object.

* **buffer** — buffer to decode
* returns — **atom**, a nockjs atom object, the `atom.number property` will still be a jammed noun, which will need to be `cue`d for further decoding of it's children.

#### newtEncode()

* *newtEncode(atom: Atom) => buffer: Buffer*

Takes a nockjs Atom object (ideally a jammed noun) and encodes it with newt encoding for sending over the wire.

* **atom** — a nockjs atom, should be a jammed noun, if you want to send one atom, just `jam` it anyways
* returns — **buffer**, a buffer of a newt-encoded jammed noun, that can be sent to `conn.c` or `%lick`

### Reference — Khan Functions

#### Fyrd()

* *Fyrd(desk: string, thread: string, mark_out: string, mark_in: string, atom: string) => Fyrd*

JS constructor for structuring a `%fyrd` in nockjs `Cell`s. 

* **desk** — name of the desk that contains the thread
* **thread** — thread to run (must be in `desk`)
	* EX: `'khan-eval'` (NOT: `'%khan-eval'`)
	* EX: `'work'` (NOT: `'%work'` or `-work`)
* **mark_out** — string `@tas` determining the output type, must have a valid `mark` in the desk to run
	* EX: `'noun'` (NOT: `'%noun'`)
	* EX: `'text'` (NOT: `'%text'`)
* **mark_in** — string `@tas` determining the input type, must have a valid `mark` in the desk to run
	* EX: `'ted-eval'` (NOT: `'%ted-eval'`)
	* EX: `'noun'` (NOT: `'%noun'`)
* **atom** — the atom to send, can be a jammed noun or hoon code (as is the case with a custom `thread`)
* returns — **fyrd**,a `Fyrd` composed of Nockjs `Cell`s

#### Thread()

* *Thread(hoon: string) => Fyrd*

JS constructor for structuring a `%fyrd` for running custom threads. wraps nockjs nouns.

* **hoon** — string, hoon code, a custom thread you want to run on the controlled ship
* returns — **fyrd**, a `Fyrd` composed of Nockjs `Cell`s

#### parseThreadResponse()

* *parseThreadResponse(data: Buffer) => noun: Cell*

Decodes a buffer of data received from `conn.c` and parses the response. Assumes that the data is structured as the result of a `%fyrd` (e.g. begins with `%avow` and `%noun`). Returns `null` if it can't be parsed as a `%fyrd` response.

* **data** — Buffer, data to be decoded as a `%fyrd response`
* returns — **noun**, a nockjs `Cell` containing the return value of the thread with `%avow` and `%noun` stripped away from the head

#### sendKahn()

* *sendKahn ({ ship, noun, responseParser }) => noun; Cell*

Takes a payload with the ship to control, the noun to send, and the parser for getting the result, and then sends them to khan. Returns the parsed result.

* **ship** — string, path to the urbit pier you want to control
	* EX: *'./my-folder/zod'* 
* **noun** — nockjs noun to send to khan
	* can be `Fyrd`, `Thread` or something custom
* **responseParser** — Function, a response parser for parsing the expected return value of the noun you sent
	* EX: *parseThreadResponse*
* returns — **noun**, Cell, the nockjs Cell of the parsed return value from the message you sent to `conn.c`

## Contributing & Tests

if you are developing or extending %clack you probably want to pull it from git instead of npm/yarn. It can be cloned from here:

```bash
git clone https://github.com/archetype-org/clack.git
cd ./clack
```

Once you are in the project, the tests can be run with:

```bash
npm test
```

clack uses jest, which will scan your project for files that fit the pattern `\*.test.js` and will run any `test()` functions defined in those files. You can add to the test suite in that file, or create additional ones as needed. 

If you want to fix bugs or add features please submit a PR with the github issue, if it exists.  included in the branch name. 