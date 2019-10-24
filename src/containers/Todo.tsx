import { Union, of } from 'ts-union'
import { cmdr, platform, stater } from 'effe-ts'
import { not, identity } from 'fp-ts/lib/function'
import { pipe } from 'fp-ts/lib/pipeable'
import { Lens, Optional } from 'monocle-ts'
import * as O from 'fp-ts/lib/Option'
import { Todo } from '../components/Todo'
import * as api from '../api'
import { TodoEdit } from '../components/TodoEdit'
import * as React from 'react'

export interface Todo extends api.Document<api.Todo> {}

export const Model = Union({
  Editing: of<Todo, string>(),
  None: of<Todo>()
})
export type Model = typeof Model.T

export const todoLens = new Lens<Model, Todo>(
  model =>
    Model.match(model, {
      Editing: todo => todo,
      None: todo => todo
    }),
  todo => model =>
    Model.match(model, {
      Editing: (_, text) => Model.Editing(todo, text),
      None: () => Model.None(todo)
    })
)
export const isDoneLens = todoLens.composeLens(Lens.fromProp<Todo>()('isDone'))
export const isFavLens = todoLens.composeLens(Lens.fromProp<Todo>()('isFav'))
export const idLens = todoLens.composeLens(Lens.fromProp<Todo>()('_id'))
export const revLens = todoLens.composeLens(Lens.fromProp<Todo>()('_rev'))
export const textLens = todoLens.composeLens(Lens.fromProp<Todo>()('text'))
export const editingTextOptional = new Optional<Model, string>(
  model =>
    Model.match(model, {
      Editing: (_, text) => O.some(text),
      default: () => O.none
    }),
  text => model =>
    Model.match(model, {
      Editing: todo => Model.Editing(todo, text),
      default: () => model
    })
)

export const Action = Union({
  Api: of<api.Action>(),
  Cancel: of(),
  Edit: of(),
  Save: of(),
  ToggleDone: of(),
  ToggleFav: of(),
  Remove: of(),
  UpdateText: of<string>()
})
export type Action = typeof Action.T

export interface TodoEnv extends api.ApiEnv {}

export function init(todo: api.Document<api.Todo>): stater.StateR<TodoEnv, Model, Action> {
  return stater.of(Model.None(todo))
}

export function update(action: Action, model: Model): stater.StateR<TodoEnv, Model, Action> {
  return Model.match(model, {
    Editing: (todo, text) =>
      Action.match(action, {
        Cancel: () => stater.of(Model.None(todo)),
        Save: () => [
          Model.None({ ...todo, text }),
          pipe(
            api.update({ ...todo, text }),
            cmdr.map(Action.Api)
          )
        ],
        UpdateText: text => [
          pipe(
            model,
            editingTextOptional.set(text)
          ),
          cmdr.none
        ],
        default: () => stater.of(model)
      }),
    None: todo =>
      Action.match(action, {
        Api: action =>
          api.Action.match(action, {
            Change: change =>
              pipe(
                change,
                O.fromEither,
                O.filter(change => change.doc._id === todo._id),
                O.fold(
                  () => stater.of(model),
                  ({ doc }) =>
                    stater.of(
                      pipe(
                        model,
                        revLens.set(doc._rev)
                      )
                    )
                )
              ),
            Update: (_, response) =>
              stater.of(
                pipe(
                  response,
                  O.fromEither,
                  O.filter(response => response.body.id === todo._id),
                  O.fold(
                    () => model,
                    response =>
                      pipe(
                        model,
                        revLens.set(response.body.rev)
                      )
                  )
                )
              ),
            default: () => stater.of(model)
          }),
        Edit: () => stater.of(Model.Editing(todo, todo.text)),
        Remove: () => [
          model,
          pipe(
            api.remove(todo),
            cmdr.map(Action.Api)
          )
        ],
        ToggleDone: () => {
          const updated = pipe(
            model,
            isDoneLens.modify(not(identity))
          )
          return [
            updated,
            Model.match(updated, {
              None: todo =>
                pipe(
                  api.update(todo),
                  cmdr.map(Action.Api)
                ),
              default: () => cmdr.none
            })
          ]
        },
        ToggleFav: () => {
          const updated = pipe(
            model,
            isFavLens.modify(not(identity))
          )
          return [
            updated,
            Model.match(updated, {
              None: todo =>
                pipe(
                  api.update(todo),
                  cmdr.map(Action.Api)
                ),
              default: () => cmdr.none
            })
          ]
        },
        default: () => stater.of(model)
      })
  })
}

export const view = (model: Model) => (dispatch: platform.Dispatch<Action>) =>
  Model.match(model, {
    Editing: (todo, text) => (
      <TodoEdit
        key={todo._id}
        text={text}
        onCancel={() => dispatch(Action.Cancel())}
        onChange={event => dispatch(Action.UpdateText(event.target.value))}
        onSave={() => dispatch(Action.Save())}
      />
    ),
    None: todo => (
      <Todo
        key={todo._id}
        {...todo}
        onEdit={() => dispatch(Action.Edit())}
        onRemove={() => dispatch(Action.Remove())}
        onToggleDone={() => dispatch(Action.ToggleDone())}
        onToggleFav={() => dispatch(Action.ToggleFav())}
      />
    )
  })
