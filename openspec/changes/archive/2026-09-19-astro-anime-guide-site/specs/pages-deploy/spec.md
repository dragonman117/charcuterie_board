## ADDED Requirements

### Requirement: GitHub Actions workflow builds and deploys to Pages
The system SHALL include `.github/workflows/deploy.yml` that, on push to the default branch, installs dependencies, builds the Astro site with `BASE_PATH` set from the deployment target, uploads the `dist/` artifact, and deploys it to GitHub Pages using `actions/deploy-pages@v4`.

#### Scenario: Push to default branch
- **WHEN** a commit is pushed to `main`
- **THEN** the workflow runs `npm ci`, `npm run build` with the correct `BASE_PATH`, uploads `dist/`, and publishes to the Pages site

#### Scenario: Manual re-deploy without code change
- **WHEN** the workflow is triggered via `workflow_dispatch`
- **THEN** it rebuilds and redeploys the site using the current `main` checkout

### Requirement: Base path driven by deployment environment
The workflow SHALL set `BASE_PATH` from a workflow input or repository variable so the same build works for a project Pages URL (`/<repo>/`) or a custom domain (`/`). The default SHALL be `/<repo-name>/` for project Pages.

#### Scenario: Project Pages deployment
- **WHEN** deploying to `<user>.github.io/<repo>`
- **THEN** `BASE_PATH` is set to `/<repo>/` (with trailing slash) and internal links resolve under that prefix

#### Scenario: Custom domain deployment
- **WHEN** the repo is configured for a custom domain (user sets the `BASE_PATH` input to `/`)
- **THEN** the site builds with root base path and serves correctly at the apex domain

### Requirement: Build artifact is the static `dist/` directory
The workflow SHALL upload only the `dist/` directory as the Pages artifact. No source files, caches, or `node_modules` SHALL be included in the deployed artifact.

#### Scenario: Artifact contents
- **WHEN** the workflow uploads the Pages artifact
- **THEN** the artifact contains only the contents of `dist/` (HTML, CSS, JS, and `/covers/` images)

### Requirement: Workflow uses Node 20 and npm ci
The workflow SHALL use `actions/setup-node@v4` with Node 20 and install dependencies via `npm ci` for reproducible builds.

#### Scenario: Reproducible install
- **WHEN** the workflow runs
- **THEN** dependencies are installed with `npm ci` from a committed `package-lock.json`