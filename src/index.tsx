import { contramap, ordBoolean, ordString, getSemigroup } from 'fp-ts/lib/Ord'
import * as R from 'fp-ts/lib/Record'
import { pipe } from 'fp-ts/lib/pipeable'
import { atRecord } from 'monocle-ts/lib/At/Record'
import { Prism, Lens } from 'monocle-ts/lib'
import * as E from 'fp-ts/lib/Either'
import { getFirstSemigroup } from 'fp-ts/lib/Semigroup'
import * as A from 'fp-ts/lib/Array'
import { tuple } from 'fp-ts/lib/function'
import { cmd, html, platform } from 'effe-ts'
import { Union, of } from 'ts-union'
import * as O from 'fp-ts/lib/Option'
import * as NEA from 'fp-ts/lib/NonEmptyArray'
import * as rx from 'rxjs/operators'
import { fold } from 'fp-ts/lib/Monoid'
import { Title } from './components/Title'
import { EmptyTodos } from './components/EmptyTodos'
import { LoadingTodos } from './components/LoadingTodos'
import * as TodoForm from './containers/TodoForm'
import * as api from './api'
import * as Todo from './containers/Todo'
import * as ReactDOM from 'react-dom'
import * as React from 'react'

// Define how tasks should be ordered
const ordTodoText = contramap<string, Todo.Model>(Todo.textLens.get)(ordString) // Order by text
const ordTodoIsDone = contramap<boolean, Todo.Model>(Todo.isDoneLens.get)(ordBoolean) // Order by isDone
const ordTodo = getSemigroup<Todo.Model>().concat(ordTodoIsDone, ordTodoText) // Combine both ordering strategies
const sortTodos = A.sort(contramap<Todo.Model, [string, Todo.Model]>(([_, todo]) => todo)(ordTodo))

// Util
const groupTodosBy = R.fromFoldableMap(getFirstSemigroup<Todo.Model>(), A.array)

// The single state tree used by the application
interface Model {
  current: TodoForm.Model
  todos: O.Option<Record<string, Todo.Model>>
}

// Lenses for the `Model`
const currentLens = Lens.fromProp<Model>()('current')
const todosLens = Lens.fromProp<Model>()('todos')
const todosOptional = todosLens.composePrism(Prism.some())
const todoByIdOptional = (id: string) => todosOptional.composeLens(atRecord<Todo.Model>().at(id)).composePrism(Prism.some())
const todoByIdOptionalRev = (id: string) => todoByIdOptional(id).composeLens(Todo.revLens)

// All actions that can happen in our application
const Action = Union({
  Api: of<api.Action>(),
  Todo: of<string, Todo.Action>(),
  TodoForm: of<TodoForm.Action>()
})
type Action = typeof Action.T
const monoidCmd = cmd.getMonoid<Action>()

interface Flags {
  seed: number
}

// Generate the initial state of our application and trigger a command if wanted
const init = (flags: Flags): [Model, cmd.Cmd<Action>] => {
  const [currentModel, currentCmd] = TodoForm.init(flags.seed)
  return [
    {
      current: currentModel,
      todos: O.none
    },
    fold(monoidCmd)([
      pipe(
        api.load,
        cmd.map(Action.Api)
      ),
      pipe(
        currentCmd,
        cmd.map(Action.TodoForm)
      )
    ])
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
              response => {
                const [todoModel, todoCmd] = Todo.init({
                  ...todo,
                  _rev: response.body.rev
                })
                return [
                  pipe(
                    model,
                    todosOptional.modify(R.insertAt(response.body.id, todoModel))
                  ),
                  pipe(
                    todoCmd,
                    cmd.map(action => Action.Todo(todo._id, action))
                  )
                ]
              }
            )
          ),
        Change: E.fold(
          () => [model, cmd.none] as [Model, cmd.Cmd<Action>],
          ({ doc }) => {
            if ('_deleted' in doc) {
              return [
                pipe(
                  model,
                  todosOptional.modify(R.deleteAt(doc._id))
                ),
                cmd.none
              ]
            }
            const [todoModel, todoCmd] = Todo.init(doc)
            return [
              pipe(
                model,
                todosOptional.modify(R.insertAt(doc._id, todoModel))
              ),
              pipe(
                todoCmd,
                cmd.map(action => Action.Todo(doc._id, action))
              )
            ]
          }
        ),
        Load: E.fold(
          // If the response is an error do nothing by returning the current model
          () => [model, cmd.none],
          // Else evaluate the http response
          response => {
            const docs = response.body.rows.map(row => row.doc).map(doc => tuple(doc._id, ...Todo.init(doc)))
            const todos = groupTodosBy(docs, ([id, todo]) => [id, todo])
            const cmds = docs.map(([id, _, c]) =>
              pipe(
                c,
                cmd.map(action => Action.Todo(id, action))
              )
            )
            return [
              pipe(
                model,
                todosLens.set(O.some(todos))
              ),
              fold(monoidCmd)(cmds)
            ]
          }
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
    Todo: (id, action) => {
      return pipe(
        model,
        todoByIdOptional(id).getOption,
        O.fold(
          () => [model, cmd.none],
          todoModel => {
            const [m, c] = Todo.update(action, todoModel)
            return [
              pipe(
                model,
                todoByIdOptional(id).set(m)
              ),
              pipe(
                c,
                cmd.map(action => Action.Todo(id, action))
              )
            ]
          }
        )
      )
    },
    TodoForm: action => {
      const [m, c] = TodoForm.update(action, model.current)
      return [
        pipe(
          model,
          currentLens.set(m)
        ),
        pipe(
          c,
          cmd.map(Action.TodoForm)
        )
      ]
    },
    default: () => [model, cmd.none]
  })

const view = (model: Model) => {
  // Convert todos record to non empty array and sort it
  // The result is a Option<Option<NonEmptyArray<Todo>>> type
  // The most outer Option signalize the loading state. The inner Option signalize if the array is empty or not
  // and the internal array has at least one Todo element
  const todos = pipe(
    model.todos,
    O.map(todos => NEA.fromArray(sortTodos(R.toArray(todos))))
  )
  const stats = pipe(
    todos,
    O.flatten,
    O.map(todos => ({
      done: todos.filter(([_, todo]) => Todo.isDoneLens.get(todo)).length,
      total: todos.length
    }))
  )

  return (dispatch: platform.Dispatch<Action>) => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <Title stats={stats} />
        </h3>
      </div>
      <div className="card-body">{TodoForm.view(model.current)(action => dispatch(Action.TodoForm(action)))}</div>
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
              todos => <>{todos.map(([id, model]) => Todo.view(model)(action => dispatch(Action.Todo(id, action))))}</>
            )
          )
        )}
      </ul>
    </div>
  )
}

const app = html.programWithFlags(init, update, view, model =>
  pipe(
    model.todos,
    O.fold(api.changes.stop, api.changes.start),
    rx.map(Action.Api)
  )
)

html.run(
  app({
    seed: Date.now() * Math.random()
  }),
  dom => {
    ReactDOM.render(dom, document.getElementById('app'))
  }
)
