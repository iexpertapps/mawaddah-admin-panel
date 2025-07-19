# 🛡️ Branch Protection Rules — Mawaddah Admin Panel

## main Branch
- Require Pull Requests for all changes
- Require at least 1 approving review
- Require passing status checks (Vercel build)
- Block direct commits (no pushes to main)
- Disallow force pushes
- Optional: Require up-to-date branches before merging

## dev Branch
- Require Pull Requests for all changes
- Require at least 1 approving review
- Require passing status checks (Vercel build, if enabled)
- Block direct commits (no pushes to dev)
- Disallow force pushes
- Optional: Require up-to-date branches before merging

---

> **Note:** These rules should be enforced via GitHub branch protection settings. See [GitHub Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-branch-protection-rules/about-protected-branches) for setup instructions. 