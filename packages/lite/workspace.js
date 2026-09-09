export function createMemoryWorkspace(initialFiles = {}) {
  const files = new Map(
    Object.entries(initialFiles).map(([path, content]) => [normalizePath(path), String(content)]),
  )

  return {
    capabilities: {
      shell: false,
    },
    async read(path) {
      const normalizedPath = normalizePath(path)

      if (!files.has(normalizedPath)) {
        throw new Error(`File not found: ${normalizedPath}`)
      }

      return files.get(normalizedPath)
    },
    async write(path, content) {
      const normalizedPath = normalizePath(path)
      files.set(normalizedPath, String(content))
      return {
        path: normalizedPath,
        content: files.get(normalizedPath),
      }
    },
    async edit(path, search, replace) {
      const normalizedPath = normalizePath(path)
      const current = await this.read(normalizedPath)

      if (!current.includes(search)) {
        throw new Error(`Search text not found in ${normalizedPath}`)
      }

      const nextContent = current.replace(search, replace)
      files.set(normalizedPath, nextContent)
      return {
        path: normalizedPath,
        content: nextContent,
      }
    },
    async list(path = ".") {
      const normalizedPath = normalizePath(path)
      const prefix = normalizedPath === "." ? "" : `${normalizedPath}/`

      return [...files.keys()]
        .filter((filePath) => filePath.startsWith(prefix))
        .map((filePath) => filePath.slice(prefix.length).split("/")[0])
        .filter((value, index, items) => items.indexOf(value) === index)
        .sort()
    },
    async search(query) {
      return [...files.entries()]
        .flatMap(([path, content]) => {
          const matches = content
            .split("\n")
            .flatMap((line, index) => (line.includes(query) ? [index + 1] : []))

          return matches.length
            ? [
                {
                  path,
                  matches,
                },
              ]
            : []
        })
        .sort((left, right) => left.path.localeCompare(right.path))
    },
    async snapshot() {
      return Object.fromEntries([...files.entries()].sort(([left], [right]) => left.localeCompare(right)))
    },
  }
}

function normalizePath(path = ".") {
  const trimmed = String(path).trim().replace(/^\.?\//, "").replace(/\/+/g, "/").replace(/\/$/, "")
  return trimmed || "."
}
