# Test Cases for Core Renderer

## Headings & Paragraphs

# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

This is a paragraph with some text. It should wrap normally and handle line breaks within the same block.

This is a second paragraph. It should be separated from the first by a blank line.

## Bold/Italic/Strikethrough

**Bold text**
*Italic text*
***Bold and italic***
~~Strikethrough text~~
**Bold with *italic* inside**

## Lists

### Unordered List

- Item one
- Item two
- Item three

### Ordered List

1. First item
2. Second item
3. Third item

### Nested List

- Top level one
  - Nested level two
    - Deep nested three
  - Another nested
- Top level two

### Task List

- [ ] Task not done
- [x] Task completed
- [ ] Another pending task

## Tables

| Name | Age | City |
|------|-----|------|
| Alice | 30 | New York |
| Bob | 25 | London |
| Charlie | 35 | Tokyo |

## Code Blocks

### Inline Code

Use `console.log()` to debug your code. The `MarkdownRenderer` class is the main entry point.

### Code Block with Language

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}
console.log(greet("World"));
```

```python
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
```

```json
{
  "name": "markdown-renderer",
  "version": "0.0.1"
}
```

### Fenced Code Block (no language)

```
Plain text code block
  with indentation preserved
```

## Blockquotes

> This is a simple blockquote.
> It spans multiple lines.

> Nested blockquote:
> > This is a nested quote inside the first one.

## Callouts

### Basic Callouts

> [!note] This is a note callout.

> [!tip] Here's a helpful tip for you.

> [!warning] Be careful with this action.

> [!important] This is very important information.

> [!success] Operation completed successfully.

> [!error] Something went wrong.

### Callouts with Custom Titles

> [!note] My Custom Note Title
> This note has a custom title instead of the default type name.

> [!tip] Pro Tip
> Always test your code before deploying.

> [!warning] Security Warning
> Never commit secrets to version control.

### Foldable Callouts (Expanded)

> [!note]+ Expanded Callout
> This callout is foldable and starts in the expanded state.
> It contains multiple lines of content.

> [!tip]+ Debugging Tips
> 1. Use console.log()
> 2. Check the network tab
> 3. Read the error messages

### Foldable Callouts (Collapsed)

> [!note]- Collapsed Callout
> This content is hidden by default. Click to expand.

> [!warning]- Known Issues
> - Issue #1: Performance regression on large documents
> - Issue #2: Callout CSS not loading in Safari

### Callouts with Body Content

> [!info] API Documentation
> The `render()` method accepts a markdown string and returns HTML.
> ```javascript
> const html = renderer.render("# Hello");
> ```
> See the full API reference for more details.

> [!example] Code Example
> Here is how you use wikilinks:
> - `[[Page Name]]` links to a page
> - `[[Page Name#Heading]]` links to a heading
> - `[[Page Name|Display Text]]` uses custom display text

## Wikilinks

### Basic Wikilink

This is a simple [[Page Name]] link.

### Wikilink with Heading

Jump to a specific section with [[Page Name#Section Title]].

### Wikilink with Alias

Click [[Technical Documentation|here]] for more details.

### Wikilink with Heading and Alias

See [[API Reference#render method|the render method docs]] for usage.

### Multiple Wikilinks

Related pages: [[Getting Started]], [[Configuration]], and [[Advanced Usage]].

## Obsidian Embeds

### PDF Embed

Here is a PDF document: ![[document.pdf]]

### Image Embeds

![[photo.png]]
![[diagram.svg]]
![[banner.webp]]

### Video Embed

![[tutorial.mp4]]

### Audio Embed

![[podcast.mp3]]

### Unknown Extension Embed

![[data.unknown]]
