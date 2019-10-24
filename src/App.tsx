import { contramap, ordBoolean, ordString, getSemigroup } from 'fp-ts/lib/Ord'
import * as R from 'fp-ts/lib/Record'
import { pipe } from 'fp-ts/lib/pipeable'
import { atRecord } from 'monocle-ts/lib/At/Record'
import { Prism, Lens } from 'monocle-ts/lib'
import * as E from 'fp-ts/lib/Either'
import * as A from 'fp-ts/lib/Array'
import { cmdr, html, stater, platform, subr } from 'effe-ts'
import { Union, of } from 'ts-union'
import * as O from 'fp-ts/lib/Option'
import * as NEA from 'fp-ts/lib/NonEmptyArray'
import * as rx from 'rxjs/operators'
import { fold } from 'fp-ts/lib/Monoid'
import * as T from 'fp-ts/lib/Tuple'
import * as Rr from 'fp-ts/lib/Reader'
import { Observable } from 'rxjs'
import { Title } from './components/Title'
import { EmptyTodos } from './components/EmptyTodos'
import { LoadingTodos } from './components/LoadingTodos'
import * as TodoForm from './containers/TodoForm'
import * as api from './api'
import * as Todo from './containers/Todo'
import * as React from 'react'

// Define how tasks should be ordered
const ordCaseInsensitiveString = contramap<string, string>(str => str.toLocaleLowerCase())(ordString)
const ordTodoText = contramap<string, Todo.Model>(Todo.textLens.get)(ordCaseInsensitiveString) // Order by text
const ordTodoIsDone = contramap<boolean, Todo.Model>(Todo.isDoneLens.get)(ordBoolean) // Order by isDone
const ordTodo = getSemigroup<Todo.Model>().concat(ordTodoIsDone, ordTodoText) // Combine both ordering strategies
const sortTodos = A.sort(contramap<Todo.Model, [string, Todo.Model]>(([_, todo]) => todo)(ordTodo))

export interface Todos extends Record<string, Todo.Model> {}

// The single state tree used by the application
export interface Model {
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
export const Action = Union({
  Api: of<api.Action>(),
  Todo: of<string, Todo.Action>(),
  TodoForm: of<TodoForm.Action>()
})
export type Action = typeof Action.T

export interface AppEnv extends api.ApiEnv, Todo.TodoEnv, TodoForm.TodoFormEnv {}

const monoidCmd = cmdr.getMonoid<AppEnv, Action>()
const applicativeState = stater.getApplicative<AppEnv, Action>()

// Generate the initial state of our application and trigger a command if wanted
export function init(env: AppEnv): stater.StateR<AppEnv, Model, Action> {
  return pipe(
    TodoForm.init(env),
    T.bimap(
      todoCmd =>
        fold(monoidCmd)([
          pipe(
            todoCmd,
            cmdr.map(Action.TodoForm)
          ),
          pipe(
            api.load,
            cmdr.map(Action.Api)
          )
        ]),
      current => ({
        current,
        todos: O.none
      })
    )
  )
}

export function update(action: Action, model: Model): stater.StateR<AppEnv, Model, Action> {
  return Action.match(action, {
    Api: action =>
      api.Action.match(action, {
        Add: (todo, response) =>
          pipe(
            response,
            E.fold(
              () => stater.of(model),
              response =>
                pipe(
                  Todo.init({
                    ...todo,
                    _rev: response.body.rev
                  }),
                  T.bimap(cmdr.map(action => Action.Todo(todo._id, action)), insertTodo(todo._id, model))
                )
            )
          ),
        Change: E.fold(
          () => stater.of(model),
          ({ doc }) => {
            if ('_deleted' in doc) {
              return stater.of(
                pipe(
                  model,
                  todosOptional.modify(R.deleteAt(doc._id))
                )
              )
            } else {
              return pipe(
                Todo.init(doc),
                T.bimap(cmdr.map(action => Action.Todo(doc._id, action)), insertTodo(doc._id, model))
              )
            }
          }
        ),
        Load: E.fold(
          // If the response is an error do nothing by returning the current model
          () => stater.of(model),
          // Else evaluate the http response
          response =>
            pipe(
              response.body.rows.map(row => Todo.init(row.doc)),
              A.reduce(stater.of<Todos>({}), (result, [todoModel, todoCmd]) => {
                const id = pipe(
                  todoModel,
                  Todo.idLens.get
                )
                return applicativeState.ap(
                  [
                    R.insertAt(id, todoModel),
                    pipe(
                      todoCmd,
                      cmdr.map(action => Action.Todo(id, action))
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
          stater.of(
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
        default: () => stater.of(model)
      }),
    Todo: (id, action) =>
      pipe(
        model,
        todoByIdOptional(id).getOption,
        O.fold(
          () => stater.of(model),
          todoModel =>
            pipe(
              Todo.update(action, todoModel),
              T.bimap(cmdr.map(action => Action.Todo(id, action)), todoModel =>
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
        T.bimap(cmdr.map(Action.TodoForm), formModel =>
          pipe(
            model,
            currentLens.set(formModel)
          )
        )
      ),
    default: () => stater.of(model)
  })
}

const view = (model: Model) => (dispatch: platform.Dispatch<Action>) => {
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
  const Form = () => TodoForm.view(model.current)(action => dispatch(Action.TodoForm(action)))

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <Title stats={stats} />
        </h3>
      </div>
      <div className="card-body">
        <Form />
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
              todos => <>{todos.map(([id, model]) => Todo.view(model)(action => dispatch(Action.Todo(id, action))))}</>
            )
          )
        )}
      </ul>
    </div>
  )
}

export const subscriptions: subr.SubR<AppEnv, Model, Action> = pipe(
  api.subscriptions,
  Rr.map(Rr.local<Observable<Model>, Observable<boolean>>(rx.map(model => O.isSome(model.todos)))),
  subr.map(Action.Api)
)

export const app = html.programR(init, update, view, subscriptions)
