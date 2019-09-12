import { contramap, ordBoolean, ordString, getSemigroup, ordNumber } from 'fp-ts/lib/Ord'
import * as R from 'fp-ts/lib/Record'
import { pipe } from 'fp-ts/lib/pipeable'
import { atRecord } from 'monocle-ts/es6/At/Record'
import { Prism, Lens } from 'monocle-ts/es6'
import * as E from 'fp-ts/lib/Either'
import * as t from 'io-ts'
import { withFallback } from 'io-ts-types/lib/withFallback'
import { getFirstSemigroup, getJoinSemigroup, fold } from 'fp-ts/lib/Semigroup'
import * as A from 'fp-ts/lib/Array'
import { cmd, html, http, platform } from 'effe-ts'
import { Union, of } from 'ts-union'
import { Title } from './components/Title'
import { TodoForm } from './components/TodoForm'
import { EmptyTask } from './components/EmptyTask'
import { Todo as TodoComponent } from './components/Todo'
import * as ReactDOM from 'react-dom'
import * as React from 'react'

const Todo = t.interface(
  {
    id: t.number,
    text: t.string,
    isDone: t.boolean,
    isFav: withFallback(t.boolean, false)
  },
  'Todo'
)
type Todo = t.TypeOf<typeof Todo>

// Function for creating an empty task
const todo = (id: number): Todo => ({
  id,
  text: '',
  isDone: false,
  isFav: false
})

// Define how tasks should be ordered
const ordTodoText = contramap<string, Todo>(todo => todo.text)(ordString) // Order by text
const ordTodoIsDone = contramap<boolean, Todo>(todo => todo.isDone)(ordBoolean) // Order by isDone
const ordTask = getSemigroup<Todo>().concat(ordTodoIsDone, ordTodoText) // Combine both ordering strategies
const sortTodos = A.sort(ordTask)

// Util
const groupTasksBy = R.fromFoldableMap(getFirstSemigroup<Todo>(), A.array)
// Determine the next task id by getting the maximum task id and add one. If empty return 1 as default value
const nextTaskId = (tasks: Record<string, Todo>) =>
  fold(getJoinSemigroup(ordNumber))(1, Object.values(tasks).map(task => task.id)) + 1

// The single state tree used by the application
interface Model {
  current: Todo
  todos: Record<string, Todo>
}

// Lenses for the `Model`
const currentLens = Lens.fromProp<Model>()('current')
const currentTextLens = currentLens.composeLens(Lens.fromProp<Todo>()('text'))
const todosLens = Lens.fromProp<Model>()('todos')
const todoByIdOptional = (id: number) => todosLens.composeLens(atRecord<Todo>().at(String(id))).composePrism(Prism.some())

// All actions that can happen in our application
const Action = Union({
  Add: of(),
  Edit: of<{ todo: Todo }>(),
  Load: of<{ response: http.HttpResponseEither<Todo[]> }>(),
  ToggleDone: of<{ todo: Todo }>(),
  ToggleFav: of<{ todo: Todo }>(),
  Remove: of<{ todo: Todo }>(),
  UpdateText: of<{ text: string }>()
})
type Action = typeof Action.T

// Commands
// Load tasks from json file
const load: cmd.Cmd<Action> = http.send(http.get(require('./tasks.json'), t.array(Todo)), response => Action.Load({ response }))

// Generate the initial state of our application and trigger a command if wanted
const init: [Model, cmd.Cmd<Action>] = [
  {
    current: todo(1),
    todos: {}
  },
  load
]

const update = (action: Action, model: Model): [Model, cmd.Cmd<Action>] =>
  Action.match(action, {
    Add: () => {
      // Add the new task to the existing tasks
      const todos = pipe(
        model.todos,
        R.insertAt(String(model.current.id), model.current)
      )
      // Generate the new current task based on the newly created tasks record to determine the next possible id
      const current = todo(nextTaskId(todos))
      return [
        {
          current,
          todos
        },
        cmd.none
      ]
    },
    Edit: ({ todo }) => [currentLens.set(todo)(model), cmd.none],
    Load: ({ response }) =>
      pipe(
        response,
        E.fold(
          // If the response is an error do nothing by returning the current model
          () => [model, cmd.none],
          // Else evaluate the http response
          response => {
            const todos = groupTasksBy(response.body, todo => [String(todo.id), todo])
            const current = todo(nextTaskId(todos))
            return [
              {
                current,
                todos
              },
              cmd.none
            ]
          }
        )
      ),
    ToggleDone: ({ todo }) => [todoByIdOptional(todo.id).modify(todo => ({ ...todo, isDone: !todo.isDone }))(model), cmd.none],
    ToggleFav: ({ todo }) => [todoByIdOptional(todo.id).modify(todo => ({ ...todo, isFav: !todo.isFav }))(model), cmd.none],
    Remove: ({ todo }) => [todosLens.modify(R.deleteAt(String(todo.id)))(model), cmd.none],
    UpdateText: ({ text }) => [currentTextLens.set(text)(model), cmd.none],
    default: () => [model, cmd.none]
  })

const view = (model: Model) => {
  // Convert todos record to array and sort
  const todos = sortTodos(Object.values(model.todos))
  const done = todos.filter(todo => todo.isDone).length
  const total = todos.length
  // If the current todo id is equal to a todo that already exists in todos we are editing
  const isEditing = R.hasOwnProperty(String(model.current.id), model.todos)

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
            key={todo.id}
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

const app = html.program(init, update, view)

html.run(app, dom => {
  ReactDOM.render(dom, document.getElementById('app'))
})
