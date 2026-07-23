from playwright.sync_api import sync_playwright
import time
import os

os.makedirs("/home/jules/verification/videos", exist_ok=True)
os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

def run_cuj(page):
    print("Navigating to frontend...")
    page.goto("http://localhost:5173")
    page.wait_for_timeout(2000)

    # Click the copilot focus button to view Recommendations more easily
    print("Switching to Map Focus view...")
    # Map Focus hotkey is 2, or button
    page.keyboard.press("2")
    page.wait_for_timeout(2000)

    # We should see RecommendationPanel with Fast Path and Guardrailed
    print("Taking screenshot of recommendation panel...")
    page.screenshot(path="/home/jules/verification/screenshots/recommendation_panel.png")
    page.wait_for_timeout(1000)

    print("Switching to Overview view...")
    page.keyboard.press("1")
    page.wait_for_timeout(1000)

    print("Taking final dashboard screenshot...")
    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(2000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
