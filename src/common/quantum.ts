import * as O from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/pipeable'
import { createBrowserHistory, Location as HistoryLocation } from 'history'
import { ReactElement } from 'react'
import { BehaviorSubject, empty, merge, Observable, of, Subject } from 'rxjs'
import { distinctUntilChanged, map, mergeAll, share, startWith, switchMap } from 'rxjs/operators'
import { Monoid } from 'fp-ts/lib/Monoid'
import * as T from 'fp-ts/lib/Task'

const history = createBrowserHistory()

export type Location = HistoryLocation

const location$ = new Subject<Location>()

history.listen(location => {
  location$.next(location)
})

export type Cmd<Action> = Observable<T.Task<O.Option<Action>>>
export const none: Cmd<never> = empty()
export const cmdOf = <Action>(a: Action): Cmd<Action> => of(T.of(O.some(a)))
export const getCmdMonoid = <A>(): Monoid<Cmd<A>> => ({
  concat: (x, y) => merge(x, y),
  empty: none
})
export const cmdMap = <A, B>(ma: Cmd<A>, f: (a: A) => B): Cmd<B> =>
  pipe(
    ma,
    map(T.map(O.map(f)))
  )

export function push<Action>(url: string, state?: unknown): Cmd<Action> {
  return of(async () => {
    history.push(url, state)
    return O.none
  })
}

export type Dispatch<Action> = (action: Action) => void

export type Html<Action> = (dispatch: Dispatch<Action>) => ReactElement<unknown>

export interface Program<Model, Action> {
  dispatch: Dispatch<Action>
  cmd$: Cmd<Action>
  html$: Observable<Html<Action>>
  model$: Observable<Model>
  sub$: Observable<Action>
}

export function program<Model, Action>(
  locationToAction: (location: Location) => Action,
  init: (location: Location) => [Model, Cmd<Action>],
  reducer: (action: Action, model: Model) => [Model, Cmd<Action>],
  view: (model: Model) => Html<Action>,
  subscriptions: (model: Model) => Observable<Action> = () => empty()
): Program<Model, Action> {
  const state = init(history.location)
  const state$ = new BehaviorSubject<[Model, Cmd<Action>]>(state)

  const dispatch: Dispatch<Action> = action => {
    const state = reducer(action, state$.value[0])
    console.log({ action, model: state[0], cmd: state[1] })
    state$.next(state)
  }

  const model$ = pipe(
    state$,
    map(state => state[0]),
    distinctUntilChanged(),
    share()
  )

  const cmd$ = pipe(
    state$,
    map(state => state[1]),
    mergeAll()
  )

  const onChangeLocation$ = pipe(
    location$,
    map(locationToAction)
  )

  const subscriptionsWithLocationChanges = (model: Model) => merge(onChangeLocation$, subscriptions(model))

  const sub$ = pipe(
    model$,
    startWith(state[0]),
    switchMap(subscriptionsWithLocationChanges)
  )

  const html$ = pipe(
    model$,
    map(view)
  )

  return { cmd$, dispatch, model$, html$, sub$ }
}

export function run<Model, Action>(
  program: Program<Model, Action>,
  renderer: (dom: ReactElement<unknown>) => void
): Observable<Model> {
  const { dispatch, cmd$, html$, model$, sub$ } = program
  html$.subscribe(html => renderer(html(dispatch)))
  sub$.subscribe(dispatch)
  cmd$.subscribe(cmd => cmd().then(O.map(dispatch)))
  return model$
}
