import { html, cmd, platform } from 'effe-ts'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

type Casing = 'upper' | 'lower' | 'none'

interface Model {
  input: string
  value: string
  casing: Casing
}

type Action =
  | { type: 'ChangeCasing', payload: Casing }
  | { type: 'ChangeValue', payload: string }
  | { type: 'ApplyValue' }

const init: [Model, cmd.Cmd<never>] = [
  {
    input: 'Hallo Welt',
    value: '',
    casing: 'none'
  },
  cmd.none
]

const update = (action: Action, model: Model): [Model, cmd.Cmd<never>] => {
  switch (action.type) {
    case 'ChangeCasing':
      return [
        {
          ...model,
          casing: action.payload
        },
        cmd.none
      ]
    case 'ChangeValue':
      return [
        {
          ...model,
          input: action.payload
        },
        cmd.none
      ]
    case 'ApplyValue':
      return [
        {
          ...model,
          value: model.input
        },
        cmd.none
      ]
  }
}

const format = (str: string, casing: Casing): string => {
  switch (casing) {
    case 'lower':
      return str.toLowerCase()
    case 'upper':
      return str.toUpperCase()
    case 'none':
      return str
  }
}

const view = (model: Model) => (dispatch: platform.Dispatch<Action>) => (
  <>
    <input onChange={(event) => dispatch({ type: 'ChangeValue', payload: event.target.value })} value={model.input} />
    <button onClick={() => dispatch({ type: 'ApplyValue' })}>Apply</button>
    <br />
    {format(model.value, model.casing)}
    <br />
    <button onClick={() => dispatch({ type: 'ChangeCasing', payload: 'none' })}>None</button>
    <button onClick={() => dispatch({ type: 'ChangeCasing', payload: 'upper' })}>Upper</button>
    <button onClick={() => dispatch({ type: 'ChangeCasing', payload: 'lower' })}>Lower</button>
  </>
)

const app = html.program(init, update, view)

html.run(app, dom => {
  ReactDOM.render(dom, document.getElementById('app'))
})
