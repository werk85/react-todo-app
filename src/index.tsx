import { contramap, ordBoolean, ordString, getSemigroup } from 'fp-ts/lib/Ord'
import * as R from 'fp-ts/lib/Record'
import { pipe } from 'fp-ts/lib/pipeable'
import { atRecord } from 'monocle-ts/lib/At/Record'
import { Prism, Lens } from 'monocle-ts/lib'
import * as E from 'fp-ts/lib/Either'
import * as A from 'fp-ts/lib/Array'
import { cmd, html, state, platform } from 'effe-ts'
import { Union, of } from 'ts-union'
import * as O from 'fp-ts/lib/Option'
import * as NEA from 'fp-ts/lib/NonEmptyArray'
import * as rx from 'rxjs/operators'
import { fold } from 'fp-ts/lib/Monoid'
import * as T from 'fp-ts/lib/Tuple'
import { Title } from './components/Title'
import { EmptyTodos } from './components/EmptyTodos'
import { LoadingTodos } from './components/LoadingTodos'
import * as TodoForm from './containers/TodoForm'
import * as api from './api'
import * as Todo from './containers/Todo'
import * as ReactDOM from 'react-dom'
import * as React from 'react'

// Define how tasks should be ordered
const ordCaseInsensitiveString = contramap<string, string>(str => str.toLocaleLowerCase())(ordString)
const ordTodoText = contramap<string, Todo.Model>(Todo.textLens.get)(ordCaseInsensitiveString) // Order by text
const ordTodoIsDone = contramap<boolean, Todo.Model>(Todo.isDoneLens.get)(ordBoolean) // Order by isDone
const ordTodo = getSemigroup<Todo.Model>().concat(ordTodoIsDone, ordTodoText) // Combine both ordering strategies
const sortTodos = A.sort(contramap<Todo.Model, [string, Todo.Model]>(([_, todo]) => todo)(ordTodo))

interface Todos extends Record<string, Todo.Model> {}

// The single state tree used by the application
interface Model {
  current: TodoForm.Model
  todos: O.Option<Todos>
}

// Lenses for the `Model`
const currentLens = Lens.fromProp<Model>()('current')
const todosLens = Lens.fromProp<Model>()('todos')
const todosOptional = todosLens.composePrism(Prism.some())
const todoByIdOptional = (id: string) => todosOptional.composeLens(atRecord<Todo.Model>().at(id)).composePrism(Prism.some())
const insertTodo = (id: string, model: Model) => (todoModel: Todo.Model): Model =>
  pipe(
    model,
    todosOptional.modify(R.insertAt(id, todoModel))
  )

// All actions that can happen in our application
const Action = Union({
  Api: of<api.Action>(),
  Todo: of<string, Todo.Action>(),
  TodoForm: of<TodoForm.Action>()
})
type Action = typeof Action.T
const monoidCmd = cmd.getMonoid<Action>()
const applicativeState = state.getApplicative<Action>()

interface Flags {
  seed: number
}

// Generate the initial state of our application and trigger a command if wanted
const init = (flags: Flags): [Model, cmd.Cmd<Action>] =>
  pipe(
    TodoForm.init(flags.seed),
    T.bimap(
      todoCmd =>
        fold(monoidCmd)([
          pipe(
            todoCmd,
            cmd.map(Action.TodoForm)
          ),
          pipe(
            api.load,
            cmd.map(Action.Api)
          )
        ]),
      current => ({
        current,
        todos: O.none
      })
    )
  )

const update = (action: Action, model: Model): [Model, cmd.Cmd<Action>] =>
  Action.match(action, {
    Api: action =>
      api.Action.match(action, {
        Add: (todo, response) =>
          pipe(
            response,
            E.fold(
              () => state.of(model),
              response =>
                pipe(
                  Todo.init({
                    ...todo,
                    _rev: response.body.rev
                  }),
                  T.bimap(cmd.map(action => Action.Todo(todo._id, action)), insertTodo(todo._id, model))
                )
            )
          ),
        Change: E.fold(
          () => state.of(model),
          ({ doc }) => {
            if ('_deleted' in doc) {
              return state.of(
                pipe(
                  model,
                  todosOptional.modify(R.deleteAt(doc._id))
                )
              )
            } else {
              return pipe(
                Todo.init(doc),
                T.bimap(cmd.map(action => Action.Todo(doc._id, action)), insertTodo(doc._id, model))
              )
            }
          }
        ),
        Load: E.fold(
          // If the response is an error do nothing by returning the current model
          () => state.of(model),
          // Else evaluate the http response
          response =>
            pipe(
              response.body.rows.map(row => Todo.init(row.doc)),
              A.reduce(state.of<Todos, Action>({}), (result, [todoModel, todoCmd]) => {
                const id = pipe(
                  todoModel,
                  Todo.idLens.get
                )
                return applicativeState.ap(
                  [
                    R.insertAt(id, todoModel),
                    pipe(
                      todoCmd,
                      cmd.map(action => Action.Todo(id, action))
                    )
                  ],
                  result
                )
              }),
              T.map(todos =>
                pipe(
                  model,
                  todosLens.set(O.some(todos))
                )
              )
            )
        ),
        Remove: (todo, response) =>
          state.of(
            pipe(
              response,
              E.fold(
                () => model,
                () =>
                  pipe(
                    model,
                    todosOptional.modify(R.deleteAt(todo._id))
                  )
              )
            )
          ),
        default: () => state.of(model)
      }),
    Todo: (id, action) =>
      pipe(
        model,
        todoByIdOptional(id).getOption,
        O.fold(
          () => state.of(model),
          todoModel =>
            pipe(
              Todo.update(action, todoModel),
              T.bimap(cmd.map(action => Action.Todo(id, action)), todoModel =>
                pipe(
                  model,
                  todoByIdOptional(id).set(todoModel)
                )
              )
            )
        )
      ),
    TodoForm: action =>
      pipe(
        TodoForm.update(action, model.current),
        T.bimap(cmd.map(Action.TodoForm), formModel =>
          pipe(
            model,
            currentLens.set(formModel)
          )
        )
      ),
    default: () => state.of(model)
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
