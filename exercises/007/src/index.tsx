import { html, cmd, localStorage, platform } from 'effe-ts'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import * as t from 'io-ts'
import { Union, of } from 'ts-union'
import { pipe } from 'fp-ts/lib/pipeable'
import { Lens, Prism } from 'monocle-ts'
import * as R from 'fp-ts/lib/Record'
import { atRecord } from 'monocle-ts/lib/At/Record'
import * as NEA from 'fp-ts/lib/NonEmptyArray'
import { Todo as TodoComponent } from './components/Todo'
import { TodoForm } from './components/TodoForm'
import { Title } from './components/Title'
import { EmptyTodos } from './components/EmptyTodos'
import * as random from './random'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import uuid from 'uuid'
import { LoadingTodos } from 'components/LoadingTodos'

const Todo = t.interface(
  {
    id: t.string,
    text: t.string,
    isDone: t.boolean
  },
  'Todo'
)
type Todo = t.TypeOf<typeof Todo>

interface Model {
  seed: number
  input: string
  todos: O.Option<Record<string, Todo>>
}

const Action = Union({
  UpdateText: of<string>(),
  Add: of(null),
  ToggleDone: of<string>(),
  Load: of<E.Either<localStorage.LocalStorageError, O.Option<Record<string, Todo>>>>(),
  Remove: of<string>()
})
type Action = typeof Action.T

const entity = localStorage.entity('todos', t.record(t.string, Todo))

const load = localStorage.load(entity, Action.Load)
const save = localStorage.save(entity)

const inputLens = Lens.fromProp<Model>()('input')
const seedLens = Lens.fromProp<Model>()('seed')
const todosLens = Lens.fromProp<Model>()('todos')
const todosOptional = todosLens.composePrism(Prism.some())
const todoById = (id: string) => todosOptional.composeLens(atRecord<Todo>().at(id)).composePrism(Prism.some())

interface Flags {
  seed: number
}

const init = (flags: Flags): [Model, cmd.Cmd<Action>] => [
  {
    seed: random.seed(flags.seed),
    input: '',
    todos: O.none
  },
  load
]

const update = (action: Action, model: Model): [Model, cmd.Cmd<Action>] =>
  Action.match(action, {
    Add: () => {
      const id = uuid.v1({ msecs: model.seed })
      const updatedModel = pipe(
        model,
        inputLens.set(''),
        seedLens.modify(random.next),
        todosOptional.modify(
          R.insertAt(id, {
            id,
            text: model.input,
            isDone: false
          } as Todo)
        )
      )
      return [
        updatedModel,
        pipe(
          updatedModel.todos,
          O.fold(() => cmd.none, save)
        )
      ]
    },
    Load: E.fold(
      () => [model, cmd.none],
      O.fold(
        () => [
          pipe(
            model,
            todosLens.set(O.some({}))
          ),
          cmd.none
        ],
        todos => [
          pipe(
            model,
            todosLens.set(O.some(todos))
          ),
          cmd.none
        ]
      )
    ),
    Remove: id => {
      const updatedModel = pipe(
        model,
        todosOptional.modify(R.deleteAt(id))
      )
      return [
        updatedModel,
        pipe(
          updatedModel.todos,
          O.fold(() => cmd.none, save)
        )
      ]
    },
    UpdateText: input => [
      pipe(
        model,
        inputLens.set(input)
      ),
      cmd.none
    ],
    ToggleDone: id => {
      const updatedModel = pipe(
        model,
        todoById(id).modify(todo => ({ ...todo, isDone: !todo.isDone }))
      )
      return [
        updatedModel,
        pipe(
          updatedModel.todos,
          O.fold(() => cmd.none, save)
        )
      ]
    }
  })

const view = (model: Model) => {
  const todos = pipe(
    model.todos,
    O.map(todos => NEA.fromArray(Object.values(todos)))
  )
  return (dispatch: platform.Dispatch<Action>) => (
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
        {pipe(
          todos,
          O.fold(
            () => <LoadingTodos />,
            O.fold(
              () => <EmptyTodos />,
              todos => (
                <>
                  {todos.map(todo => (
                    <TodoComponent
                      key={todo.id}
                      {...todo}
                      onRemove={() => dispatch(Action.Remove(todo.id))}
                      onToggle={() => dispatch(Action.ToggleDone(todo.id))}
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
    seed: Date.now()
  }),
  dom => {
    ReactDOM.render(dom, document.getElementById('app'))
  }
)
