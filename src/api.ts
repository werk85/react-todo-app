import { Union, of } from 'ts-union'
import * as t from 'io-ts'
import { cmd, http } from 'effe-ts'
import { withFallback } from 'io-ts-types/lib/withFallback'
import { Observable, Subject, BehaviorSubject, empty, from } from 'rxjs'
import { fromFetch } from 'rxjs/fetch'
import * as E from 'fp-ts/lib/Either'
import * as rx from 'rxjs/operators'
import { pipe } from 'fp-ts/lib/pipeable'

export const Todo = t.interface(
  {
    _id: t.string,
    text: t.string,
    isDone: t.boolean,
    isFav: withFallback(t.boolean, false)
  },
  'Todo'
)
export type Todo = t.TypeOf<typeof Todo>

export const Document = <A, O>(Doc: t.Type<A, O>) =>
  t.intersection([
    t.interface({
      _rev: t.string
    }),
    Doc
  ])
export type Document<D> = D & { _rev: string }

export const AllDocsResponse = <A, O>(Doc: t.Type<A, O>) =>
  t.interface(
    {
      total_rows: t.Int,
      offset: t.Int,
      rows: t.array(
        t.interface({
          id: t.string,
          key: t.string,
          doc: Document(Doc),
          value: t.interface({
            rev: t.string
          })
        })
      )
    },
    'AllDocsResponse'
  )
export interface AllDocsResponse<D> {
  total_rows: t.Int
  offset: t.Int
  rows: {
    id: string
    key: string
    doc: Document<D>
    value: {
      rev: string
    }
  }[]
}

export const Response = t.interface(
  {
    ok: t.boolean,
    id: t.string,
    rev: t.string
  },
  'Response'
)
export type Response = t.TypeOf<typeof Response>

export const Change = <A, O>(Doc: t.Type<A, O>) =>
  t.interface({
    changes: t.array(t.interface({ rev: t.string })),
    doc: t.union([
      t.interface({
        _id: t.string,
        _rev: t.string,
        _deleted: t.literal(true)
      }),
      Document(Doc)
    ]),
    id: t.string,
    seq: t.Int
  })
export interface Change<D> {
  changes: { rev: string }[]
  doc: { _id: string; _rev: string; _deleted: true } | Document<D>
  id: string
  seq: t.Int
}

export const Action = Union({
  Add: of<Todo, http.HttpResponseEither<Response>>(),
  Change: of<E.Either<t.Errors, Change<Todo>>>(),
  Load: of<http.HttpResponseEither<AllDocsResponse<Todo>>>(),
  Remove: of<Todo, http.HttpResponseEither<Response>>(),
  Update: of<Todo, http.HttpResponseEither<Response>>()
})
export type Action = typeof Action.T

export const load: cmd.Cmd<Action> = http.send(http.get('/todos/_all_docs?include_docs=true', AllDocsResponse(Todo)), Action.Load)
export const add = (todo: Todo) =>
  http.send(http.put(`/todos/${todo._id}`, Todo.encode(todo), Response), response => Action.Add(todo, response))
export const remove = (todo: Document<Todo>) =>
  http.send(http.del(`/todos/${todo._id}?_rev=${todo._rev}`, Response), response => Action.Remove(todo, response))
export const update = (todo: Document<Todo>) =>
  http.send(http.put(`/todos/${todo._id}?rev=${todo._rev}`, Document(Todo).encode(todo), Response), response =>
    Action.Update(todo, response)
  )

const changes$ = new Subject<Action>()
const lastSeq$ = new BehaviorSubject<string | t.Int>('now')
const isRunning$ = new BehaviorSubject(false)

const poll$: Observable<void> = pipe(
  fromFetch(`/todos/_changes?feed=longpoll&include_docs=true&since=${lastSeq$.value}`),
  rx.switchMap(response => from(response.json())),
  rx.tap(body => {
    body.results.forEach((result: unknown) => changes$.next(Action.Change(Change(Todo).decode(result))))
    lastSeq$.next(body.last_seq)
  }),
  rx.switchMap(() => poll$)
)

pipe(
  isRunning$,
  rx.distinctUntilChanged(),
  rx.switchMap(isRunning => (isRunning ? poll$ : empty()))
).subscribe()

export const changes = {
  start: (): Observable<Action> => {
    isRunning$.next(true)
    return changes$
  },
  stop: (): Observable<Action> => {
    isRunning$.next(false)
    return empty()
  }
}
