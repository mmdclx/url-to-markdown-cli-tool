# Design Document

## Overview

The `--include-tags` flag feature adds selective content processing to the url-to-markdown CLI tool. This feature allows users to specify which HTML tags to include in the conversion process, effectively creating a content scope filter that works as the inverse of the existing `--remove-tags` functionality.

The implementation follows the existing architectural patterns in the codebase, with changes primarily in the CLI argument parsing (`src/index.js`) and the HTML processing logic (`src/lib/markdownProcessor.js`). The feature integrates seamlessly with existing functionality while maintaining backward compatibility.

## Architecture

### Processing Flow

The include-tags functionality will be implemented as a pre-processing step in the markdown conversion pipeline:

1. **CLI Argument Parsing** - Parse `--include-tags` flag and validate input
2. **Content Scope Filtering** - Extract only content within specified tags using Cheerio
3. **Existing Processing Pipeline** - Apply existing remove-tags, image processing, and markdown conversion
4. **Output Generation** - Return processed markdown

### Integration Points

- **CLI Interface** (`src/index.js`): Add new command-line option with validation
- **Markdown Processor** (`src/lib/markdownProcessor.js`): Add include-tags filtering logic
- **Existing Remove-Tags**: Maintain compatibility and proper interaction order

## Components and Interfaces

### CLI Interface Changes

**Location**: `src/index.js`

Add new command-line option:
```javascript
.option('--include-tags <tags...>', 'Include only specific HTML tags and their content (e.g., --include-tags article main section)')
```

**Validation Requirements**:
- Ensure tags list is not empty when flag is provided
- Pass include-tags array to markdown processor
- Maintain existing argument validation patterns

### Markdown Processor Changes

**Location**: `src/lib/markdownProcessor.js`

**New Function**: `filterToIncludeTags($, includeTags)`
- Extract content from specified HTML tags
- Preserve tag hierarchy and nesting
- Handle multiple instances of the same tag
- Return filtered Cheerio object for further processing

**Modified Function**: `getProcessedMarkdown()`
- Add `includeTags` parameter to options object
- Apply include-tags filtering before existing remove-tags processing
- Maintain existing function signature for backward compatibility

### Processing Logic

```javascript
// Pseudo-code for include-tags processing
function filterToIncludeTags($, includeTags) {
    if (!includeTags || includeTags.length === 0) {
        return $; // No filtering, return original
    }
    
    // Create new document with only included content
    const filteredContent = [];
    
    includeTags.forEach(tag => {
        $(tag).each((index, element) => {
            filteredContent.push($(element).clone());
        });
    });
    
    if (filteredContent.length === 0) {
        // No matching tags found, return empty document
        return cheerio.load('<body></body>');
    }
    
    // Create new document with filtered content
    const newDoc = cheerio.load('<body></body>');
    filteredContent.forEach(content => {
        newDoc('body').append(content);
    });
    
    return newDoc;
}
```

## Data Models

### Options Object Extension

The existing options object in `getProcessedMarkdown()` will be extended:

```javascript
{
    // Existing options...
    keepImages: boolean,
    removeTags: string[],
    // New option
    includeTags: string[] | undefined
}
```

### CLI Options Object

The Commander.js options object will include:

```javascript
{
    // Existing options...
    removeTags: string[],
    // New option
    includeTags: string[]
}
```

## Error Handling

### Input Validation

1. **Empty Include-Tags List**: Display error message and exit gracefully
2. **Invalid Tag Names**: Process as-is, let HTML parser handle validation
3. **No Matching Content**: Return empty result with warning message

### Error Messages

- `Error: --include-tags requires at least one tag name`
- `Warning: No content found matching the specified include-tags: [tag1, tag2]`
- `Error: Cannot use --include-tags with empty value`

### Graceful Degradation

- If include-tags processing fails, fall back to processing entire document
- Log warnings for non-critical errors
- Maintain existing error handling patterns

## Testing Strategy

### Unit Tests

**New Test File**: `tests/include-tags.test.js`

Test scenarios:
1. **Basic Functionality**
   - Single tag inclusion (e.g., `article`)
   - Multiple tag inclusion (e.g., `article main section`)
   - Tag not found on page

2. **Integration with Remove-Tags**
   - Include-tags with remove-tags combination
   - Conflicting tags (same tag in both lists)
   - Nested tag scenarios

3. **Edge Cases**
   - Empty include-tags list
   - Invalid tag names
   - No matching content
   - Multiple instances of same tag

### Test Fixtures

**New Fixture Files** in `tests/fixtures/`:
- `include-tags-article.html` - Page with article tags
- `include-tags-multiple.html` - Page with multiple target tags
- `include-tags-nested.html` - Page with nested tag structures
- `include-tags-empty.html` - Page without target tags

### Integration Tests

**Modified Test File**: `tests/cli.test.js`

Add CLI integration tests:
- Command-line argument parsing
- Error handling for invalid inputs
- Output validation for various scenarios

### Test Data Structure

```javascript
// Example test case structure
describe('Include Tags Functionality', () => {
    test('should include only article content', async () => {
        const html = '<html><body><nav>Nav</nav><article>Article content</article><footer>Footer</footer></body></html>';
        const result = await getProcessedMarkdown(html, 'http://example.com', {
            includeTags: ['article']
        });
        expect(result).toContain('Article content');
        expect(result).not.toContain('Nav');
        expect(result).not.toContain('Footer');
    });
});
```

## Implementation Considerations

### Performance

- Include-tags filtering adds minimal overhead (single DOM traversal)
- Cheerio operations are efficient for typical web page sizes
- Memory usage scales with included content size, not total page size

### Backward Compatibility

- New flag is optional, existing functionality unchanged
- Existing remove-tags behavior preserved
- No breaking changes to existing API

### Tag Priority Resolution

When a tag appears in both include-tags and remove-tags:
1. Include-tags takes precedence (tag is included)
2. Remove-tags applies to child elements within included content
3. Clear documentation of this behavior in help text

### Content Preservation

- Maintain original tag hierarchy within included content
- Preserve attributes and nested structures
- Handle self-closing tags appropriately

## Git Commit Strategy

### Strategic Commit Checkpoints

To maintain code quality and enable safe rollbacks, the implementation follows these strategic commit points:

#### Checkpoint 1: CLI Foundation ✅
- **Tasks**: 1 (CLI argument parsing)
- **Rationale**: Complete CLI interface with validation, all tests passing
- **Value**: Users can see the new flag in help, basic validation works
- **Commit Message**: "feat: add --include-tags CLI flag with validation"

#### Checkpoint 2: Core Functionality
- **Tasks**: 2, 3, 6 (filtering function + integration + CLI connection)
- **Rationale**: End-to-end functionality working, users can actually use the feature
- **Value**: Feature is functionally complete for basic use cases
- **Commit Message**: "feat: implement include-tags filtering and integration"

#### Checkpoint 3: Robust Implementation
- **Tasks**: 4, 5 (priority resolution + error handling)
- **Rationale**: Edge cases handled, production-ready reliability
- **Value**: Feature handles complex scenarios gracefully
- **Commit Message**: "feat: add tag priority resolution and error handling"

#### Checkpoint 4: Production Ready
- **Tasks**: 7, 8, 9, 10, 11, 12 (comprehensive testing + documentation)
- **Rationale**: Full test coverage, documentation complete
- **Value**: Feature is fully tested and documented
- **Commit Message**: "feat: complete include-tags with full test coverage"

### Commit Guidelines

- Each checkpoint represents a functional milestone
- All tests must pass before committing
- Commits should be atomic and reversible
- Clear commit messages following conventional commit format

## Future Enhancements

### Potential Extensions

1. **CSS Selector Support**: Allow CSS selectors instead of just tag names
2. **Attribute Filtering**: Include tags based on attributes (e.g., `div[class="content"]`)
3. **Content Combination**: Options for how to combine multiple included sections
4. **Include-Tags Exclusions**: Exclude specific instances of included tags

### Compatibility Considerations

- Design allows for future CSS selector support
- Options object structure supports additional filtering parameters
- CLI interface can be extended with additional flags