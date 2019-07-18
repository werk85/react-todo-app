import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { unionize, UnionOf, ofType } from 'unionize'
import { contramap, ordBoolean } from 'fp-ts/lib/Ord'
import { sort } from 'fp-ts/lib/Array'
import { Title } from './components/Title'
import { TaskForm } from './components/TaskForm'
import { EmptyTask } from './components/EmptyTask'
import { Task } from './components/Task'
import { run, program, Cmd, none, Dispatch } from 'quantum'

interface Task {
  id: number
  text: string
  isDone: boolean
  isFav: boolean
}

const task = (id: number): Task => ({
  id,
  text: '',
  isDone: false,
  isFav: false
})

const ordTask = contramap<boolean, Task>(task => task.isDone)(ordBoolean)

interface Model {
  nextId: number
  current: Task
  tasks: Task[]
}

const Action = unionize({
  ChangeRoute: {},
  Add: {},
  Edit: ofType<{ task: Task }>(),
  ToggleDone: ofType<{ task: Task }>(),
  ToggleFav: ofType<{ task: Task }>(),
  Remove: ofType<{ task: Task }>(),
  UpdateText: ofType<{ text: string }>()
})
type Action = UnionOf<typeof Action>

const locationToAction = () => Action.ChangeRoute()

const init = (): [Model, Cmd<Action>] => [
  {
    nextId: 2,
    current: task(1),
    tasks: []
  },
  none
]

const isEditing = (model: Model) => model.tasks.some(task => task.id === model.current.id)

const update = (action: Action, model: Model): [Model, Cmd<Action>] => [
  Action.match(action, {
    Add: () => ({
      nextId: model.nextId + 1,
      current: task(model.nextId),
      tasks: isEditing(model)
        ? model.tasks.map(task => (task.id === model.current.id ? model.current : task))
        : model.tasks.concat(model.current)
    }),
    Edit: ({ task }) => ({
      ...model,
      current: task
    }),
    ToggleDone: ({ task }) => ({
      ...model,
      tasks: model.tasks.map(t => (t.id === task.id ? { ...t, isDone: !t.isDone } : t))
    }),
    ToggleFav: ({ task }) => ({
      ...model,
      tasks: model.tasks.map(t => (t.id === task.id ? { ...t, isFav: !t.isFav } : t))
    }),
    Remove: ({ task }) => ({
      ...model,
      tasks: model.tasks.filter(t => t.id !== task.id)
    }),
    UpdateText: ({ text }) => ({
      ...model,
      current: {
        ...model.current,
        text
      }
    }),
    default: () => model
  }),
  none
]

const view = (model: Model) => {
  const done = model.tasks.filter(task => task.isDone).length
  const total = model.tasks.length
  const sortedTasks = sort(ordTask)(model.tasks)

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
          <Task
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
