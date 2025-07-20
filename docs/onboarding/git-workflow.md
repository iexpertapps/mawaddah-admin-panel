# 📘 Mawaddah Admin Panel — Git Workflow (Onboarding Guide)

Welcome to the Mawaddah Admin Panel! This guide will help you get started with our Git workflow.

---

## 1. Where to Branch From
- **New features:** Branch from `dev` (e.g., `feature/settings-page`)
- **Bug fixes:** Branch from `main` (e.g., `hotfix/login-error`)
- **QA releases:** Branch from `dev` (e.g., `release/v1.1.0`)

---

## 2. Naming Conventions
- **Features:** `feature/{module-name}`
- **Hotfixes:** `hotfix/{bug-title}`
- **Releases:** `release/{version}`

---

## 3. Pull Request (PR) Etiquette
- PR title must follow commit format: `[emoji] Type: Message summary`
- Add a clear description (and screenshot if UI)
- Link related issues/bugs
- Self-review before requesting merge
- Wait for at least 1 review and passing checks (Vercel)

---

## 4. Do’s & Don'ts
**Do:**
- Use feature branches for all new work
- Keep commits focused and descriptive
- Rebase or update your branch before PR
- Ask for help if unsure

**Don't:**
- Push directly to `main` or `dev`
- Force-push to shared branches
- Merge without review

---

## 5. Using Vercel Preview
- Every PR automatically gets a Vercel Preview link
- Use the link to test your changes in a live environment
- Share the preview with reviewers for feedback

---

Happy coding! 🎉 If you have questions, ask your team lead or check the full [Git Branching Strategy](./git-branching-strategy.md). 