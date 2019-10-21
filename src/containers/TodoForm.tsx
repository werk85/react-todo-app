import { cmd, platform } from 'effe-ts'
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

export const init = (rand: number): [Model, cmd.Cmd<Action>] => {
  const seed = random.seed(rand)
  return [
    {
      seed,
      todo: emptyTodo(seed)
    },
    cmd.none
  ]
}

export const update = (action: Action, model: Model): [Model, cmd.Cmd<Action>] =>
  Action.match(action, {
    Add: () => [
      pipe(
        model,
        seedLens.modify(random.next),
        todoLens.set(emptyTodo(model.seed))
      ),
      pipe(
        api.add(model.todo),
        cmd.map(Action.Api)
      )
    ],
    UpdateText: ({ text }) => [
      pipe(
        model,
        todoTextLens.set(text)
      ),
      cmd.none
    ],
    default: () => [model, cmd.none]
  })

export const view = (model: Model) => (dispatch: platform.Dispatch<Action>) => (
  <TodoForm
    value={model.todo.text}
    onChange={text => dispatch(Action.UpdateText({ text }))}
    onSubmit={() => dispatch(Action.Add())}
  />
)
