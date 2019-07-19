import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { unionize, UnionOf, ofType } from 'unionize'
import { contramap, ordBoolean, ordString, max } from 'fp-ts/es6/Ord'
import { sort } from 'fp-ts/es6/Array'
import * as R from 'fp-ts/es6/Record'
import * as O from 'fp-ts/es6/Option'
import { pipe } from 'fp-ts/es6/pipeable'
import { atRecord } from 'monocle-ts/es6/At/Record'
import { Prism, Lens } from 'monocle-ts/es6'
import { getSemigroup, ordNumber } from 'fp-ts/lib/Ord'
import * as E from 'fp-ts/lib/Either'
import { of } from 'rxjs'
import * as TE from 'fp-ts/es6/TaskEither'
import * as T from 'fp-ts/es6/Task'
import * as t from 'io-ts'
import { withFallback } from 'io-ts-types/lib/withFallback'
import { getFirstSemigroup, getJoinSemigroup, fold } from 'fp-ts/es6/Semigroup'
import * as A from 'fp-ts/lib/Array'
import { Title } from './components/Title'
import { TaskForm } from './components/TaskForm'
import { EmptyTask } from './components/EmptyTask'
import { Task as TaskComponent } from './components/Task'
import * as http from './common/http'
import { run, program, Cmd, none, Dispatch } from 'quantum'

const Task = t.interface({
  id: t.number,
  text: t.string,
  isDone: t.boolean,
  isFav: withFallback(t.boolean, false)
})
type Task = t.TypeOf<typeof Task>

const task = (id: number): Task => ({
  id,
  text: '',
  isDone: false,
  isFav: false
})

// Define how tasks should be ordered
const ordTaskText = contramap<string, Task>(task => task.text)(ordString) // Order by text
const ordTaskIsDone = contramap<boolean, Task>(task => task.isDone)(ordBoolean) // Order by isDone
const ordTask = getSemigroup<Task>().concat(ordTaskIsDone, ordTaskText) // Combine both ordering strategies

// Util
const groupTasksBy = R.fromFoldableMap(getFirstSemigroup<Task>(), A.array)
const nextTaskId = (tasks: Record<string, Task>) =>
  fold(getJoinSemigroup(ordNumber))(1, Object.values(tasks).map(task => task.id)) + 1

interface Model {
  current: Task
  tasks: Record<string, Task>
}

// Lenses for the Model
const currentLens = Lens.fromProp<Model>()('current')
const currentTextLens = currentLens.composeLens(Lens.fromProp<Task>()('text'))
const tasksLens = Lens.fromProp<Model>()('tasks')
const taskByIdOptional = (id: number) => tasksLens.composeLens(atRecord<Task>().at(String(id))).composePrism(Prism.some())

const Action = unionize({
  ChangeRoute: {},
  Add: {},
  Edit: ofType<{ task: Task }>(),
  Load: ofType<{ response: E.Either<http.HttpErrorResponse, http.Response<Task[]>> }>(),
  ToggleDone: ofType<{ task: Task }>(),
  ToggleFav: ofType<{ task: Task }>(),
  Remove: ofType<{ task: Task }>(),
  UpdateText: ofType<{ text: string }>()
})
type Action = UnionOf<typeof Action>

const locationToAction = () => Action.ChangeRoute()

const load: Cmd<Action> = of(
  pipe(
    http.get(
      {
        url: require('./tasks.json')
      },
      t.array(Task)
    ),
    T.map(response => O.some(Action.Load({ response })))
  )
)

const init = (): [Model, Cmd<Action>] => [
  {
    current: task(1),
    tasks: {}
  },
  load
]

const isEditing = (model: Model) => O.isSome(R.lookup(String(model.current.id), model.tasks))

const update = (action: Action, model: Model): [Model, Cmd<Action>] => [
  Action.match(action, {
    Add: () => {
      const tasks = pipe(
        model.tasks,
        R.insertAt(String(model.current.id), model.current)
      )
      return {
        current: task(nextTaskId(tasks)),
        tasks
      }
    },
    Edit: ({ task }) => currentLens.set(task)(model),
    Load: ({ response }) =>
      pipe(
        response,
        E.fold(
          () => model,
          response => {
            const tasks = groupTasksBy(response.body, task => [String(task.id), task])
            return {
              current: task(nextTaskId(tasks)),
              tasks
            }
          }
        )
      ),
    ToggleDone: ({ task }) => taskByIdOptional(task.id).modify(task => ({ ...task, isDone: !task.isDone }))(model),
    ToggleFav: ({ task }) => taskByIdOptional(task.id).modify(task => ({ ...task, isFav: !task.isFav }))(model),
    Remove: ({ task }) => tasksLens.modify(R.deleteAt(String(task.id)))(model),
    UpdateText: ({ text }) => currentTextLens.set(text)(model),
    default: () => model
  }),
  none
]

const view = (model: Model) => {
  const tasks = Object.values(model.tasks)
  const done = tasks.filter(task => task.isDone).length
  const total = tasks.length
  const sortedTasks = sort(ordTask)(tasks)

  return (dispatch: Dispatch<Action>) => (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <Title done={done} total={total} />
        </h3>
      </div>
      <div className="card-body">
        <TaskForm
          isEditing={isEditing(model)}
          value={model.current.text}
          onChange={text => dispatch(Action.UpdateText({ text }))}
          onSubmit={() => dispatch(Action.Add())}
        />
      </div>
      <ul className="list-group list-group-flush">
        {total === 0 ? <EmptyTask /> : null}
        {sortedTasks.map(task => (
          <TaskComponent
            key={task.id}
            {...task}
            onEdit={() => dispatch(Action.Edit({ task }))}
            onRemove={() => dispatch(Action.Remove({ task }))}
            onToggleDone={() => dispatch(Action.ToggleDone({ task }))}
            onToggleFav={() => dispatch(Action.ToggleFav({ task }))}
          />
        ))}
      </ul>
    </div>
  )
}

const app = program(locationToAction, init, update, view)

run(app, dom => {
  ReactDOM.render(dom, document.getElementById('app'))
})
