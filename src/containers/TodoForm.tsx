import { cmdr, platform, stater } from 'effe-ts'
import { Union, of } from 'ts-union'
import { Lens } from 'monocle-ts'
import { pipe } from 'fp-ts/lib/pipeable'
import * as api from '../api'
import { TodoForm } from '../components/TodoForm'
import * as random from '../random'
import uuid from 'uuid'
import * as React from 'react'

export interface Model {
  seed: number
  todo: api.Todo
}

export const seedLens = Lens.fromProp<Model>()('seed')
export const todoLens = Lens.fromProp<Model>()('todo')
export const todoTextLens = todoLens.composeLens(Lens.fromProp<api.Todo>()('text'))

export const Action = Union({
  Add: of(),
  Api: of<api.Action>(),
  UpdateText: of<{ text: string }>()
})
export type Action = typeof Action.T

export const emptyTodo = (seed: number): api.Todo => ({
  _id: uuid.v1({ msecs: seed }),
  text: '',
  isDone: false,
  isFav: false
})

export interface TodoFormEnv extends api.ApiEnv {
  seed: number
}

export const init = (env: TodoFormEnv): stater.StateR<TodoFormEnv, Model, Action> => {
  const seed = random.seed(env.seed)
  return [
    {
      seed,
      todo: emptyTodo(seed)
    },
    cmdr.none
  ]
}

export const update = (action: Action, model: Model): stater.StateR<TodoFormEnv, Model, Action> =>
  Action.match(action, {
    Add: () => [
      pipe(
        model,
        seedLens.modify(random.next),
        todoLens.set(emptyTodo(model.seed))
      ),
      pipe(
        api.add(model.todo),
        cmdr.map(Action.Api)
      )
    ],
    UpdateText: ({ text }) => [
      pipe(
        model,
        todoTextLens.set(text)
      ),
      cmdr.none
    ],
    default: () => [model, cmdr.none]
  })

export const view = (model: Model) => (dispatch: platform.Dispatch<Action>) => (
  <TodoForm
    value={model.todo.text}
    onChange={text => dispatch(Action.UpdateText({ text }))}
    onSubmit={() => dispatch(Action.Add())}
  />
)
