import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  Label,
  PageHeader,
} from "@lagda/ui"
import type { DataTableColumn } from "@lagda/ui"
import { TOKEN_SCOPES } from "@lagda/auth-contract"
import type { FormEvent } from "react"
import { useState } from "react"
import { useApplicationTokensList, useMintApplicationToken, useRevokeApplicationToken } from "../api/resources/applicationTokens"
import type { ApplicationToken } from "../api/resources/applicationTokens"
import { getErrorMessage } from "../lib/getErrorMessage"

// The application-tokens screen (MANAGE_TOKENS: owner/admin). Mint scoped REST-API tokens, see the list,
// revoke. The plaintext secret is shown exactly once after minting and never again. Role gating is UX
// only — the server enforces.

type TokenScope = (typeof TOKEN_SCOPES)[number]

// The generate-token form: a name and the chosen scopes (at least one required to mint).
type TokenDraft = {
  name: string
  scopes: TokenScope[]
}

const emptyDraft: TokenDraft = { name: "", scopes: [] }

export const ApplicationTokensPage = () => {
  const [draft, setDraft] = useState<TokenDraft | null>(null)
  const [mintedSecret, setMintedSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const tokensQuery = useApplicationTokensList()
  const mintToken = useMintApplicationToken()
  const revokeToken = useRevokeApplicationToken()

  const tokens = tokensQuery.data ?? []
  const hasTokens = tokens.length > 0

  const openGenerate = () => {
    setErrorMessage(null)
    setDraft(emptyDraft)
  }

  const closeGenerate = () => setDraft(null)

  // Toggle a scope immutably so switching never mutates the draft in place.
  const toggleScope = (current: TokenDraft, scope: TokenScope): TokenDraft => ({
    ...current,
    scopes: current.scopes.includes(scope) ? current.scopes.filter((value) => value !== scope) : [...current.scopes, scope],
  })

  const submitDraft = async (current: TokenDraft) => {
    setErrorMessage(null)
    try {
      const minted = await mintToken.mutateAsync({ name: current.name, scopes: current.scopes })
      closeGenerate()
      // Surface the plaintext once — the only time the API ever returns it.
      setCopied(false)
      setMintedSecret(minted.token)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (draft !== null) void submitDraft(draft)
  }

  const revoke = async (token: ApplicationToken) => {
    setErrorMessage(null)
    try {
      await revokeToken.mutateAsync(token.id)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  const copySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
    } catch {
      // Clipboard can be unavailable (insecure context); the secret is still visible to copy by hand.
    }
  }

  const tokenColumns: DataTableColumn<ApplicationToken>[] = [
    { header: "Name", cell: (token) => token.name },
    {
      header: "Scopes",
      cell: (token) => (
        <div className="flex flex-wrap gap-1">
          {token.scopes.map((scope) => (
            <Badge key={scope} variant="secondary" className="font-mono text-xs">
              {scope}
            </Badge>
          ))}
        </div>
      ),
    },
    { header: "Created", cell: (token) => new Date(token.createdAt).toLocaleDateString() },
    {
      header: "",
      cell: (token) =>
        token.revokedAt !== null ? (
          <Badge variant="outline">Revoked</Badge>
        ) : (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" disabled={revokeToken.isPending} onClick={() => void revoke(token)}>
              Revoke
            </Button>
          </div>
        ),
    },
  ]

  const canGenerate = draft !== null && draft.name.trim().length > 0 && draft.scopes.length > 0

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <PageHeader title="Application tokens" description="Bearer tokens for the REST API and CI. Scoped, revocable, never shown again after creation." />
        <Button onClick={openGenerate}>Generate token</Button>
      </div>

      <div className="mt-6">
        {tokensQuery.isPending && <p className="text-sm text-muted-foreground">Loading tokens…</p>}

        {tokensQuery.isError && <EmptyState title="Unable to load tokens" description="The application tokens could not be reached. Try again in a moment." />}

        {!tokensQuery.isPending && !tokensQuery.isError && !hasTokens && (
          <EmptyState title="No application tokens yet" description="Generate a token to call the REST API from CI or a script." />
        )}

        {!tokensQuery.isError && hasTokens && <DataTable columns={tokenColumns} rows={tokens} getRowKey={(token) => token.id} />}
      </div>

      {/* Generate dialog */}
      <Dialog open={draft !== null} onOpenChange={(open) => (open ? undefined : closeGenerate())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate token</DialogTitle>
            <DialogDescription>Name the token and choose its scopes. The secret is shown once after creation.</DialogDescription>
          </DialogHeader>
          {draft !== null && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="token-name">Name</Label>
                <Input id="token-name" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Scopes</Label>
                <div className="space-y-2">
                  {TOKEN_SCOPES.map((scope) => (
                    <div key={scope} className="flex items-center gap-2">
                      <Checkbox id={`scope-${scope}`} checked={draft.scopes.includes(scope)} onCheckedChange={() => setDraft(toggleScope(draft, scope))} />
                      <Label htmlFor={`scope-${scope}`} className="font-mono text-xs font-normal">
                        {scope}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {errorMessage !== null && (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage}
                </p>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeGenerate}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!canGenerate || mintToken.isPending}>
                  {mintToken.isPending ? "Generating…" : "Generate"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* One-time secret reveal */}
      <Dialog open={mintedSecret !== null} onOpenChange={(open) => (open ? undefined : setMintedSecret(null))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy your token</DialogTitle>
            <DialogDescription>This is the only time the secret is shown. Store it somewhere safe — you can't see it again.</DialogDescription>
          </DialogHeader>
          {mintedSecret !== null && (
            <div className="space-y-3">
              <code className="block overflow-x-auto rounded-md border border-border bg-subtle p-3 font-mono text-xs">{mintedSecret}</code>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => void copySecret(mintedSecret)}>
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button type="button" onClick={() => setMintedSecret(null)}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
