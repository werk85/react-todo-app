import { contramap, ordBoolean, ordString, getSemigroup } from 'fp-ts/lib/Ord'
import * as R from 'fp-ts/lib/Record'
import { pipe } from 'fp-ts/lib/pipeable'
import { atRecord } from 'monocle-ts/es6/At/Record'
import { Prism, Lens } from 'monocle-ts/es6'
import * as E from 'fp-ts/lib/Either'
import { getFirstSemigroup } from 'fp-ts/lib/Semigroup'
import * as A from 'fp-ts/lib/Array'
import { cmd, html, platform } from 'effe-ts'
import { Union, of } from 'ts-union'
import * as random from './random'
import { Title } from './components/Title'
import { TodoForm } from './components/TodoForm'
import { EmptyTask } from './components/EmptyTask'
import { Todo as TodoComponent } from './components/Todo'
import * as api from './api'
import uuid from 'uuid'
import * as ReactDOM from 'react-dom'
import * as React from 'react'

// Function for creating an empty task
const emptyTodo = (seed: number): api.Todo => ({
  _id: uuid.v1({ msecs: seed }),
  text: '',
  isDone: false,
  isFav: false
})

// Define how tasks should be ordered
const ordTodoText = contramap<string, api.Document<api.Todo>>(todo => todo.text)(ordString) // Order by text
const ordTodoIsDone = contramap<boolean, api.Document<api.Todo>>(todo => todo.isDone)(ordBoolean) // Order by isDone
const ordTask = getSemigroup<api.Document<api.Todo>>().concat(ordTodoIsDone, ordTodoText) // Combine both ordering strategies
const sortTodos = A.sort(ordTask)

// Util
const groupTasksBy = R.fromFoldableMap(getFirstSemigroup<api.Document<api.Todo>>(), A.array)

// The single state tree used by the application
interface Model {
  seed: number
  current: api.Document<api.Todo> | api.Todo
  todos: Record<string, api.Document<api.Todo>>
}

// Lenses for the `Model`
const currentLens = Lens.fromProp<Model>()('current')
const currentTextLens = currentLens.composeLens(Lens.fromProp<api.Document<api.Todo> | api.Todo>()('text'))
const todosLens = Lens.fromProp<Model>()('todos')
const todoByIdOptional = (id: string) =>
  todosLens.composeLens(atRecord<api.Document<api.Todo>>().at(String(id))).composePrism(Prism.some())
const todoByIdOptionalRev = (id: string) => todoByIdOptional(id).composeLens(Lens.fromProp<api.Document<api.Todo>>()('_rev'))

// All actions that can happen in our application
const Action = Union({
  Api: of<api.Action>(),
  Add: of(),
  Edit: of<{ todo: api.Document<api.Todo> }>(),
  ToggleDone: of<{ todo: api.Document<api.Todo> }>(),
  ToggleFav: of<{ todo: api.Document<api.Todo> }>(),
  Remove: of<{ todo: api.Document<api.Todo> }>(),
  UpdateText: of<{ text: string }>()
})
type Action = typeof Action.T

interface Flags {
  seed: number
}

// Generate the initial state of our application and trigger a command if wanted
const init = (flags: Flags): [Model, cmd.Cmd<Action>] => {
  const seed = random.seed(flags.seed)
  return [
    {
      seed: random.next(seed),
      current: emptyTodo(seed),
      todos: {}
    },
    cmd.cmd.map(api.load, Action.Api)
  ]
}

const update = (action: Action, model: Model): [Model, cmd.Cmd<Action>] =>
  Action.match(action, {
    Api: action =>
      api.Action.match(action, {
        Add: ({ todo, response }) =>
          pipe(
            response,
            E.fold(
              () => [model, cmd.none],
              response => [
                {
                  ...model,
                  seed: random.next(model.seed),
                  current: emptyTodo(model.seed),
                  todos: R.insertAt(response.body.id, {
                    ...todo,
                    _rev: response.body.rev
                  })(model.todos)
                },
                cmd.none
              ]
            )
          ),
        Load: response =>
          pipe(
            response,
            E.fold(
              // If the response is an error do nothing by returning the current model
              () => [model, cmd.none],
              // Else evaluate the http response
              response => {
                const docs = response.body.rows.map(row => row.doc)
                const todos = groupTasksBy(docs, todo => [String(todo._id), todo])
                return [
                  {
                    ...model,
                    todos
                  },
                  cmd.none
                ]
              }
            )
          ),
        Remove: ({ todo, response }) =>
          pipe(
            response,
            E.fold(() => [model, cmd.none], () => [todosLens.modify(R.deleteAt(String(todo._id)))(model), cmd.none])
          ),
        Update: ({ todo, response }) =>
          pipe(
            response,
            E.fold(() => [model, cmd.none], response => [todoByIdOptionalRev(todo._id).set(response.body.rev)(model), cmd.none])
          )
      }),
    Add: () => [
      {
        ...model,
        seed: random.next(model.seed),
        current: emptyTodo(model.seed)
      },
      cmd.cmd.map(api.add(model.current), Action.Api)
    ],
    Edit: ({ todo }) => [currentLens.set(todo)(model), cmd.none],
    ToggleDone: ({ todo }) => {
      const updated = { ...todo, isDone: !todo.isDone }
      return [todoByIdOptional(todo._id).set(updated)(model), cmd.cmd.map(api.update(updated), Action.Api)]
    },
    ToggleFav: ({ todo }) => {
      const updated = { ...todo, isFav: !todo.isFav }
      return [todoByIdOptional(todo._id).set(updated)(model), cmd.cmd.map(api.update(updated), Action.Api)]
    },
    Remove: ({ todo }) => [model, cmd.cmd.map(api.remove(todo), Action.Api)],
    UpdateText: ({ text }) => [currentTextLens.set(text)(model), cmd.none],
    default: () => [model, cmd.none]
  })

const view = (model: Model) => {
  // Convert todos record to array and sort
  const todos = sortTodos(Object.values(model.todos))
  const done = todos.filter(todo => todo.isDone).length
  const total = todos.length
  const isEditing = '_rev' in model.current

  return (dispatch: platform.Dispatch<Action>) => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <Title done={done} total={total} />
        </h3>
      </div>
      <div className="card-body">
        <TodoForm
          isEditing={isEditing}
          value={model.current.text}
          onChange={text => dispatch(Action.UpdateText({ text }))}
          onSubmit={() => dispatch(Action.Add())}
        />
      </div>
      <ul className="list-group list-group-flush">
        {/* If we have no tasks we show a placeholder */}
        {total === 0 ? <EmptyTask /> : null}
        {todos.map(todo => (
          <TodoComponent
            key={todo._id}
            {...todo}
            onEdit={() => dispatch(Action.Edit({ todo }))}
            onRemove={() => dispatch(Action.Remove({ todo }))}
            onToggleDone={() => dispatch(Action.ToggleDone({ todo }))}
            onToggleFav={() => dispatch(Action.ToggleFav({ todo }))}
          />
        ))}
      </ul>
    </div>
  )
}

const app = html.programWithFlags(init, update, view)

html.run(
  app({
    seed: Date.now() * Math.random()
  }),
  dom => {
    ReactDOM.render(dom, document.getElementById('app'))
  }
)
