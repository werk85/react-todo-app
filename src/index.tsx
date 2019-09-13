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
import * as O from 'fp-ts/lib/Option'
import * as NEA from 'fp-ts/lib/NonEmptyArray'
import * as random from './random'
import { Title } from './components/Title'
import { TodoForm } from './components/TodoForm'
import { EmptyTodos } from './components/EmptyTodos'
import { LoadingTodos } from './components/LoadingTodos'
import { Todo } from './components/Todo'
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
const ordTodo = getSemigroup<api.Document<api.Todo>>().concat(ordTodoIsDone, ordTodoText) // Combine both ordering strategies
const sortTodos = A.sort(ordTodo)

// Util
const groupTasksBy = R.fromFoldableMap(getFirstSemigroup<api.Document<api.Todo>>(), A.array)

// The single state tree used by the application
interface Model {
  seed: number
  current: api.Document<api.Todo> | api.Todo
  todos: O.Option<Record<string, api.Document<api.Todo>>>
}

// Lenses for the `Model`
const currentLens = Lens.fromProp<Model>()('current')
const currentTextLens = currentLens.composeLens(Lens.fromProp<api.Document<api.Todo> | api.Todo>()('text'))
const seedLens = Lens.fromProp<Model>()('seed')
const todosLens = Lens.fromProp<Model>()('todos')
const todosOptional = todosLens.composePrism(Prism.some())
const todoByIdOptional = (id: string) =>
  todosOptional.composeLens(atRecord<api.Document<api.Todo>>().at(String(id))).composePrism(Prism.some())
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
      todos: O.none
    },
    pipe(
      api.load,
      cmd.map(Action.Api)
    )
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
                pipe(
                  model,
                  seedLens.modify(random.next),
                  currentLens.set(emptyTodo(model.seed)),
                  todosOptional.modify(
                    R.insertAt(response.body.id, {
                      ...todo,
                      _rev: response.body.rev
                    })
                  )
                ),
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
                const todos = groupTasksBy(docs, todo => [todo._id, todo])
                return [
                  pipe(
                    model,
                    todosLens.set(O.some(todos))
                  ),
                  cmd.none
                ]
              }
            )
          ),
        Remove: ({ todo, response }) =>
          pipe(
            response,
            E.fold(
              () => [model, cmd.none],
              () => [
                pipe(
                  model,
                  todosOptional.modify(R.deleteAt(todo._id))
                ),
                cmd.none
              ]
            )
          ),
        Update: ({ todo, response }) =>
          pipe(
            response,
            E.fold(
              () => [model, cmd.none],
              response => [
                pipe(
                  model,
                  todoByIdOptionalRev(todo._id).set(response.body.rev)
                ),
                cmd.none
              ]
            )
          )
      }),
    Add: () => [
      pipe(
        model,
        seedLens.modify(random.next),
        currentLens.set(emptyTodo(model.seed))
      ),
      pipe(
        api.add(model.current),
        cmd.map(Action.Api)
      )
    ],
    Edit: ({ todo }) => [
      pipe(
        model,
        currentLens.set(todo)
      ),
      cmd.none
    ],
    ToggleDone: ({ todo }) => {
      const updated = { ...todo, isDone: !todo.isDone }
      return [
        pipe(
          model,
          todoByIdOptional(todo._id).set(updated)
        ),
        pipe(
          api.update(updated),
          cmd.map(Action.Api)
        )
      ]
    },
    ToggleFav: ({ todo }) => {
      const updated = { ...todo, isFav: !todo.isFav }
      return [
        pipe(
          model,
          todoByIdOptional(todo._id).set(updated)
        ),
        pipe(
          api.update(updated),
          cmd.map(Action.Api)
        )
      ]
    },
    Remove: ({ todo }) => [
      model,
      pipe(
        api.remove(todo),
        cmd.map(Action.Api)
      )
    ],
    UpdateText: ({ text }) => [
      pipe(
        model,
        currentTextLens.set(text)
      ),
      cmd.none
    ],
    default: () => [model, cmd.none]
  })

const view = (model: Model) => {
  // Convert todos record to non empty array and sort it
  // The result is a Option<Option<NonEmptyArray<Todo>>> type
  // The most outer Option signalize the loading state. The inner Option signalize if the array is empty or not
  // and the internal array has at least one Todo element
  const todos = pipe(
    model.todos,
    O.map(todos => NEA.fromArray(sortTodos(Object.values(todos))))
  )
  const stats = pipe(
    todos,
    O.flatten,
    O.map(todos => ({
      done: todos.filter(todo => todo.isDone).length,
      total: todos.length
    }))
  )
  const isEditing = '_rev' in model.current

  return (dispatch: platform.Dispatch<Action>) => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <Title stats={stats} />
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
        {pipe(
          // Unpacking the todos Option<Option<NonEmptyArray<Todo>>> object
          todos,
          O.fold(
            // If the most outer Option is none the app is loading the todos
            () => <LoadingTodos />,
            // Else we most outer Option is some and we need evaluate the inner Option.
            // Note: `fold` returns a new function that accepts the Option<NonEmptyArray<Todo>> type so the `pipe` call would be redundant
            O.fold(
              // If the the inner Option is none the array is empty
              () => <EmptyTodos />,
              // Else the todos were loaded and the array is not empty
              todos => (
                <>
                  {todos.map(todo => (
                    <Todo
                      key={todo._id}
                      {...todo}
                      onEdit={() => dispatch(Action.Edit({ todo }))}
                      onRemove={() => dispatch(Action.Remove({ todo }))}
                      onToggleDone={() => dispatch(Action.ToggleDone({ todo }))}
                      onToggleFav={() => dispatch(Action.ToggleFav({ todo }))}
                    />
                  ))}
                </>
              )
            )
          )
        )}
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
