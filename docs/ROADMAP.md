# Ray Project Roadmap & Feature Voting

We organize features into milestones. Community members can vote on priorities using GitHub Reactions on open RFC issues.

## 🗺️ Active Milestones

### Ray 1.1: Performance Improvements
- [x] Persistent pre-bundling cache system
- [x] Memory leak diagnostics and execution barriers
- [x] Multi-process parallel build optimization

### Ray 1.2: New Language Support
- [x] Native MDX markdown compiler
- [x] Vue SFC compile parsing (@ray/plugin-vue)
- [x] Svelte compile rendering (@ray/plugin-svelte)
- [x] SolidJS reactivity tracking (@ray/plugin-solid)

### Ray 1.3: Plugin Enhancements
- [x] Auto-scaffold framework templates
- [x] Image assets optimization metadata
- [x] Static copy, PWA, and ESLint checkers

### Ray 1.4: SSR Improvements
- [x] Client/Server hydrate split bundles
- [x] On-demand server-side route compilation
- [x] Programmatic static generation routes pre-rendering (SSG)

### Ray 1.5: Optimizer Improvements
- [x] Nested scope lexical binding resolution
- [x] Correct block declaration variable tree-shaking
- [x] In-context JSX token parsing heuristics

### Ray 2.0: Native Compiler Backend
- [ ] Swappable native Rust/Go AST transformer bridge
- [ ] Optimized source maps generation loops

### Ray 3.0: Rust-Powered Compiler
- [ ] Native Rust compilation rewrite
- [ ] Concurrent dependency graph crawling
- [ ] High-efficiency CJS/ESM bundling

### Ray 4.0: Distributed Build Platform
- [x] Remote CAS cloud worker synchronization
- [x] CAS content-addressable storage offline queues
- [x] Cloud worker executor parallel mapping

---

## 🗳️ How Feature Voting Works
1. Check the open issues tagged as `type: rfc` or `type: roadmap`.
2. Add a `+1` (👍) reaction to cast your vote.
3. The core team reviews the most upvoted issues at the start of each milestone sprint.
