# Project Wiki

This is an auto-generated wiki for the Qualia NSS project. The wiki is built from Markdown files in this directory and code documentation.

## Structure

- `manual/` - Manually written documentation
- `api/` - Auto-generated API documentation
- `guides/` - How-to guides and tutorials
- `architecture/` - System architecture and design decisions

## Development

To view the wiki locally:

1. Install the required dependencies:
   ```bash
   npm install -g docsify-cli
   ```

2. Start the local server:
   ```bash
   docsify serve docs/wiki
   ```

3. Open http://localhost:3000 in your browser

## Adding Documentation

- Add Markdown files to the appropriate directory
- Update `_sidebar.md` to add navigation
- Commit and push changes to the repository

## Auto-generated Content

API documentation is automatically generated from code comments using JSDoc/TypeDoc. To update:

```bash
npm run docs:generate
```
