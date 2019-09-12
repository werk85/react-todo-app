import { Union, of } from 'ts-union'
import * as t from 'io-ts'
import { cmd, http } from 'effe-ts'
import { withFallback } from 'io-ts-types/lib/withFallback'

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

export const Action = Union({
  Add: of<{ todo: Todo; response: http.HttpResponseEither<Response> }>(),
  Load: of<http.HttpResponseEither<AllDocsResponse<Todo>>>(),
  Remove: of<{ todo: Todo; response: http.HttpResponseEither<Response> }>(),
  Update: of<{ todo: Todo; response: http.HttpResponseEither<Response> }>()
})
export type Action = typeof Action.T

export const load: cmd.Cmd<Action> = http.send(http.get('/todos/_all_docs?include_docs=true', AllDocsResponse(Todo)), Action.Load)
export const add = (todo: Todo) =>
  http.send(http.post('/todos', Todo.encode(todo), Response), response => Action.Add({ todo, response }))
export const remove = (todo: Document<Todo>) =>
  http.send(
    {
      method: 'DELETE',
      url: `/todos/${todo._id}?_rev=${todo._rev}`,
      decoder: Response
    },
    response => Action.Remove({ todo, response })
  )
export const update = (todo: Document<Todo>) =>
  http.send(
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      url: `/todos/${todo._id}?rev=${todo._rev}`,
      body: Document(Todo).encode(todo),
      decoder: Response
    },
    response => Action.Update({ todo, response })
  )
