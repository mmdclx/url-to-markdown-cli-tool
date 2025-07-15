# Requirements Document

## Introduction

This feature adds a new `--include-tags` flag to the url-to-markdown CLI tool that allows users to specify which HTML tags to include in the conversion process. This is the inverse of the existing `--remove-tags` flag - instead of specifying what to exclude, users can specify what to include. The feature will work in conjunction with the existing `--remove-tags` flag, where include-tags defines the scope of content to process, and remove-tags can still filter out unwanted elements within that scope.

## Requirements

### Requirement 1

**User Story:** As a content processor, I want to specify which HTML tags to include in markdown conversion, so that I can focus on specific content sections like articles or main content areas.

#### Acceptance Criteria

1. WHEN I use the `--include-tags` flag with a space-separated list of tag names THEN the system SHALL only process content within those specified HTML tags
2. WHEN I specify `--include-tags article` THEN the system SHALL only convert content found within `<article>` tags and their children
3. WHEN I specify multiple tags like `--include-tags article main section` THEN the system SHALL process content from any of those tag types
4. WHEN no `--include-tags` flag is provided THEN the system SHALL process the entire page as it currently does

### Requirement 2

**User Story:** As a user, I want the `--include-tags` flag to work with the existing `--remove-tags` flag, so that I can first scope to specific content areas and then remove unwanted elements within those areas.

#### Acceptance Criteria

1. WHEN I use both `--include-tags` and `--remove-tags` flags THEN the system SHALL first filter to include-tags scope, then remove specified tags within that scope
2. WHEN I specify `--include-tags article --remove-tags nav footer` THEN the system SHALL only process article tags but remove any nav or footer elements found within those articles
3. WHEN a tag appears in both include-tags and remove-tags THEN the system SHALL prioritize the include-tags behavior and include the tag
4. WHEN remove-tags contains child elements of include-tags THEN the system SHALL remove those child elements from the included content

### Requirement 3

**User Story:** As a developer, I want clear error handling and validation for the include-tags flag, so that users receive helpful feedback when using the feature incorrectly.

#### Acceptance Criteria

1. WHEN I provide an empty value for `--include-tags` THEN the system SHALL display an error message and exit gracefully
2. WHEN I provide invalid HTML tag names THEN the system SHALL process them as-is and let the HTML parser handle validation
3. WHEN no matching tags are found on the page THEN the system SHALL output an empty markdown result with a warning message
4. WHEN the include-tags filter results in no content THEN the system SHALL provide a helpful message indicating no matching content was found

### Requirement 4

**User Story:** As a CLI user, I want the include-tags flag to follow the same patterns as existing flags, so that it feels consistent with the rest of the tool.

#### Acceptance Criteria

1. WHEN I use the flag THEN it SHALL accept space-separated values like other multi-value flags in the tool
2. WHEN I use `--help` THEN the system SHALL display documentation for the `--include-tags` flag with examples
3. WHEN I use the short form (if provided) THEN it SHALL work identically to the long form
4. WHEN I combine this flag with other existing flags THEN all flags SHALL work together without conflicts