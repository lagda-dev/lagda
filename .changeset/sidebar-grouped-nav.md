---
"@lagda/ui": minor
---

Add grouped navigation to `Sidebar`. A new optional `groups` prop renders labelled sections (each a
mono uppercase heading over its items) for the design's dashboard navigation; the flat `items` API still
works unchanged. Items without an icon now show a small dot bullet, and the sidebar surface uses the
`subtle` token. Adds a `Grouped` Storybook story as the Argos baseline.
