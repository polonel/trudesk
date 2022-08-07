import { createContext } from 'react'

const memory = { title: 'Trudesk &middot; ' }

export const setTitle = title => {
  memory.title = title
  return memory.title
}

const TitleContext = createContext({
  title: memory.title,
  setTitle: () => {}
})

export default TitleContext
