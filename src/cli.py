import argparse
import asyncio
from url_to_llm_text.get_html_text import get_page_source
from url_to_llm_text.get_llm_input_text import get_processed_text

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
    processed = await get_processed_text(
        page_source,
        args.url,
        keep_images=not args.no_images,
        keep_webpage_links=not args.no_links,
        remove_gif_image=args.no_gif_images,
        remove_svg_image=args.no_svg_images,
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
    args = parser.parse_args()
    asyncio.run(run(args))

if __name__ == "__main__":
    main()
