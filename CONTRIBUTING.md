# Contributing

This repository is a generated meta-index of MCP server lists, directories, registries, and marketplaces.

## How to Contribute

### Adding an MCP Index Repository

1. Fork this repo
2. Confirm that the project curates multiple MCP servers or ecosystem resources
3. Ensure its GitHub description clearly identifies it as a list, collection, directory, catalog, registry, or marketplace
4. Add or adjust a focused classifier test if the repository is incorrectly excluded
5. Submit a PR describing why the project belongs in this meta-index

Do not edit generated sections or generated Markdown pages directly. Individual MCP servers should be submitted to one of the official or community directories linked from README.md.

### Correcting an Entry

Check `data/discovery-audit.json` for the current decision and reason. Corrections should improve the structured discovery or classification rules rather than patching generated output. Include a regression test demonstrating the incorrect inclusion or exclusion.

### Adding a Registry or Index Link

1. Add to the appropriate table (Official or Community)
2. Keep entries in alphabetical order by platform name

## PR Guidelines

- One addition per PR preferred
- Ensure links are valid and accessible
- Do not commit secrets or edit generated output by hand
- Run `npm run check` from `find-awesome-mcp-servers` before submitting
