# Agent notes

## Environments

- **Production** is Vercel, deployed only by `.github/workflows/deploy.yml` on push to `main`.
- **Demo / preview environments** run on the nexttech Pi, never on Vercel. Each one is a
  `preview/<name>` branch (git flow: cut it from the `feature/*` or `fix/*` branch to show),
  deployed by `.github/workflows/preview.yml` → Jenkins job `mg-nautica-wix-preview` at
  `https://mgn-<name>.nexttech.com.ar`. Deleting the branch tears the environment down.
- Never run `vercel deploy` (with or without `--prod`) by hand, and never hand out a
  `*.vercel.app` URL as a demo. If the Pi pipeline is broken, fix the pipeline.

## Vercel CLI

The default CLI login on this machine belongs to another team. This project has its own
login in `~/.config/vercel/mg-nautica`, so always pass
`--global-config ~/.config/vercel/mg-nautica --scope next-tech` (e.g. to list or remove
deployments). Never run `vercel login` without `--global-config`: it overwrites the other login.

Details in the README, sections "Deploy pipeline" and "Design previews (Pi)".
