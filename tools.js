export function defineTool(tool) {
  return tool
}

export function getToolDefinitions(tools = []) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description ?? "",
    parameters: tool.parameters ?? {
      type: "object",
      properties: {},
    },
  }))
}

export async function executeToolCall({ call, tools = [], workspace, permissions = {} }) {
  const tool = tools.find((candidate) => candidate.name === call.name)

  if (!tool) {
    throw new Error(`Unknown tool "${call.name}"`)
  }

  if (resolvePermission({ call, permissions, tool }) === "deny") {
    throw new Error(`Permission denied for tool "${tool.name}"`)
  }

  const args = parseToolArguments(call.arguments)
  const nextArgs = tool.validate ? tool.validate(args) : args

  if (nextArgs === false) {
    throw new Error(`Invalid arguments for tool "${tool.name}"`)
  }

  return tool.execute(nextArgs ?? args, {
    call,
    tool,
    workspace,
  })
}

export function createWorkspaceTools() {
  return [
    defineTool({
      name: "read",
      description: "Read a file from the workspace",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
        },
        required: ["path"],
      },
      execute: (args, { workspace }) => workspace.read(args.path),
    }),
    defineTool({
      name: "write",
      description: "Write a file in the workspace",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
        },
        required: ["path", "content"],
      },
      execute: (args, { workspace }) => workspace.write(args.path, args.content),
    }),
    defineTool({
      name: "edit",
      description: "Replace text in an existing workspace file",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          search: { type: "string" },
          replace: { type: "string" },
        },
        required: ["path", "search", "replace"],
      },
      execute: (args, { workspace }) => workspace.edit(args.path, args.search, args.replace),
    }),
    defineTool({
      name: "list",
      description: "List files in the workspace",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
        },
      },
      execute: (args, { workspace }) => workspace.list(args.path),
    }),
    defineTool({
      name: "search",
      description: "Search workspace files for text",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
      execute: (args, { workspace }) => workspace.search(args.query),
    }),
  ]
}

function parseToolArguments(input) {
  if (typeof input === "string") {
    return JSON.parse(input)
  }

  return input ?? {}
}

function resolvePermission({ call, permissions, tool }) {
  if (typeof permissions === "function") {
    return permissions({ call, tool })
  }

  return permissions[tool.name] ?? permissions.default ?? "allow"
}
