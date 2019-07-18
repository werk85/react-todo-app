import * as TE from 'fp-ts/lib/TaskEither'
import * as t from 'io-ts'
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'
import { unionize, ofType, UnionOf } from 'unionize'
import { pipe } from 'fp-ts/lib/pipeable'

const traverseOE = O.option.traverse(E.either)

export const LocalStorageError = unionize({
  ParseError: ofType<{ error: Error }>(),
  StorageError: ofType<{ error: Error }>(),
  ValidationErrors: ofType<{ errors: t.Errors }>()
})
export type LocalStorageError = UnionOf<typeof LocalStorageError>

const parseError = (err: unknown) => LocalStorageError.ParseError({ error: E.toError(err) })
const storageError = (err: unknown) => LocalStorageError.StorageError({ error: E.toError(err) })

export interface LocalStorageEntity<A, O> {
  key: string
  type: t.Type<A, O>
}

export const entity = <A, O>(key: string, type: t.Type<A, O>): LocalStorageEntity<A, O> => ({
  key,
  type
})

export const get = <A, O>(entity: LocalStorageEntity<A, O>): TE.TaskEither<LocalStorageError, O.Option<A>> =>
  TE.fromEither(
    pipe(
      E.tryCatch(() => O.fromNullable(localStorage.getItem(entity.key)), storageError),
      E.chain(json => traverseOE(json, json => E.parseJSON(json, parseError))),
      E.chain(value =>
        traverseOE(value, value =>
          pipe(
            entity.type.decode(value),
            E.mapLeft(errors => LocalStorageError.ValidationErrors({ errors }))
          )
        )
      )
    )
  )

export const set = <A, O>(entity: LocalStorageEntity<A, O>) => (value: A): TE.TaskEither<LocalStorageError, void> =>
  TE.tryCatch(async () => localStorage.setItem(entity.key, JSON.stringify(entity.type.encode(value))), storageError)

export const remove = <A, O>(entity: LocalStorageEntity<A, O>): TE.TaskEither<LocalStorageError, void> =>
  TE.tryCatch(async () => localStorage.removeItem(entity.key), storageError)
