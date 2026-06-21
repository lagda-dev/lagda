import { Button } from "@lagda/ui"
import { APP_SIGNUP_URL, GITHUB_REPO_URL } from "../constants"

// Closing call to action before the footer.
export const FinalCta = () => (
  <section className="border-t border-border bg-subtle">
    <div className="mx-auto max-w-[760px] px-7 py-[88px] text-center">
      <h2 className="m-0 text-[40px] font-semibold tracking-[-0.03em] text-foreground">Take control of your signatures.</h2>
      <p className="mx-auto mt-4 max-w-[480px] text-base leading-[1.6] text-muted-foreground">
        Deploy Lagda in minutes and put every mailbox on-brand — without handing your directory to a third party.
      </p>
      <div className="mt-[30px] flex justify-center gap-3">
        <Button asChild size="lg" className="h-11 px-[22px] text-sm font-semibold">
          <a href={APP_SIGNUP_URL}>Get started</a>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11 border-border-strong px-[18px] text-sm">
          <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
            Read the docs
          </a>
        </Button>
      </div>
    </div>
  </section>
)
