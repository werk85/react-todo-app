import { html, cmd } from 'effe-ts'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

/**
 * Describes the single state tree of our application
 * This is a TypeScript type alias which means everywhere, everywhere you see `Model` we mean `string`
 * This defition is useful when we want to modify our `Model` without changing the type everywhere.
 */
type Model = string

/**
 * Initial state containing our initial model and a side effect called `Cmd` (short form for Command) that should be executed on startup
 * In this case our model is a `string` and `cmd.none` means that we wan't to execute any side effect
 */
const init: [Model, cmd.Cmd<never>] = ['Hallo Welt', cmd.none]

/**
 * Update function is called on every dispatched `Action`. It must return the new `Model` value and `Cmd` that should be executed
 * In this case we return the model as is (no changes will be made) and say again that we want to execute any side effect
 */
const update = (action, model): [Model, cmd.Cmd<never>] => [model, cmd.none]

/**
 * View function receives the current model and a dispatch function and has to return a JSX/React Element.
 * The `model` is on startup equal to the model value defined in the `init` variable (`Hallo Welt`) and
 * changes accordingly to the returned model value of the `update` function.
 * The `dispatch` function accepts an `Action` as value and returns nothing. The `Action` will be handled by the `update` function.
 */
const view = model => dispatch => <>{model}</>

/**
 * Wires the `init`, `update` and `view` function together so they can "communicate" with each other.
 */
const app = html.program(init, update, view)

/**
 * Executes the constructed application and renders the result of our `view` function via the `ReactDOM` renderer.
 * The callback function with `dom` parameter is called on every `Model` change.
 * Now the application is acually running and can be seen in a browser window. Until now no side effects were be executed.
 */
html.run(app, dom => {
  ReactDOM.render(dom, document.getElementById('app'))
})
