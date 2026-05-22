# E2E Test Infra: Wonderful Faraday Playbook & Dashboard

## Test Philosophy
- **Opaque-box, requirement-driven:** We exercise the product exactly as an end-user or agent framework would, validating Markdown content and dashboard file semantics.
- **Methodology:** Category-Partition + Boundary Value Analysis (BVA) + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|---------------------|:------:|:------:|:------:|:------:|
| 1 | Playbook Simplification | ORIGINAL_REQUEST R1.1 | 5 | 5 | ✓ | ✓ |
| 2 | Playbook IDE Setup Guides | ORIGINAL_REQUEST R1.2 | 5 | 5 | ✓ | ✓ |
| 3 | Dashboard "IDE Setup & Guides" | ORIGINAL_REQUEST R2.1 | 5 | 5 | ✓ | ✓ |
| 4 | Sidebar Navigation & Sync | ORIGINAL_REQUEST R2.2 & app.js | 5 | 5 | ✓ | ✓ |
| 5 | Agent Skills Hub Toggles | ORIGINAL_REQUEST app.js R2.2 | 5 | 5 | ✓ | ✓ |
| 6 | Prompt Synthesizer & Clipboard | ORIGINAL_REQUEST app.js R2.3 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Test Runner:** Custom Node.js runner `e2e_test_runner.js`. Invoked via `node e2e_test_runner.js`.
- **Pass/Fail Semantics:** Exits with code `0` if all tests pass; exits with non-zero code and logs error details otherwise.
- **Test Case Format:** Modular, programmatic test suites checking file structures, parsing Markdown tables/fenced blocks, inspecting HTML elements/ids, and validating JavaScript syntax and logic flows.

## Coverage Thresholds
- **Tier 1 - Feature Coverage:** ≥30 test cases (5 per feature verifying happy path and exact requirements).
- **Tier 2 - Boundary & Corner Cases:** ≥30 test cases (5 per feature testing missing inputs, empty values, invalid targets, and formatting edge cases).
- **Tier 3 - Cross-Feature Combinations:** ≥6 test cases (verifying feature interactions, e.g. selecting prompt goals dynamically changes the active tab/guide, navigation updates sync correctly).
- **Tier 4 - Real-World Application Scenarios:** ≥5 realistic end-to-end workload paths (e.g. full developer onboarding from playbook reading, configuring local IDEs, selecting specific goals in the synthesizer, copying to clipboard).
