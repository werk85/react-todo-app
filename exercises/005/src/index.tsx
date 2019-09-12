import { html, cmd, platform } from 'effe-ts'
import { Todo } from './components/Todo'
import { TodoForm } from './components/TodoForm'
import { Title } from './components/Title'
import { EmptyTodos } from './components/EmptyTodos'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

interface Todo {
  text: string
  isDone: boolean
}

interface Model {
  input: string
  todos: Array<Todo>
}

type Action = { type: 'UpdateText'; payload: string } | { type: 'Add' } | { type: 'ToggleDone'; payload: number }

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
          todos: model.todos.map((todo, i) => (i === action.payload ? { ...todo, isDone: !todo.isDone } : todo))
        },
        cmd.none
      ]
  }
}

const view = (model: Model) => (dispatch: platform.Dispatch<Action>) => (
  <div className="card">
    <div className="card-header">
      <Title />
    </div>
    <div className="card-body">
      <TodoForm
        input={model.input}
        onAdd={() => dispatch({ type: 'Add' })}
        onChange={event => dispatch({ type: 'UpdateText', payload: event.target.value })}
      />
    </div>
    <ul className="list-group list-group-flush">
      {model.todos.length === 0 ? <EmptyTodos /> : null}
      {model.todos.map((todo, i) => (
        <Todo key={i} {...todo} onToggle={() => dispatch({ type: 'ToggleDone', payload: i })} />
      ))}
    </ul>
  </div>
)

const app = html.program(init, update, view)

html.run(app, dom => {
  ReactDOM.render(dom, document.getElementById('app'))
})
