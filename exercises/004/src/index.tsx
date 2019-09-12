import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { html, cmd, platform } from 'effe-ts'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { faCheckSquare } from '@fortawesome/free-solid-svg-icons'
import { faSquare } from '@fortawesome/free-regular-svg-icons'

interface Todo {
  text: string
  isDone: boolean
}

interface Model {
  input: string
  todos: Array<Todo>
}

type Action = { type: 'UpdateText'; payload: string } | { type: 'Add' } | { type: 'ToggleDone', payload: number }

const init: [Model, cmd.Cmd<never>] = [
  {
    input: '',
    todos: []
  },
  cmd.none
]

const update = (action: Action, model: Model): [Model, cmd.Cmd<never>] => {
  switch (action.type) {
    case 'Add':
      return [
        {
          input: '',
          todos: model.todos.concat({
            text: model.input,
            isDone: false
          })
        },
        cmd.none
      ]
    case 'UpdateText':
      return [
        {
          ...model,
          input: action.payload
        },
        cmd.none
      ]
    case 'ToggleDone':
      return [
        {
          ...model,
          todos: model.todos.map((todo, i) => i === action.payload ? ({ ...todo, isDone: !todo.isDone }) : todo)
        },
        cmd.none
      ]
  }
}

const view = (model: Model) => (dispatch: platform.Dispatch<Action>) => (
  <div className="card">
    <div className="card-header">Simple Todo</div>
    <div className="card-body">
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          value={model.input}
          onChange={event => dispatch({ type: 'UpdateText', payload: event.target.value })}
        />
        <div className="input-group-append">
          <button type="submit" className="btn btn-primary" onClick={() => dispatch({ type: 'Add' })}>
            Add
          </button>
        </div>
      </div>
    </div>
    <ul className="list-group list-group-flush">
      {model.todos.map((todo, i) => (
        <li key={i} className="task-container list-group-item d-flex justify-content-between align-items-center">
          <div>
            <a href="#" className="btn-left" onClick={() => dispatch({ type: 'ToggleDone', payload: i })}>
              <FontAwesomeIcon icon={todo.isDone ? faCheckSquare : faSquare} />
            </a>
            {!todo.isDone ? todo.text : <del className="text-muted">{todo.text}</del>}
          </div>
        </li>
      ))}
    </ul>
  </div>
)

const app = html.program(init, update, view)

html.run(app, dom => {
  ReactDOM.render(dom, document.getElementById('app'))
})
