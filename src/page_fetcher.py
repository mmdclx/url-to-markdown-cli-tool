"""
Page fetcher module for retrieving web content using Selenium.

Originally inspired by m92vyas/llm-reader.
"""
import asyncio
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


async def get_page_source(url: str,
                         wait: float = 1.5,
                         headless: bool = True,
                         user_agent: str = "Mozilla/5.0 (Windows Phone 10.0; Android 4.2.1; Microsoft; Lumia 640 XL LTE) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Mobile Safari/537.36 Edge/12.10166"
                         ) -> str:
    """
    Get HTML source using Selenium WebDriver.

    Args:
        url (str): The URL from which HTML content is to be extracted
        wait (float): Time to implicitly wait for the website to load. Default is 1.5 sec.
        headless (bool): Use headless browser or not. Default True
        user_agent (str): User agent string for the browser

    Returns:
        str: HTML source code of the page

    Raises:
        Exception: If there's an error while fetching the page
    """
    driver = None
    try:
        # Check if using Google Colab
        using_colab = False
        try:
            import google.colab
            using_colab = True
        except ImportError:
            using_colab = False

        # Configure Chrome options
        options = webdriver.ChromeOptions()
        if headless:
            options.add_argument('--headless')
        options.add_argument(f'--user-agent={user_agent}')
        
        # Add Colab-specific options if needed
        if using_colab:
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')

        # Create driver and fetch page
        driver = webdriver.Chrome(options=options)
        driver.get(url)
        driver.implicitly_wait(wait)

        return driver.page_source

    except Exception as e:
        raise Exception(f"Error while fetching page: {e}. Ensure Chrome and ChromeDriver are installed.")
    
    finally:
        if driver:
            driver.quit()