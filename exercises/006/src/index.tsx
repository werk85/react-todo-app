import { html, cmd, localStorage, platform } from 'effe-ts'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import * as t from 'io-ts'
import { Union, of } from 'ts-union'
import { Todo as TodoComponent } from './components/Todo'
import { TodoForm } from './components/TodoForm'
import { Title } from './components/Title'
import { EmptyTodos } from './components/EmptyTodos'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

const Todo = t.interface(
  {
    text: t.string,
    isDone: t.boolean
  },
  'Todo'
)
type Todo = t.TypeOf<typeof Todo>

interface Model {
  input: string
  todos: Array<Todo>
}

const Action = Union({
  UpdateText: of<string>(),
  Add: of(null),
  ToggleDone: of<number>(),
  Load: of<E.Either<localStorage.LocalStorageError, O.Option<Array<Todo>>>>()
})
type Action = typeof Action.T

const entity = localStorage.entity('todos', t.array(Todo))

const load = localStorage.load(entity, Action.Load)
const save = localStorage.save(entity)

const init: [Model, cmd.Cmd<Action>] = [
  {
    input: '',
    todos: []
  },
  load
]

const update = (action: Action, model: Model): [Model, cmd.Cmd<Action>] =>
  Action.match(action, {
    Add: () => {
      const updatedModel = {
        input: '',
        todos: model.todos.concat({
          text: model.input,
          isDone: false
        })
      }
      return [updatedModel, save(updatedModel.todos)]
    },
    Load: E.fold(
      () => [model, cmd.none],
      O.fold(
        () => [model, cmd.none],
        todos => [
          {
            ...model,
            todos
          },
          cmd.none
        ]
      )
    ),
    UpdateText: input => [
      {
        ...model,
        input
      },
      cmd.none
    ],
    ToggleDone: index => {
      const updatedModel = {
        ...model,
        todos: model.todos.map((todo, i) => (i === index ? { ...todo, isDone: !todo.isDone } : todo))
      }
      return [updatedModel, save(updatedModel.todos)]
    }
  })

const view = (model: Model) => (dispatch: platform.Dispatch<Action>) => (
  <div className="card">
    <div className="card-header">
      <Title />
    </div>
    <div className="card-body">
      <TodoForm
        input={model.input}
        onAdd={() => dispatch(Action.Add)}
        onChange={event => dispatch(Action.UpdateText(event.target.value))}
      />
    </div>
    <ul className="list-group list-group-flush">
      {model.todos.length === 0 ? <EmptyTodos /> : null}
      {model.todos.map((todo, i) => (
        <TodoComponent key={i} {...todo} onToggle={() => dispatch(Action.ToggleDone(i))} />
      ))}
    </ul>
  </div>
)

const app = html.program(init, update, view)

html.run(app, dom => {
  ReactDOM.render(dom, document.getElementById('app'))
})
