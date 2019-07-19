import * as E from 'fp-ts/es6/Either'
import { pipe } from 'fp-ts/es6/pipeable'
import * as TE from 'fp-ts/es6/TaskEither'
import * as t from 'io-ts'
import { ofType, unionize, UnionOf } from 'unionize'

export const HttpErrorResponse = unionize({
  UnknownError: ofType<{ error: Error }>(),
  ValidationErrors: ofType<{ value: unknown; errors: t.Errors }>()
})
export type HttpErrorResponse = UnionOf<typeof HttpErrorResponse>

const unknownError = (error: unknown): HttpErrorResponse => HttpErrorResponse.UnknownError({ error: E.toError(error) })

export interface Response<O> {
  ok: boolean
  status: number
  body: O
}

export interface Request<A> {
  url: string
  headers?: Record<string, string>
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: A
}

export const request = <A, O>(req: Request<A>, decoder: t.Decoder<unknown, O>): TE.TaskEither<HttpErrorResponse, Response<O>> =>
  pipe(
    TE.tryCatch(
      () =>
        fetch(req.url, {
          ...req,
          body: typeof req.body !== 'undefined' ? JSON.stringify(req.body) : undefined
        }),
      unknownError
    ),
    TE.chain(response =>
      pipe(
        TE.tryCatch(() => response.json(), unknownError),
        TE.chain(json =>
          TE.fromEither(
            pipe(
              decoder.decode(json),
              E.mapLeft(errors => HttpErrorResponse.ValidationErrors({ value: json, errors }))
            )
          )
        ),
        TE.map(body => ({
          ok: response.ok,
          status: response.status,
          body
        }))
      )
    )
  )

export const get = <A, O>(req: Request<A>, type: t.Type<O, unknown>): TE.TaskEither<HttpErrorResponse, Response<O>> =>
  request(
    {
      ...req,
      method: 'GET',
      headers: {
        ...req.headers,
        'Content-Type': 'application/json'
      }
    },
    type
  )

export const post = <A, O>(req: Request<A>, type: t.Type<O, unknown>): TE.TaskEither<HttpErrorResponse, Response<O>> =>
  request(
    {
      ...req,
      method: 'POST',
      headers: {
        ...req.headers,
        'Content-Type': 'application/json'
      }
    },
    type
  )
