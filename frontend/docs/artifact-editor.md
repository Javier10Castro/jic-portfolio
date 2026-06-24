# Artifact Editor

The BaseEditor pattern provides a consistent editing experience for all artifact types.

## BaseEditor

All editors (`BlueprintEditor`, `ContextEditor`, `ContentEditor`, `CodeEditor`, `SeoEditor`, `MetadataEditor`) delegate to `BaseEditor`.

### Capabilities

| Action | Description |
|--------|-------------|
| **Edit** | Toggle between read-only `<pre>` view and editable `<textarea>` |
| **Save** | Creates a new version, updates artifact content, clears dirty flag |
| **Reset** | Reverts content to last saved version |
| **Regenerate** | Requests AI to regenerate the artifact (simulated with console logging) |
| **Copy** | Copies content to clipboard |
| **Compare** | Opens DiffViewer for version comparison |
| **Approve/Reject** | Sets artifact approval status |

### Editor State

The workspace store tracks:
- `activeArtifact` — Currently selected artifact type
- `activeFile` — Currently selected file path
- `isEditing` — Whether in edit mode
- `isDirty` — Whether content has unsaved changes
- `content` — Current editor content
- `originalContent` — Last saved content

### Approval Badges

Each artifact displays its approval status:
- **Draft** — Gray badge, not yet reviewed
- **Needs Review** — Yellow badge, ready for review
- **Approved** — Green badge, ready for deployment
- **Rejected** — Red badge, needs revision

### Deployment Gate

Deployment is only allowed when all required artifacts (all types except metadata) are approved. Checked via `useWorkspaceStore.getState().areRequiredArtifactsApproved()`.
