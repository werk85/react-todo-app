# Aufgabe 6

Füge eine `x` am Ende des Todos Eintrages hinzu um ein Element zu löschen.

Füge einen `Loading` State hinzu solange die Daten aus dem LocalStorage geladen werden. Lege hierzu eine `LoadingTodos` Komponente an, die solange angezeigt wird bis die `Load` Action ausgeführt wurden.

## Functional Optics

Um leichter Daten in unserem `Model` zu Manipulieren soll die Datenmanipulation jetzt mit Functional Optics passiert. Wir verwenden in diesem Fall als Library [monocle-ts](https://github.com/gcanti/monocle-ts).

Die wichtigen Lenses im Überblick:

### Lens

Erlaubt den Zugriff auf ein Attribut innerhalb eines Records

```ts
import { Lens } from 'monocle-ts'

interface Model {
  input: string
}

const model: Model = {
  input: 'Hallo Welt'
}

const inputLens = Lens.fromProp<Model>()('todos')

inputLens.get(model) // Gibt 'Hallo Welt' zurück
inputLens.set('Test')(model) // Setzt das `input` Attribut auf 'Test'
```

### Prism

```ts
import { Prism } from 'monocle-ts'

interface Model {
  input: Option<string>
}
const model = {
  input: O.some('Hallo Welt')
}

const inputOptional = inputLens.composePrism(Prism.some())

inputOptional.getOption(model) // Gibt O.some('Hallo Welt') zurück
inputOptional.setOption('Test')(model) // Setzt input auf O.some('Test')
```

Lenses erstellen keine Datenstruktur sondern dienen nur auf diese zuzugreifen bzw. sie zu aktualisieren.

```ts
const model = {
  input: O.none
}

inputOptional.setOption('Test')(model) // Tut nichts
inputLens.set(O.some('Test'))(model) // Funktioniert!
```

### At

```ts
import { atRecord } from 'monocle-ts/lib/At/Record'
import { Lens } from 'monocle-ts'

interface Todo {
  text: string
}

interface Model {
  todos: Record<string, Todo>
}

const model = {
  todos: {
    'abc': {
      text: 'Hallo Welt'
    }
  }
}

const textOptional = (key: string) =>
  Lens
    .fromProp<Model>()('todos')
    .composeLens(atRecord<Todo>().at(key))
    .composeLens(Lens.fromProp<Todo>()('text'))

textOptional('abc').get(model) // 'Hallo Welt'
textOptional('abc').set('Test')(model) // { todos: { 'abc': { text: 'Test' } } }
```

Sollte der Eintrag nicht vorher existieren so wird kein neuer Eintrag in dem `Record` vorgenommen.