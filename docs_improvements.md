# Documentation Categorization Improvements

We have implemented a multi-layered approach to ensure your documentation is always well-structured and categorized.

## 1. AI Prompt Engineering
We updated the core prompt to the AI Architect to strictly forbid:
- Single-category outputs.
- Generic names like "Project Docs" or "General".
- Large, monolithic categories (instructions to split >5 items).

## 2. Low Diversity Detection
We now analyze the AI's raw output before showing it to you.
- **Safety Check**: We calculate the number of unique categories.
- **Trigger**: If the AI returns fewer than 2 distinct categories, we flag the result as "Low Diversity" and force our heuristic enforcer to run.

## 3. Heuristic Enforcer (The "Classifier")
If the AI fails to structure the data, or if `Low Diversity` is detected, we classify each section based on its title using a comprehensive keyword library:

| Category | Keywords (Partial List) |
| :--- | :--- |
| **Getting Started** | intro, start, install, setup, overview |
| **API Reference** | api, reference, interface, type, schema, sdk |
| **Architecture** | architect, system, design, structure, flow |
| **Components** | component, ui, view, page, screen, widget |
| **Backend & Services** | auth, service, controller, server, database, model |
| **State Management** | hook, state, store, context, provider |
| **Utilities** | util, lib, helper, shared, common |
| **Configuration** | config, env, setting, option |
| **Deployment & Ops** | deploy, ci, cd, build, docker, cloud |
| **Testing** | test, spec, e2e, coverage |
| **Guides** | guide, tutorial, how-to, walkthrough |
| **Advanced Topics** | advanced, deep, internal, core, engine |

## 4. Database Sync
When you click "Regenerate Plan", we now explicitly update existing database records with the new, improved categories. This ensures your previous "Project Docs" are instantly upgraded to their proper new homes.
