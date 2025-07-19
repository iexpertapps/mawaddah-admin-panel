import { RouterProvider } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { router } from './components/router/routes'

function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App 