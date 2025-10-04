# Migration Plan: Custom Evaluator → @actions/expressions

## Executive Summary

**Current State**: 736-line custom expression evaluator with 98.2% test coverage
**Target State**: Official `@actions/expressions` library (already installed!)
**Impact**: ~500 lines deleted, all features preserved, new features unlocked

## Why Migrate?

### Critical Reasons ✅
1. **Already Installed** - Library is in package.json but unused
2. **Official Implementation** - Maintained by GitHub, follows spec exactly
3. **Feature Complete** - Has ALL GitHub Actions functions we're missing
4. **Correctness Guarantee** - Battle-tested in production GitHub Actions
5. **Less Code** - Delete 500+ lines of custom parsing logic

### Current Pain Points 🔴
- Object filter syntax (`*.property`) - not implemented
- `hashFiles()` - stubbed out, returns error
- Nested JSON edge cases - fails
- Manual operator precedence handling - complex
- Function argument parsing - error-prone

### What We Gain 🎁
- ✅ All functions work: `join()`, `hashFiles()`, `contains()`, etc.
- ✅ Object filters: `github.event.commits.*.message`
- ✅ Array indexing: `github.event.commits[0].message`
- ✅ Proper null coalescing: `value ?? 'default'`
- ✅ All edge cases handled correctly

## Timeline

**Total Estimated Time**: 45 minutes

| Phase | Time | Complexity |
|-------|------|------------|
| 1. Setup & Type Mapping | 15 min | Medium |
| 2. Core Implementation | 10 min | Low |
| 3. Context Tracking | 5 min | Low |
| 4. Update Tests | 10 min | Low |
| 5. Cleanup | 5 min | Low |

## Files Modified

```
✏️  src/utils/expressionEvaluator.ts  (~500 lines deleted, ~100 added)
✏️  src/test/expressionExamples.test.ts  (imports only, structure unchanged)
📝 TODO-FUNCTIONALITY.md  (update with migration notes)
🗑️  Delete: ~20 private methods from evaluator
```

## Code Size Comparison

### Before
- Total: 736 lines
- Logic: 700 lines of parsing
- Tests: 57 test cases

### After
- Total: ~150 lines
- Logic: ~100 lines (mostly conversions)
- Tests: 57+ test cases (same + new features)

**Net change**: -586 lines ✨

## Success Metrics

### Definition of Done ✅
- [ ] All 56 existing tests pass
- [ ] Context hit tracking works in UI
- [ ] Example expressions evaluate correctly
- [ ] Error handling works
- [ ] Code size reduced by 500+ lines
- [ ] Documentation updated

### Bonus Features Unlocked 🎁
- [ ] Object filter syntax works
- [ ] hashFiles() returns real values
- [ ] Array indexing works
- [ ] All edge cases handled correctly

---

**Status**: In Progress
**Started**: 2025-01-04
**Branch**: migrate-to-actions-expressions
