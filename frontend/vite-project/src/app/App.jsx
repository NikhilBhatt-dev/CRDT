import './App.css'
import { Editor } from '@monaco-editor/react'
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from 'react'
import * as Y from 'yjs'
import { SocketIOProvider } from "y-socket.io"

function App() {

  const editorRef = useRef(null)
  const providerRef = useRef(null)
  const [providerReady, setProviderReady] = useState(false)

  const [username, setUsername] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get("username") || ""
  })

  const [users, setUsers] = useState([])
  const socketServerUrl = window.location.port === '3000'
    ? window.location.origin
    : 'http://localhost:3000'

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])

  const handleMount = (editor) => {
    editorRef.current = editor

    providerRef.current = new SocketIOProvider(
      socketServerUrl,
      'monaco',
      ydoc,
      { autoConnect: true }
    )

    new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      providerRef.current.awareness
    )

    setProviderReady(true)
  }

  const handleJoin = (e) => {
    e.preventDefault()
    const name = e.target.username.value
    setUsername(name)
    window.history.pushState({}, "", "?username=" + name)
  }

  useEffect(() => {
    if (!username || !providerReady || !providerRef.current) return

    const provider = providerRef.current

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values())

      setUsers(
        states
          .map(state => state.user)
          .filter(u => u?.username)
      )
    }

    const syncAwareness = () => {
      provider.awareness.setLocalStateField('user', { username })
      updateUsers()
    }

    provider.awareness.on("change", updateUsers)
    provider.on("sync", syncAwareness)
    syncAwareness()

    const handleBeforeUnload = () => {
      provider.awareness.setLocalStateField('user', null)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      provider.awareness.off("change", updateUsers)
      provider.off("sync", syncAwareness)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }

  }, [username, providerReady])

  if (!username) {
    return (
      <main className="h-screen w-full bg-gray-900 flex items-center justify-center p-4">
        <form onSubmit={handleJoin} className='flex flex-col items-center gap-4 w-full max-w-sm'>
          <input
            type="text"
            placeholder='enter your name'
            className='w-full p-2 rounded-lg bg-gray-800 text-white'
            name='username'
          />
          <button className='w-full p-2 rounded-lg bg-amber-50 text-gray-950 font-bold'>
            join
          </button>
        </form>
      </main>
    )
  }

  return (
    <main className="h-screen w-full bg-gray-900 flex gap-4 p-4">
      <aside className='h-full w-1/4 bg-amber-50 rounded-lg p-2'>
      <h2 className="text-2xl font-bold mb-4">Users</h2>

      <ul className='p-4'>
        {users.map((u, i) => (
          <li key={i} className="bg-gray-800 text-white  p-2 rounded mb-2">
            {u.username}
          </li>
        ))}
        </ul>
      </aside>

      <section className='w-3/4 bg-neutral-800 rounded-lg overflow-hidden'>
        <Editor
          height="100%"
          defaultLanguage='javascript'
          defaultValue='//some content'
          theme='vs-dark'
          onMount={handleMount}
        />
      </section>
    </main>
  )
}

export default App
