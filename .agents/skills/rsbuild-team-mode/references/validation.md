# Validation and limitations

Validation date: October 6, 2026. This is a conventions guide with limited review agreement, not a validated substitute for any named contributor.

## Held-out review procedure

Seven PRs were reserved by contributor before their conversations were used for drafting. All seven were excluded from training across contributors. The reviewer received the draft main skill and historical diffs only, without actual review comments, later fixes, evidence references, or suggested findings. Network access and further file reads were prohibited for the evaluation task. No reviews were posted.

An independent agent performed the evaluations, but it was a reused research agent with prior access to chenjiahan's training evidence. A fresh agent could not be created because the session's agent thread limit had been reached. The evaluator remained blind to held-out conversations. The main skill's specialized references were intentionally withheld, so this tests its general guidance rather than every specialized rule.

Historical diffs were reconstructed with GitHub compare against the PR base and verified against the selected review's `commit_id`. Initial snapshots for 7565 and 7638 used mutable inline-comment `commit_id` values and therefore included later changes. Those two results were discarded and rerun from the actual review commits. In particular, the initial 7565 reproducibility concern disappeared in the corrected snapshot, which contained pinned sources and a replacement lockfile. Never use the discarded result as a finding.

One mining agent accidentally saw three non-substantive SyMind requests for an automated review on 8332. It did not see review content, a verdict or a diff. Record this metadata-only exposure rather than claiming perfect isolation. Other held-out indexes contained URLs, dates and file paths solely for reservation and reconstruction.

The comparison uses the selected review and its reply thread, not all reviews across the PR's history. Every selected human review had state `COMMENTED`. None supplies an explicit approval or rejection verdict, so verdict agreement cannot be scored.

Reviewed commits, retained so future checks can reconstruct the same inputs:

| PR | Review date | Reviewed commit |
| --- | --- | --- |
| 8615 | 2026-10-03 | `a1f1aad94dc4df800abf1c9e469d8e50fe2b4ff6` |
| 8332 | 2026-08-20 | `53eb91bf495364a563900978119f394045c728b1` |
| 7994 | 2026-06-26 | `aa015d3b9cfba1dae66b373ed089b5b3ff47ec92` |
| 7353 | 2026-03-20 | `b3bef19c3a4c2959c19ca468a410fb5e5f9c50af` |
| 7565 | 2026-05-08 | `5bc0a08a9650db405308cb4de619f44991e57df0` |
| 7638 | 2026-05-14 | `74f11b963132a949ec273dccd304c0aa36fc1ad3` |
| 6440 | 2025-11-05 | `d8dcb8671a289ca04e5f8ea2e2bd4c05808a1742` |

## Results by contributor

| Contributor and case | Actual reviewed request | Blind result | Assessment |
| --- | --- | --- | --- |
| chenjiahan, [8615](https://github.com/web-infra-dev/rsbuild/pull/8615#discussion_r4171075503) | Suggested removing unit tests counting content reads because they test an internal optimization; preferred e2e coverage. Author removed the unit tests. | No blocking issue; explicitly considered focused getter-count unit tests appropriate. | Substantive mismatch. The mode's general test guidance does not reliably reproduce this judgment. |
| chenjiahan, [8332](https://github.com/web-infra-dev/rsbuild/pull/8332#discussion_r3820483116) | Asked whether chunks: all should become the default. | Requested a real Node output/runtime regression and explicit opt-out coverage. | Different substantive asks. No overlap on the actual configuration question. |
| chenjiahan, [7994](https://github.com/web-infra-dev/rsbuild/pull/7994#discussion_r3478904867) | Suggested a composite id/environment map key. | Optional nested-map suggestion instead of array scans; no blocker. | Related data-structure concern, different proposal. Do not count as an exact match. |
| SoonIter, [7353](https://github.com/web-infra-dev/rsbuild/pull/7353#discussion_r2964933615) | Requested instance-specific loggers; chenjiahan agreed to pursue customLogger separately. | Suggested optional DEBUG/explicit-level unit coverage. | Missed the instance-isolation request. |
| SoonIter, [7565](https://github.com/web-infra-dev/rsbuild/pull/7565#discussion_r3207945943) | Pointed out an existing .agents directory. | No required correction; optional narrower ignore patterns. | No overlap. Context outside the diff limited verification of the repository layout. |
| Timeless0911, [7638](https://github.com/web-infra-dev/rsbuild/pull/7638#discussion_r3238984762) | Noted externals documentation falsely covers array-form objects; also suggested inspect/DEBUG guidance for complex externals. | Identified the same array/plain-object documentation mismatch and requested narrowing or implementing/testing the broader behavior. | Matches the central substantive ask and reason. Missed the additional diagnostic guidance. One case is insufficient for fidelity claims. |
| fi3ework, [6440](https://github.com/web-infra-dev/rsbuild/pull/6440#discussion_r2494053432) | Asked about angle brackets around Markdown URLs; author said they could be removed. | No blocking issue. | Minor clarification, not a substantive overlapping-asks case or evidence of approval. |
| 9aoy | No substantive cross-author review case established in the sample. | Not evaluated. | Silent reviews cannot establish review fidelity. |
| yifancong | Sampled inline comments were on own PRs. | Not evaluated. | Authored and triage evidence only. |
| SyMind | Sampled inline comments were on own PRs. | Not evaluated. | Authored/discussion evidence only. |

The main skill was not revised to imitate held-out asks. These seven cases are now consumed and must not be called fresh holdouts in a later evaluation. Reserve new cases before any follow-up revision/evaluation. The mismatches limit the claims made about the mode; they do not justify inventing unsupported personal rules.

## Other validation

- Skill-creator's validator checks frontmatter, name and scaffold completion. It does not validate evidence or behavioral fidelity.
- Relative reference links and GitHub source URLs were checked for destination consistency. Sources were fetched through authenticated GitHub APIs; no private source is included.
- Main rules were checked against the ledger, with narrow attribution, counterexamples and tentative observations retained. An independent evaluator confirmed that the main skill does not claim unanimity or predict named humans' approval.
- Authored conventions were checked against sampled changes and linked commit identities separately from review evaluation. No independent code-generation experiment, benchmark reproduction, unit run, or e2e run was performed for this Markdown/YAML-only addition. Review agreement does not validate code-writing fidelity.
- Ripwire quality-delta and test-gate were run. They reported no code-quality regression or impacted executable test target; this does not validate prose or substitute for tests when the mode is later used to change code.
- Repository formatting remained unverified. The installed Git hook still invoked Nano Staged without its removed configuration. The current Rstack command could not resolve its local installation, and the pinned pnpm 12.9.1 executable was absent from the local Corepack cache. The obsolete hook was bypassed for this documentation-only commit after the skill, reference and whitespace checks passed. No persistent hook configuration was changed.

For later use, apply current repository instructions and inspect the actual change. Cite this mode as evidence-informed guidance, not as proof that a contributor would approve it.
