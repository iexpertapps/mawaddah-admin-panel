# 🗂️ Mawaddah Admin Panel — Git Branching Strategy

This document outlines the **official Git workflow** for the Mawaddah Admin Panel. All contributors must follow these rules to ensure a clean, stable, and scalable codebase.

---

## 🔒 `main` — Production Branch
- **Purpose:** Live, stable, deployable code
- **Rules:**
  - ✅ Only merge via Pull Requests (PRs)
  - 🚫 No direct commits allowed
  - 🔁 Auto-deploys to Vercel
  - 🛡️ Protected branch (require PR, review, prevent force-push, require passing Vercel build)

---

## 🔁 `dev` — Staging/Integration Branch (Optional)
- **Purpose:** Active development and feature testing
- **Rules:**
  - PRs from `feature/*`, `hotfix/*` → merged here
  - Test, QA, and final polish before merging to `main`
  - Optional Vercel staging link

---

## 🌱 `feature/*` — New Feature Development
- **Naming:** `feature/{module-name}` (e.g., `feature/settings-page`)
- **Rules:**
  - Always branch from `dev`
  - PR to `dev` when feature is stable

---

## 🚑 `hotfix/*` — Critical Live Bug Fixes
- **Naming:** `hotfix/{bug-title}` (e.g., `hotfix/wallet-total-wrong`)
- **Rules:**
  - Branch directly from `main`
  - Fix → Test → PR → Merge into `main` (and optionally `dev`)

---

## 🧪 `release/*` — QA Testing for Versions
- **Naming:** `release/v1.0`, `release/patch-1.1.2`
- **Purpose:** Collect all approved features for pre-production testing
- **Rules:**
  - Freeze all changes, no new features
  - PR into `main` after QA approval

---

## 📝 Commit Format

```bash
# Format
[emoji] Type: Message summary

# Examples
🎨 UI: Fix spacing in Wallets table
🐛 Fix: Login button not redirecting
⚙️ DevOps: Add Vercel build command for staging
```

---

## 🚦 Pull Request Checklist
- PR title must follow commit format
- Include brief description and screenshot (if UI)
- Link related issue or bug (if applicable)
- Self-review before requesting merge
- Ensure all status checks (Vercel) pass

---

## 🚀 Deployment Flow Summary

| Action         | Source        | Destination | Trigger                |
|----------------|--------------|-------------|------------------------|
| Feature Dev    | feature/*    | dev         | New features           |
| Bugfix         | hotfix/*     | main        | Immediate live patch   |
| QA             | release/*    | main        | Final candidate        |
| Production     | main         | Vercel      | ✅ Auto-deploy         |

---

## 📦 Tags & Versioning (Optional)
Use annotated tags for production releases:

```bash
git tag -a v1.0.0 -m "First stable release"
git push origin v1.0.0
```

---

## 🛡️ Branch Protection Rules
- Require PRs with at least 1 review
- Block direct commits
- Require passing status checks (Vercel)
- Disallow force pushes

---

## 📚 Summary Table

| Branch        | Purpose                | Source         | PR Target |
|---------------|------------------------|----------------|-----------|
| main          | Production/LIVE        | release/*, hotfix/* | -         |
| dev           | Staging/Integration    | feature/*      | main      |
| feature/*     | New Features           | dev            | dev       |
| hotfix/*      | Critical Fixes         | main           | main      |
| release/*     | QA/Pre-Production      | dev            | main      |

---

## ✅ Enforcement
- Use this branching plan for every commit, feature, and hotfix.
- For new team members, include this in the onboarding doc. 