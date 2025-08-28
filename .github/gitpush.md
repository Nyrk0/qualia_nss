git add -A
git commit -m "your message"
git push origin main
## sequence to reliably push and deploy:


git push --set-upstream origin main
## What it does: git push --set-upstream origin main pushes your current branch’s existing commits to origin/main and sets upstream tracking. It’s typically needed only the first time.
## What it does NOT do: stage or create a commit. If there are uncommitted changes, nothing will be pushed and no deploy will trigger.