# Aufgabe 1

## Setup

```
yarn
yarn start
```

Öffne einen Browser mit der URL [http://localhost:8080](http://localhost:8080)

## Einführung

Im folgenden Literatur um die bevorstehenden Aufgaben zu lösen. Es wurde bereits eine Vorauswahl der Inhalte getroffen die für die Bearbeitung wichtig sind. Alle neuen Erkenntnisse können direkt in der `playground.ts` ausprobiert werden. Es genügt die Beispiele in die Datei zu kopieren um Feedback von eurer IDE (vorzugsweise VSCode) zu erhalten. Die React Beispiele Funktionieren nur in der `src/index.tsx`.

### TypeScript

### Basic Types

Siehe [TypeScript Handbook - Basic Types](https://www.typescriptlang.org/docs/handbook/basic-types.html)

Wichtig in diesem Kapitel ist der Unterschied zwischen [Tuple](https://www.typescriptlang.org/docs/handbook/basic-types.html#tuple) und [Array](https://www.typescriptlang.org/docs/handbook/basic-types.html#array) zu verstehen.

#### Interfaces

Siehe [TypeScript Handbook - Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)

#### Sum/Union Types

Siehe den Abschnitt Union-Type Abschnitt in [TypeScript Handbook - Advanced Types](https://www.typescriptlang.org/docs/handbook/advanced-types.html#union-types).

Wichtig zu verstehen ist das man nicht nur Basic Types oder Interfaces als Elemente eines Union Types verwenden kann sondern auch auch die Werte von `string`, `number` oder `boolean` so lassen sich z. B. Zustände eines Objekts in Form eines Union Types kodieren.

```ts
type State = 'open' | 'closed'
type Color = 'red' | 'green' | 'blue'
type Level = 0 | 1 | 2 | 3

interface Door {
  color: Color
  state: State
  level: Level
}

const door: Door = {
  color: 'red',
  state: 'closed',
  level: 0
}

const noDoor: Door = {
  color: 'white', // Error
  state: 'open',
  level: 4 // Error
}
```

Ein weitere Beispiel indem Union Types sehr Sinnvoll sind, sind `Action` Definitionen.

```ts
interface OpenAction {
  type: 'open'
  payload: {
    openedBy: string
  }
}

interface CloseAction {
  type: 'close'
  payload: {
    closedBy: string
  }
}

type Action = OpenAction | CloseAction

const a: Action = {
  type: 'open',
  payload: {
    openedBy: 'me'
  }
}
const b: Action = {
  type: 'open',
  payload: {
    closedBy: 'me' // Error
  }
}
```

dieses ist vor allen dingen Hilfreich wenn Actions in Stores oder Reducern evaluiiert werden sollen

```ts
export function reducer(action: Action) {
  switch (action.type) {
    case 'open':
      return action.closedBy // Error: Property 'closedBy' does not exist on type 'OpenAction'
    case 'close':
      return action.openedBy // Error
    // No need for a default statement cause all possible type values are strictly defined
  }
}
```

### React

Es gibt eine sehr gute Einführung auf der [Offiziellen React Webseite](https://reactjs.org/docs/hello-world.html) die als allgemeine Grundlage verstanden werden kann.

Hierbei sei zu erwähnen, dass nur die sogennanten `Pure Components` zu verwenden sind, um Side Effects von Darstellungslogik klar zu trennen. Ein Beispiel für eine Pure Component kann der Dokumentation in [Kapitel 4.](https://reactjs.org/docs/components-and-props.html) entnommen werden.

```tsx
function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}
```

oder in Kurzform

```tsx
const Welcome = props => <h1>{props.name}</h1>
```

diese Komponente kann dann wie folgt verwendet werden

```tsx
<Welcome name="Hallo Welt" />
```

Wichtig ist zu verstehen, dass jede Funktion die eine React Komponente zurück gibt nur ein Root Element besitzen darf.

```tsx
const WillFail = (
  <h1>Title</h1>
  <p>Lorem Ipsum</p>
)
```

Diese Komponente wird nicht funktionieren. Stattdessen muss man die Komponente noch mal in ein leeren React Element kapseln. Dies sieht wie folgt aus

```tsx
const WillWork = (
  <>
    <h1>Title</h1>
    <p>Lorem Ipsum</p>
  </>
)
```

Es sei desweiteren Anzumerken, dass jede Datei die React verwenden will mit `.jsx` oder `.tsx` enden muss und das `import * as React from 'react'` im Kopf jeder Datei steht.

Damit React auch mit TypeScript verwendet werden kann muss in der `tsconfig.json` die Options `compilerOptions` `jsx` auf `react` gersetzt werden.

### effe-ts

[effe-ts](https://github.com/werk85/effe-ts) ist ein von der Programmiersprache [Elm](https://elm-lang.org/) inspiriertes Front-End Framework.

Im folgenden die wichtigen Grundbegriffe

* `Action` - Beschreibt eine Zustandänderung die in der `update` Funktion ausgeführt werden soll. Sollte Standardmäßig aus einem `type` und einem `payload` Argument bestehen. `effe-ts` selbst gibt keinen bestimmten Standard vor.
* `Model` - Beschreibt den kompletten Zustand der Anwendung. Man spricht auch von einem `Single State Tree`.
* `Cmd` - Beschreibt einen Side Effect der nach der Änderung des `Model` ausgeführt werden soll. Da man nicht immer einen Side Effect auslösen möchte gibt es das `cmd.none` welches nichts tut. Dies ist Analog zu einem `Actor` oder `Effect` aus anderen Architekturen.
* `init` - Initialer Wert unserer Anwendung. Dieser besteht aus einem Tuple der das initiale `Model` und ein initiales `Cmd` besteht.
* `update` - Entspricht einem `Store` oder `reducer`. Die Funktion ist Zustandlos. Der vorige Zustand und die `Action` die eine Zustandsänderung hervorrufen soll werden übergeben. Sie gibt den neuen Zustand inklusive einem `Cmd` zurück. Innerhalb einer Anwendung existiert nur eine (root) `update` Funktion. In komplexen Anwendungen wird die `update` Funktion aus mehren Sub `update` Funktionen zusammengesetzt.
* `view` - Entspricht einer `Container` Komponente die ein `Model` entgegen nimmt und eine entsprechende Visualisierung in Form von JSX/React Elementen des `Model` zurück gibt. Die `view` Funktion selbst führt nicht das rendern im DOM durch, sondern gibt eine Beschreibung zurück wie der DOM auszusehen hat. Benutzer interaktionen können in Form von `Action`s über die `dispatch` Funktion erfolgen. Wie bei der `update` Funktion existiert nur eine (root) `view` Funktion je Anwendung. Komplexere Front-Ends werden aus mehren sub `update` Funktionen zusammengesetzt.

Eine minimale `effe-ts` Anwendung kann in der Datei `src/index.tsx` entnommen werden.

## Beispielprojekt

Das Beispielprojekt beinhaltet eine minimale [effe-ts](https://github.com/werk85/effe-ts) Anwendung mit minimaler TypeScript typisierung. Probiert die in der Einführung beschriebenen Konzepte spielerisch in der `src/index.tsx` aus, bevor ihr euch an der Aufgabe ausprobiert.

Weitere Quellen mit `effe-ts` Code sind

* [react-todo-app](https://github.com/werk85/react-todo-app)
* [Minutes Client - Template Admin](https://github.com/werk85/minutes-client/tree/develop/packages/client)

### Projektstruktur

```
├── .eslintrc.js
├── README.md
├── package.json
├── src
│   ├── index.ejs // Our template file in which the application gets rendered into
│   ├── index.tsx // Our entry point of the application. Note the `x` in `tsx` indicates we can use JSX Elements
│   └── tsconfig.json // TypeScript configuration for everything in the `src` folder
├── styles
│   └── app.scss
├── tsconfig.json // TypeScript configuration for webpack
├── webpack.config.ts
└── yarn.lock
```

## Aufgabe

Erweitere die Anwendung so, dass über drei `button`s, die Darstellung des `Model`s geändert werden kann. Erstelle jeweils einen Button der das `Model` nach einem `click` entweder komplett in Großbuchstaben (`HALLO WELT`), Kleinbuchstaben (`hallo welt`) oder in ihrem ursprünglichen Zustand (`Hallo Welt`) ausgibt.

### Zusatzaufgabe

Erweitere die Anwendung um ein `input` Feld über den der `string` `Hallo Welt` durch einen beliebigen anderen `string` ersetzt werden kann. Die Darstellung die vorher über einen der Buttons ausgewählt wurde soll erhalten bleiben.