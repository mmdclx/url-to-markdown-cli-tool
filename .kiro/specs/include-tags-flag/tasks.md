# Implementation Plan

## Execution Order

This implementation follows **Git Commit Strategy checkpoints** rather than sequential task order for better functional milestones:

- **Checkpoint 1** ✅: Task 1 (CLI Foundation)
- **Checkpoint 2** ✅: Tasks 2, 3, 6 (Core Functionality) 
- **Checkpoint 3** ✅: Tasks 4, 5 (Robust Implementation)
- **Checkpoint 4**: Tasks 7, 8, 9, 10, 11, 12 (Production Ready)

## Tasks

- [x] 1. Add CLI argument parsing for include-tags flag
  - Add `--include-tags <tags...>` option to Commander.js configuration in src/index.js
  - Add validation to ensure include-tags is not empty when provided
  - Add help text and examples for the new flag
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 2. Implement include-tags filtering function in markdown processor
  - Create `filterToIncludeTags()` function in src/lib/markdownProcessor.js
  - Extract content from specified HTML tags using Cheerio selectors
  - Handle multiple instances of the same tag type
  - Return filtered Cheerio object or empty document if no matches found
  - _Requirements: 1.1, 1.2, 1.3, 3.3_
Í
- [x] 3. Integrate include-tags processing into main conversion pipeline
  - Modify `getProcessedMarkdown()` function to accept includeTags option
  - Apply include-tags filtering before existing remove-tags processing
  - Ensure proper interaction between include-tags and remove-tags functionality
  - Maintain backward compatibility with existing function signature
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 4. Implement tag priority resolution logic
  - Handle cases where tags appear in both include-tags and remove-tags lists
  - Ensure include-tags takes precedence over remove-tags for the same tag
  - Apply remove-tags filtering to child elements within included content
  - _Requirements: 2.3, 2.4_

- [x] 5. Add error handling and validation
  - Add validation for empty include-tags list with appropriate error message
  - Handle cases where no matching tags are found on the page
  - Add warning messages for no content scenarios
  - Implement graceful fallback to full document processing on errors
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 6. Connect CLI arguments to markdown processor
  - Pass include-tags array from CLI options to getProcessedMarkdown funtion
  - Update the options object construction in src/index.js run() function
  - Ensure proper data flow from command line to processing logic
  - _Requirements: 1.1, 1.4_

- [x] 7. Create comprehensive test fixtures for include-tags scenarios
  - Create HTML fixture files with article, main, section, and other common tags
  - Create fixtures with multiple instances of the same tag
  - Create fixtures with nested tag structures
  - Create fixtures with no matching tags for error testing
  - _Requirements: 1.1, 1.2, 1.3, 3.3_

- [x] 8. Write unit tests for include-tags filtering function
  - Test single tag inclusion functionality
  - Test multiple tag inclusion functionality
  - Test behavior when no matching tags are found
  - Test proper content extraction and hierarchy preservation
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 9. Write integration tests for include-tags and remove-tags interaction
  - Test include-tags with remove-tags combination scenarios
  - Test tag priority resolution when same tag appears in both lists
  - Test remove-tags filtering within included content scope
  - Test edge cases with nested and conflicting tag specifications
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 10. Write CLI integration tests for include-tags flag
  - Test command-line argument parsing for include-tags flag
  - Test error handling for invalid include-tags inputs
  - Test help text display includes include-tags documentation
  - Test end-to-end CLI functionality with include-tags flag
  - _Requirements: 4.1, 4.2, 4.3, 3.1_

- [x] 11. Add comprehensive error handling tests
  - Test empty include-tags list validation and error messages
  - Test no matching content scenarios with appropriate warnings
  - Test graceful degradation when include-tags processing fails
  - Test invalid tag name handling
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 12. Update help documentation and examples
  - Add include-tags flag to CLI help output with clear examples
  - Document interaction between include-tags and remove-tags flags
  - Add usage examples showing common use cases like article extraction
  - Ensure help text follows existing formatting patterns
  - _Requirements: 4.2, 4.4_