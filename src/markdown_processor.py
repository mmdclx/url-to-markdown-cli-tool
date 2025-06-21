"""
Markdown processor module for converting HTML to clean, LLM-friendly markdown.

Originally inspired by m92vyas/llm-reader.
"""
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import html2text


def get_processed_markdown(page_source: str, base_url: str,
                                html_parser: str = 'lxml',
                                keep_images: bool = True, 
                                remove_svg_image: bool = True, 
                                remove_gif_image: bool = True, 
                                remove_image_types: list = None,
                                keep_webpage_links: bool = True,
                                remove_script_tag: bool = True, 
                                remove_style_tag: bool = True, 
                                remove_tags: list = None
                                ) -> str:
    """
    Process HTML source and convert to clean, LLM-friendly markdown.

    Args:
        page_source (str): HTML source text
        base_url (str): Base URL of the HTML source
        html_parser (str): BeautifulSoup HTML parser to use. Default 'lxml'
        keep_images (bool): Keep image links. Default True
        remove_svg_image (bool): Remove .svg images. Default True
        remove_gif_image (bool): Remove .gif images. Default True
        remove_image_types (list): Additional image extensions to remove. Default None
        keep_webpage_links (bool): Keep webpage links. Default True
        remove_script_tag (bool): Remove script tags. Default True
        remove_style_tag (bool): Remove style tags. Default True
        remove_tags (list): Additional HTML tags to remove. Default None

    Returns:
        str: Clean markdown text ready for LLM processing

    Raises:
        Exception: If there's an error while processing the HTML
    """
    if remove_image_types is None:
        remove_image_types = []
    if remove_tags is None:
        remove_tags = []

    try:
        soup = BeautifulSoup(page_source, html_parser)
        
        # Remove unwanted tags
        tags_to_remove = []
        if remove_script_tag:
            tags_to_remove.append('script')
        if remove_style_tag:
            tags_to_remove.append('style')
        tags_to_remove.extend(remove_tags)
        tags_to_remove = list(set(tags_to_remove))
        
        for tag in soup.find_all(tags_to_remove):
            try:
                tag.extract()
            except Exception as e:
                print(f'Error while removing tag: {e}')
                continue
        
        # Process images
        remove_image_type = []
        if remove_svg_image:
            remove_image_type.append('.svg')
        if remove_gif_image:
            remove_image_type.append('.gif')
        remove_image_type.extend(remove_image_types)
        remove_image_type = list(set(remove_image_type))
        
        for image in soup.find_all('img'):
            try:
                if not keep_images:
                    image.extract()
                else:
                    image_link = image.get('src')
                    if isinstance(image_link, str):
                        # Check if image type should be removed
                        should_remove = any(img_type in image_link for img_type in remove_image_type)
                        if should_remove:
                            image.extract()
                        else:
                            # Convert relative URLs to absolute
                            full_url = urljoin(base_url, image_link)
                            alt_text = image.get('alt', 'Image')
                            # Create proper markdown image syntax
                            image.replace_with(f'![{alt_text}]({full_url})')
            except Exception as e:
                print(f'Error while processing image: {e}')
                continue
        
        # Process links
        for link in soup.find_all('a', href=True):
            try:
                if not keep_webpage_links:
                    # Keep text but remove link
                    link.replace_with(link.get_text())
                else:
                    # Convert to markdown link format [text](url)
                    link_text = link.get_text().strip()
                    link_url = urljoin(base_url, link['href'])
                    if link_text:
                        markdown_link = f'[{link_text}]({link_url})'
                    else:
                        markdown_link = f'[{link_url}]({link_url})'
                    link.replace_with(markdown_link)
            except Exception as e:
                print(f'Error while processing link: {e}')
                continue

        # Convert to markdown using html2text
        h = html2text.HTML2Text()
        h.ignore_links = not keep_webpage_links
        h.ignore_images = not keep_images
        h.body_width = 0  # Don't wrap lines
        h.unicode_snob = True  # Use unicode
        h.escape_snob = False  # Don't escape markdown characters
        
        # Get body content or fall back to full document
        body_content = soup.find('body')
        if body_content:
            markdown_text = h.handle(str(body_content))
        else:
            markdown_text = h.handle(str(soup))
        
        # Clean up the markdown text
        lines = markdown_text.split('\n')
        cleaned_lines = []
        
        for line in lines:
            # Remove excessive blank lines but keep structure
            if line.strip() or (cleaned_lines and cleaned_lines[-1].strip()):
                cleaned_lines.append(line)
        
        # Join lines and clean up excessive whitespace
        result = '\n'.join(cleaned_lines).strip()
        
        # Remove excessive newlines (more than 2 consecutive)
        import re
        result = re.sub(r'\n{3,}', '\n\n', result)
        
        return result

    except Exception as e:
        raise Exception(f'Error while processing HTML to markdown: {e}')