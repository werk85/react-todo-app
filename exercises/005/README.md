# Aufgabe 5

Speichere die Todos im LocalStorage mit Hilfe des `localStorage` Moduls von `effe-ts`. Erstelle hierzu ein [io-ts](https://github.com/gcanti/io-ts) Objekt mit dessen hilfe dein `Todo` Objekt kodiert (`encode`) und dekodiert (`decode`) werden kann.

## Beispiel

```ts
import { cmd, localStorage } from 'effe-ts'
import * as t from 'io-ts'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'

// Our model we want to write to our localStorage
const Counter = t.number
type Counter = t.TypeOf<typeof Counter>

const Action =
  | { type: 'Load', payload: E.Either<localStorage.LocalStorageError, O.Option<Counter>> }
  /* ... my other actions */

// The entity object of our Counter object. The first parameter describes the name inside of Local Storage
const entity = localStorage.entity('counter', Counter)

// cmd.Cmd<Action>
const load = localStorage.load(entity, (e): Action => ({ type: 'Load', payload: e }))

// (value: number) => cmd.Cmd<never>
const save = localStorage.save(entity)

// Usage in `init` and `update` Function

const init = [
  {
    ...
  },
  load // Load on startup
]

const update = (action, model): [Model, cmd.Cmd<Action>] => {
  switch (action.type) {
    case 'Load':
      return pipe(
        action.payload,
        E.fold(
          () => [model, cmd.none],
          O.fold(
            () => [model, cmd.none],
            counter => [/* do something with counter in model */, cmd.none]
          )
        )
      )
  }
}
```

Siehe [Referenzdokumentation](https://gcanti.github.io/fp-ts/modules/) für `Option` und `Either`.

# Zusatzaufgabe

Verwende zur Erstellung deiner Actions das [ts-union](https://github.com/twop/ts-union) Modul und ersetze alle `switch/case` Statements durch die `match` Funktion.
