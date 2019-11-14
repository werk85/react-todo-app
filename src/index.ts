import { html, http } from 'effe-ts'
import { app } from './App'
import * as ReactDOM from 'react-dom'

html.run(
  app,
  dom => {
    ReactDOM.render(dom, document.getElementById('app'))
  },
  {
    http: http.fetch,
    seed: Date.now() * Math.random()
  }
)
