---
name: rsbuild-team-mode
description: Apply observed Rsbuild contributor conventions when asked for rsbuild-team-mode or the Rsbuild team's approach to writing or reviewing changes.
---

# Rsbuild team mode

Use this mode for code writing and review in `web-infra-dev/rsbuild`. It draws on public activity by chenjiahan, 9aoy, Timeless0911, SoonIter, yifancong, fi3ework, and SyMind from October 6, 2025 through October 6, 2026. These are observed practices, not statements on their behalf or authority to grant their approval. The roster includes a broad core maintainer and contributors with sustained specialist work, not seven interchangeable reviewers.

Read [scope and roster](references/roster.md) for ownership, coverage, and uncertain candidates. Read [evidence](references/evidence.md) for attribution and exceptions before applying a specialized rule. See [validation](references/validation.md) for evaluation limits. Current repository instructions and the user's task take precedence over this dated evidence.

## Apply the repository's requirements

Read the current `AGENTS.md` and [contribution guide](../../../CONTRIBUTING.md). Use their tool versions, dependency placement, build prerequisites, and test commands. These are repository requirements, not proof of each contributor's personal preference.

For a build or dev behavior change, choose a regression case that exercises the observed failure and relevant configuration variants. Check actual output, runtime behavior, or logs as appropriate. This pattern appears independently in chenjiahan, 9aoy, Timeless0911, yifancong, and SyMind's changes. Do not claim evidence of the same practice for every roster member. See evidence rules T1 and T2.

## Core implementation and review

The following checks primarily reflect chenjiahan's authored work and substantive reviews, not unanimous team preferences.

- Avoid doing optional work before its enabling condition. When skipping a transform, file read, or allocation, verify the values and side effects still needed by that path. See P1.
- Support performance claims with measurements suited to the change. Distinguish bundle size, startup time, build time, and CI duration. Compare repeated runs when timings are noisy; a difference within noise does not justify added complexity. Use the repository's performance profiling skill for substantial profiling. See P2.
- Preserve environment-specific settings and target behavior. For changes shared by browser and Node builds, check both affected targets and explicit overrides. Do not assume every web environment can be paired automatically with a Node environment. See C1.
- Prefer tests through real build/dev APIs for integration behavior. Where dependency resolution prevents reliable e2e isolation, use controlled source-level tests through existing helpers. Avoid adding a production argument solely to inject a test resolver. This is conditional guidance, not a ban on unit tests or mocks. See T1 and T2.
- Check whether an existing rule or helper has the right semantics before extending it. A separate rule is appropriate when reusing a transpilation rule would miss dependency files. Keep API names aligned with the behavior and avoid collisions with Rspack terminology. The naming observation is narrower than a general API design policy. See A1.
- For requests that expand official templates or plugins, consider the maintenance burden and an existing configuration or community extension. Do not infer a permanent ban from an earlier scope decision. See S1.

## Route specialized changes

Routing means consulting the relevant evidence and affected code. It does not authorize contacting these people or requesting their review.

| Area                                                        | Evidence to consult | How to use it                                                                                                                                                              |
| ----------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rstest integration, config loading, SSR debugging           | 9aoy, I1            | Check the consuming tool's context, dependency compatibility, and triggering config before changing shared defaults.                                                       |
| Build tooling, Rslib upgrades, CLI failures, asset emission | Timeless0911, I2    | Verify the affected build or runtime behavior; dependency bumps alone do not prove compatibility.                                                                          |
| Website theme and Rspress integration                       | SoonIter, W1        | Check supported upstream components before retaining a local adapter. Remove a workaround when the upstream capability replaces it, while preserving existing theme hooks. |
| Rsdoctor loading and diagnostics                            | yifancong, D1       | Check core and legacy resolution paths, manual registration, and environment-dependent test isolation. The inspected test strategy evolved through chenjiahan's reviews.   |
| Ecosystem CI, Vue loader, Rstest compatibility              | fi3ework, F1        | Use these changes as integration context. Evidence is too sparse for a distinct personal rule set.                                                                         |
| Server runtime, HMR, source maps                            | SyMind, R1          | Exercise the triggering runtime configuration or platform. Preserve explicit Node options and debugging behavior when changing defaults.                                   |

## Handle exceptions and disagreements

No repeated unresolved disagreement between these contributors was established. Do not fill that gap with an invented consensus. The record does show context-sensitive choices: e2e versus isolated unit coverage, shared versus separate loader rules, and upstream components versus temporary compatibility workarounds. Select by the concrete behavior and explain the tradeoff when evidence does not resolve it.

Report findings with the triggering condition, impact, and a test or other evidence that can distinguish correct behavior. Separate a demonstrated defect from an optional improvement. A silent approval does not establish which checks a reviewer performed. Do not predict that a named contributor would approve a change.
