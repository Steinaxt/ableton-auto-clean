# Claude Code Project Configuration

## Overview
This project is configured to automatically track all changes using Git and GitHub. Every time Claude Code makes changes or creates new files, the changes are automatically committed and pushed to GitHub.

## GitHub Integration Setup

### Prerequisites
1. **GitHub CLI** - Install `gh` from https://github.com/cli/cli
2. **Git** - Ensure Git is installed on your system
3. **GitHub Authentication** - Run `gh auth login` to authenticate with your GitHub account

### Initial Setup (One-time)
Run this command in the project directory to create and initialize the GitHub repository:

```bash
# Initialize local git repository if not already done
git init

# Create GitHub repository (replace OWNER with your GitHub username)
gh repo create claude-code-test --public --source=. --remote=origin --push

# Set up automatic commits
git config user.name "Claude Code"
git config user.email "claude@anthropic.com"
```

## Automatic Change Tracking

All changes made by Claude Code are automatically:
1. ✅ Committed to the local Git repository
2. ✅ Pushed to the GitHub remote repository
3. ✅ Tagged with "Co-Authored-By: Claude" in commit messages

### Commit Hook Configuration
The following hooks in `settings.json` automate change tracking:

```json
{
  "hooks": {
    "post-write": "git add -A && git commit -m \"Update files\" --no-verify 2>/dev/null; git push origin main 2>/dev/null || true",
    "post-edit": "git add -A && git commit -m \"Modify files\" --no-verify 2>/dev/null; git push origin main 2>/dev/null || true"
  }
}
```

## Manual Commit Format
When manually creating commits, use this format:

```
<type>: <description>

<optional details>

Co-Authored-By: Claude Code <claude@anthropic.com>
```

### Commit Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications
- `chore`: Maintenance tasks
- `update`: File updates

## Repository Structure
```
.
├── CLAUDE.md              # This configuration file
├── .git/                  # Git repository metadata
├── .gitignore            # Git ignore rules
└── [project files]       # Your project files
```

## Viewing Changes
- **Local history**: `git log --oneline`
- **GitHub**: Visit your repository on github.com
- **Details**: `git show <commit-hash>`

## Disabling Automatic Commits
To temporarily disable automatic commits, comment out the hooks in `settings.json`:

```json
{
  "hooks": {
    // "post-write": "git add -A && git commit -m \"Update files\" --no-verify 2>/dev/null; git push origin main 2>/dev/null || true",
    // "post-edit": "git add -A && git commit -m \"Modify files\" --no-verify 2>/dev/null; git push origin main 2>/dev/null || true"
  }
}
```

## Important Notes
- Make sure your GitHub token has the necessary permissions
- The initial push to GitHub must be done manually with `gh repo create`
- Branch protection rules on GitHub may affect auto-push behavior
- Keep your GitHub token secure and never commit it to the repository

## Troubleshooting
If automatic commits fail:
1. Verify GitHub CLI is installed: `gh --version`
2. Check authentication: `gh auth status`
3. Verify git config: `git config --local user.name`
4. Check hook configuration in `settings.json`
5. Run manual commit: `git add -A && git commit -m "message"`
