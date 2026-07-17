# Contributing to Ray

Thank you for your interest in contributing to Ray! Follow these guidelines to get started with coding, testing, and submitting your changes.

## 🛠️ Local Development Setup

Ray is managed as a workspace monorepo. Ensure you have Node.js >= 18 installed.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rayulumukku/Devops-Pipelines.git
   cd Devops-Pipelines
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the packages:**
   ```bash
   npm run build
   ```

---

## 🧪 Testing Guidelines

Every change must pass our unit, integration, and E2E regression test suites before release.

- **Run Unit/Integration Tests (Vitest):**
  ```bash
  npx vitest run
  ```

- **Run Browser E2E Tests (Playwright):**
  ```bash
  npx playwright test
  ```

---

## 📬 Pull Request Process

1. Create a descriptive branch for your changes: `git checkout -b feat/my-new-feature`
2. Follow standard JavaScript/TypeScript coding conventions.
3. Write/update unit tests under `tests/unit/` for any new logic.
4. Open a pull request targeting the `main` branch. All CI status checks must pass before merging.
