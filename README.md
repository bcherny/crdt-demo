# WOOT-style CRDT implementation

> See https://arxiv.org/pdf/1810.02137.pdf

eg. for document "abe":

1. Load document
2. Initialize Internal State:

```ts
let internalState = [
  {type: 'START_MARKER'}, // @s
  {
    type: 'CHAR',
    idb: 'h7236ge',       // identifier for this object
    ida: null,            // identifier for object to the left
    ide: '72gd73g',       // identifier for object to the right
    value: 'a',
    v: true               // bool indicating this object is visible (as opposed to "iv" -- invisible)
  },
  {
    type: 'CHAR',
    idb: '72gd73g',       // identifier for this object
    ida: 'h7236ge',       // identifier for object to the left
    ide: '72gd73g',       // identifier for object to the right
    value: 'b',
    v: true               // bool indicating this object is visible (as opposed to "iv" -- invisible)
  },
  {
    type: 'CHAR',
    idb: 'u3h3uh3',       // identifier for this object
    ida: '72gd73g',       // identifier for object to the left
    ide: null,            // identifier for object to the right
    value: 'e',
    v: true               // bool indicating this object is visible (as opposed to "iv" -- invisible)
  },
  {type: 'END_MARKER'}    // @e
]
```
