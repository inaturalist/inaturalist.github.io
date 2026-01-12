# iNaturalist Community Taxon Opt-out Demo

This is a lightweight demo app for exploring how **iNaturalist** handles **subspecies identifications** and how they affect an observation's **community taxon**, **observation taxon**, and **quality grade**.

The app pulls in real iNaturalist observations and lets you **simulate** different identification sequences. Nothing is written back to iNaturalist — this is strictly a read-only demo. [Try it here](https://loarie.github.io/subspecies_identifications_demo/)

## What this is for

- Comparing **current** vs. **proposed alternative** approaches to handling subspecies identifications
- Demonstrating how IDs roll up (or don't) to a Community Taxon
- Visualizing how quality grade changes as IDs are added
- Helping people understand proposed changes to ID logic through hands-on experimentation
- Supporting community discussion and gathering feedback via an integrated survey
- Facilitating testing without impacting real observations

## What it does

- Loads observations from iNaturalist (or creates blank demo observations)
- Simulates adding IDs and shows how:
  - Community Taxon
  - Observation Taxon
  - Quality Grade
  would change under current and alternative approaches
- Toggles between **Current** mode (how iNaturalist works today) and **Alternative** mode (proposed approach where observations don't advance to infraspecies until the community taxon itself reaches infraspecies rank)
- Allows users to add demo identifications and votes
- Shows the algorithm summary for how community taxon is calculated
- Includes an integrated tutorial and feedback survey

## What it does *not* do

- Does **not** write anything back to iNaturalist
- Does **not** modify any data on the iNaturalist platform
- Does **not** represent official iNaturalist behavior in all edge cases

## Key Features

- **Interactive examples**: Click pre-configured scenarios to see the differences between modes
- **Tutorial**: Built-in guide explaining how to use the demo
- **Algorithm visualization**: See exactly how the community taxon is calculated
- **Feedback integration**: Vote on your preference directly in the demo
- **URL sharing**: Share specific scenarios via URL parameters

## Status

This is a temporary demo built quickly using [Claude Code](https://code.claude.com/docs/en/overview) to explore ideas and facilitate community discussion. It does not adhere to the engineering standards of the [iNaturalist platform](https://www.inaturalist.org/) or [codebase](https://github.com/inaturalist).

The demo will be live only for as long as it takes to come to a path forward. Once we deploy and QA an update to the main site, we will retire this demo.

Behavior should be treated as illustrative, not authoritative.

## Learn More

Read more about this proposal on the [iNaturalist blog](https://www.inaturalist.org/blog/122781).
