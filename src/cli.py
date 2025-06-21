import argparse
import asyncio
import sys
import os

# Add the src directory to the Python path for imports
if getattr(sys, 'frozen', False):
    # Running as compiled binary
    bundle_dir = os.path.dirname(sys.executable)
    sys.path.insert(0, bundle_dir)
else:
    # Running as source
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from page_fetcher import get_page_source
    from markdown_processor import get_processed_markdown
except ImportError:
    # If imports fail, try from current directory
    import importlib.util
    import inspect
    
    # Load page_fetcher
    spec = importlib.util.spec_from_file_location("page_fetcher", os.path.join(os.path.dirname(__file__), "page_fetcher.py"))
    page_fetcher_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(page_fetcher_module)
    get_page_source = page_fetcher_module.get_page_source
    
    # Load markdown_processor
    spec = importlib.util.spec_from_file_location("markdown_processor", os.path.join(os.path.dirname(__file__), "markdown_processor.py"))
    markdown_processor_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(markdown_processor_module)
    get_processed_markdown = markdown_processor_module.get_processed_markdown

async def run(args: argparse.Namespace) -> None:
    try:
        page_source = await get_page_source(
            args.url,
            wait=args.wait,
            headless=not args.no_headless,
        )
    except Exception as e:
        raise SystemExit(
            f"Error while fetching page: {e}. "
            "Ensure Chrome and the matching driver are installed."
        )
    if not page_source:
        raise SystemExit(
            "Failed to fetch the page. Ensure Chrome and ChromeDriver are installed."
        )
    processed = await get_processed_markdown(
        page_source,
        args.url,
        keep_images=not args.no_images,
        keep_webpage_links=not args.no_links,
        remove_gif_image=args.no_gif_images,
        remove_svg_image=args.no_svg_images,
        remove_tags=args.remove_tags or [],
    )
    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(processed)
    else:
        print(processed)

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch URL content and output LLM-friendly markdown",
    )
    parser.add_argument("url", help="URL to fetch")
    parser.add_argument(
        "-o",
        "--output",
        help="Write output to file instead of stdout",
    )
    parser.add_argument(
        "--wait",
        type=float,
        default=1.5,
        help="Seconds to wait for the page to load (default: 1.5)",
    )
    parser.add_argument(
        "--no-headless",
        action="store_true",
        help="Disable headless browser mode",
    )
    parser.add_argument(
        "--no-images",
        action="store_true",
        help="Remove images from the output",
    )
    parser.add_argument(
        "--no-links",
        action="store_true",
        help="Remove webpage links from the output",
    )
    parser.add_argument(
        "--no-gif-images",
        action="store_true",
        help="Remove GIF images from the output",
    )
    parser.add_argument(
        "--no-svg-images",
        action="store_true",
        help="Remove SVG images from the output",
    )
    parser.add_argument(
        "--remove-tags",
        nargs="*",
        metavar="TAG",
        help="Remove specific HTML tags from the output (e.g., --remove-tags div span script)",
    )
    args = parser.parse_args()
    asyncio.run(run(args))

if __name__ == "__main__":
    main()
