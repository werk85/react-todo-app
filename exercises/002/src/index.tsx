import { html, cmd } from 'effe-ts'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

interface Model {
  value: string
  casing: 'upper' | 'lower' | 'none'
}

const init: [Model, cmd.Cmd<never>] = [
  {
    value: 'Hallo Welt',
    casing: 'none'
  },
  cmd.none
]

const update = (action, model): [Model, cmd.Cmd<never>] => {
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
          value: action.payload
        },
        cmd.none
      ]
  }
}

const format = (str, casing): string => {
  switch (casing) {
    case 'lower':
      return str.toLowerCase()
    case 'upper':
      return str.toUpperCase()
    case 'none':
      return str
  }
}

const view = model => dispatch => (
  <>
    <input onChange={(event) => dispatch({ type: 'ChangeValue', payload: event.target.value })} value={model.value} />
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
