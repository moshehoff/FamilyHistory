"""
JavaScript Link Checker - Checks all links on a website including those created by JavaScript
Uses Playwright to run JavaScript and extract links from the rendered DOM
"""

import sys
import json
import time
from urllib.parse import urljoin, urlparse, urlunparse
from collections import deque
from typing import Set, Dict, List, Optional
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    print("❌ Playwright is not installed!")
    print("📦 Install with: pip install playwright")
    print("🔧 Then: playwright install chromium")
    sys.exit(1)


class JSLinkChecker:
    """Checks links on a website including those created by JavaScript"""
    
    def __init__(self, start_url: str, max_depth: int = 50, wait_time: int = 3, stop_on_first_error: bool = False, skip_static_links: bool = True):
        """
        Args:
            start_url: Starting URL for crawling
            max_depth: Maximum crawl depth
            wait_time: Wait time (in seconds) for page to load before extracting links
            stop_on_first_error: If True, stops at the first broken link
            skip_static_links: If True, only checks links created dynamically by JavaScript (default: True)
        """
        self.start_url = start_url.rstrip('/')
        parsed = urlparse(self.start_url)
        self.base_scheme = parsed.scheme
        self.base_netloc = parsed.netloc
        # קח רק את ה-base path הראשי (למשל /FamilyHistory), לא את ה-path המלא
        full_path = parsed.path.rstrip('/')
        # מצא את ה-base path הראשי (עד הסלאש הראשון אחרי השורש)
        if full_path:
            # אם יש /FamilyHistory/profiles/..., קח רק /FamilyHistory
            # split('/') על '/FamilyHistory/profiles' יתן ['', 'FamilyHistory', 'profiles']
            path_parts = full_path.split('/')
            if len(path_parts) > 1 and path_parts[1]:  # יש חלק ראשון (אחרי הסלאש הראשון)
                self.base_path = '/' + path_parts[1]  # למשל /FamilyHistory
            else:
                self.base_path = full_path if full_path.startswith('/') else '/' + full_path
        else:
            self.base_path = ''
        self.base_url = f"{self.base_scheme}://{self.base_netloc}{self.base_path}"
        
        self.visited: Set[str] = set()
        self.to_visit: deque = deque([(start_url, 0)])
        
        self.valid_links: List[Dict] = []
        self.broken_links: List[Dict] = []
        self.skipped_links: List[Dict] = []
        
        self.stats = {
            'pages_checked': 0,
            'links_found': 0,
            'start_time': time.time()
        }
        
        self.max_depth = max_depth
        self.wait_time = wait_time * 1000  # Convert to milliseconds
        self.stop_on_first_error = stop_on_first_error
        self.skip_static_links = skip_static_links
        
        # אתחל Playwright
        self.playwright = None
        self.browser = None
        self.page = None
        
    def start_browser(self, verbose: bool = True):
        """Starts the browser"""
        try:
            if verbose:
                print("🔄 Starting browser...", flush=True)
            self.playwright = sync_playwright().start()
            self.browser = self.playwright.chromium.launch(headless=True)
            context = self.browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Link Checker Bot)'
            )
            self.page = context.new_page()
            self.page.set_default_timeout(30000)  # 30 seconds
            if verbose:
                print("✅ Browser started successfully\n", flush=True)
        except Exception as e:
            print(f"❌ Error starting browser: {e}", flush=True)
            raise
    
    def close_browser(self):
        """סוגר את הדפדפן"""
        try:
            if self.page:
                self.page.close()
            if self.browser:
                self.browser.close()
            if self.playwright:
                self.playwright.stop()
        except:
            pass
    
    def is_same_domain(self, url: str) -> bool:
        """Checks if URL belongs to the same domain"""
        parsed = urlparse(url)
        if parsed.scheme != self.base_scheme or parsed.netloc != self.base_netloc:
            return False
        if self.base_path:
            url_path = parsed.path.rstrip('/')
            if not url_path.startswith(self.base_path):
                return False
        return True
    
    def normalize_url(self, url: str, current_url: str = None) -> Optional[str]:
        """Normalizes URL"""
        if url.startswith(('mailto:', 'tel:', 'data:', 'javascript:')):
            return None
        
        # המר ל-URL מוחלט
        if url.startswith('/'):
            normalized = urljoin(self.base_url, url)
        elif url.startswith(('http://', 'https://')):
            normalized = url
        elif current_url:
            normalized = urljoin(current_url, url)
        else:
            normalized = urljoin(self.base_url, url)
        
        # Keep fragment (hash) - it's important for single-page apps
        # Don't remove it like before
        
        # הסר trailing slash
        if normalized.endswith('/') and normalized != self.base_url + '/':
            normalized = normalized.rstrip('/')
        
        return normalized
    
    def should_skip_url(self, url: str) -> bool:
        """Checks if URL should be skipped"""
        if url in self.visited:
            return True
        if not self.is_same_domain(url):
            return True
        
        # דלג על קבצים ספציפיים
        skip_extensions = {'.pdf', '.zip', '.jpg', '.jpeg', '.png', '.gif', 
                          '.svg', '.ico', '.css', '.js', '.json', '.xml', '.woff', '.woff2'}
        if any(url.lower().endswith(ext) for ext in skip_extensions):
            return True
        
        return False
    
    def check_url_status(self, url: str) -> Dict:
        """Checks URL status"""
        try:
            response = self.page.goto(url, wait_until='networkidle', timeout=30000)
            status = response.status
            
            if status >= 400:
                return {
                    'url': url,
                    'status': status,
                    'valid': False,
                    'error': f'HTTP {status}'
                }
            else:
                return {
                    'url': url,
                    'status': status,
                    'valid': True
                }
        except PlaywrightTimeout:
            return {
                'url': url,
                'valid': False,
                'error': 'Timeout'
            }
        except Exception as e:
            return {
                'url': url,
                'valid': False,
                'error': str(e)
            }
    
    def extract_all_links(self, url: str, verbose: bool = True, skip_static: bool = True) -> Set[str]:
        """Extracts all links from the page after JavaScript runs
        
        Args:
            url: URL to extract links from
            verbose: Whether to print verbose output
            skip_static: If True, only extract links created dynamically by JavaScript
        """
        links = set()
        static_links = set()
        
        try:
            # First, get the initial HTML (before JavaScript runs) to find static links
            if skip_static:
                if verbose:
                    print(f"      ⏳ Loading initial HTML (before JavaScript)...", flush=True)
                # Use requests to get the raw HTML without JavaScript
                import requests
                try:
                    response = requests.get(url, timeout=10)
                    if response.status_code == 200:
                        from bs4 import BeautifulSoup
                        soup = BeautifulSoup(response.text, 'html.parser')
                        # Extract all static links
                        for a_tag in soup.find_all('a', href=True):
                            href = a_tag.get('href', '')
                            # Skip empty links and protocol-based links, but keep fragments like #chapter=...
                            if not href or href.startswith(('javascript:', 'mailto:', 'tel:', 'data:')):
                                continue
                            # Skip only empty anchors like '#'
                            if href == '#':
                                continue
                            normalized = self.normalize_url(href, url)
                            if normalized:
                                static_links.add(normalized)
                        if verbose:
                            print(f"      📋 Found {len(static_links)} static links in HTML", flush=True)
                except Exception as e:
                    if verbose:
                        print(f"      ⚠️  Could not extract static links: {e}", flush=True)
            
            # Load the page with JavaScript
            if verbose:
                print(f"      ⏳ Loading page with JavaScript...", flush=True)
            self.page.goto(url, wait_until='networkidle', timeout=30000)
            
            # Wait for page to fully load (important for dynamic JavaScript)
            if verbose:
                print(f"      ⏳ Waiting for JavaScript to execute ({self.wait_time/1000}s)...", flush=True)
            self.page.wait_for_timeout(self.wait_time)
            
            # Wait for backlinks to load (they're created dynamically)
            # Backlinks might take time to load, so wait for them specifically
            if verbose:
                print(f"      ⏳ Waiting for backlinks to load...", flush=True)
            try:
                # Wait for backlinks section to appear
                self.page.wait_for_selector('.backlinks', timeout=10000, state='attached')
                
                # Wait until there are actual links in backlinks (they might be added asynchronously)
                max_wait = 10  # Maximum 10 seconds
                wait_interval = 500  # Check every 500ms
                waited = 0
                backlink_links = []
                
                while waited < max_wait * 1000:
                    backlink_links = self.page.query_selector_all('.backlinks a[href]')
                    if len(backlink_links) > 0:
                        if verbose:
                            print(f"      ✅ Found {len(backlink_links)} backlinks after {waited/1000:.1f}s", flush=True)
                        break
                    self.page.wait_for_timeout(wait_interval)
                    waited += wait_interval
                
                if len(backlink_links) == 0:
                    if verbose:
                        print(f"      ℹ️  No backlinks found (waited {waited/1000:.1f}s)", flush=True)
            except Exception as e:
                # Backlinks section might not exist, continue
                if verbose:
                    print(f"      ℹ️  Backlinks section not found: {e}", flush=True)
                pass
            
            # Try to click on Biography tab to reveal chapter links
            if verbose:
                print(f"      ⏳ Trying to click Biography tab to reveal chapters...", flush=True)
            try:
                # Look for Biography tab and click it
                bio_tabs = self.page.query_selector_all('button[data-tab="biography"], .tab-button:has-text("Biography"), button:has-text("Biography")')
                if bio_tabs:
                    bio_tabs[0].click()
                    self.page.wait_for_timeout(1000)  # Wait for tab to load
                    if verbose:
                        print(f"      ✅ Clicked Biography tab", flush=True)
                    
                    # Try to click on ALL chapters to reveal all table of contents
                    chapters = self.page.query_selector_all('.chapter-link, .chapter-item, button[data-chapter]')
                    if chapters and len(chapters) > 0:
                        if verbose:
                            print(f"      ⏳ Found {len(chapters)} chapters, clicking each to reveal TOC...", flush=True)
                        
                        for i, chapter in enumerate(chapters):
                            try:
                                chapter.click()
                                self.page.wait_for_timeout(500)  # Wait for TOC to load
                                if verbose:
                                    print(f"      ✅ Clicked chapter {i+1}/{len(chapters)}", flush=True)
                            except Exception as e:
                                if verbose:
                                    print(f"      ⚠️  Could not click chapter {i+1}: {e}", flush=True)
                                continue
                        
                        # Wait a bit more for all TOCs to fully load
                        self.page.wait_for_timeout(1000)
                        if verbose:
                            print(f"      ✅ Finished clicking all chapters", flush=True)
            except Exception as e:
                if verbose:
                    print(f"      ℹ️  Could not interact with Biography tab: {e}", flush=True)
                pass
            
            # Extract all links from the DOM (after JavaScript runs)
            # Including those created by JavaScript (including backlinks)
            all_links = self.page.query_selector_all('a[href]')
            
            if verbose:
                # Count links in backlinks section specifically
                backlink_links = self.page.query_selector_all('.backlinks a[href]')
                if backlink_links:
                    print(f"      📎 Found {len(backlink_links)} links in backlinks section", flush=True)
            
            # Count links starting with # for debugging
            fragment_links = []
            
            for link_element in all_links:
                try:
                    href = link_element.get_attribute('href')
                    if not href:
                        continue
                    
                    # דלג על סוגי לינקים לא רלוונטיים
                    if href.startswith(('javascript:', 'mailto:', 'tel:', 'data:')):
                        continue
                    
                    # דלג על anchors פנימיים בלבד
                    if href == '#' or (href.startswith('#') and len(href) == 1):
                        continue
                    
                    # Track fragment links for debugging
                    if href.startswith('#'):
                        fragment_links.append(href)
                    
                    # Normalize the URL
                    normalized = self.normalize_url(href, url)
                    if normalized:
                        # If skip_static is True, only add links that weren't in the static HTML
                        if skip_static and normalized in static_links:
                            continue  # Skip static links
                        links.add(normalized)
                except:
                    continue
            
            # Debug: show fragment links found
            if verbose and fragment_links:
                print(f"      🔍 Found {len(fragment_links)} fragment links (starting with #):", flush=True)
                for frag in fragment_links[:10]:  # Show first 10
                    print(f"         • {frag}", flush=True)
                if len(fragment_links) > 10:
                    print(f"         ... and {len(fragment_links) - 10} more", flush=True)
            
            # Images - only if they're dynamically added (skip static images)
            if not skip_static:
                all_images = self.page.query_selector_all('img[src]')
                for img_element in all_images:
                    try:
                        src = img_element.get_attribute('src')
                        if src and not src.startswith('data:'):
                            normalized = self.normalize_url(src, url)
                            if normalized:
                                links.add(normalized)
                    except:
                        continue
            
            # גם background images מ-CSS (אם אפשר)
            # זה מורכב יותר, אבל אפשר לנסות
            
        except PlaywrightTimeout:
            if verbose:
                print(f"   ⚠️  Timeout loading page: {url}", flush=True)
        except Exception as e:
            if verbose:
                print(f"   ⚠️  Error loading page: {url} - {e}", flush=True)
        
        return links
    
    def crawl(self, verbose: bool = True):
        """Crawls all links"""
        if verbose:
            print(f"🚀 Starting crawl from: {self.start_url}", flush=True)
            print(f"📌 Base URL: {self.base_url}", flush=True)
            print(f"⏱️  Page wait time: {self.wait_time/1000} seconds", flush=True)
            print(f"🌐 Using Playwright for JavaScript link checking\n", flush=True)
        
        # Start browser
        self.start_browser(verbose=verbose)
        
        try:
            while self.to_visit:
                current_url, depth = self.to_visit.popleft()
                
                # Check depth
                if depth > self.max_depth:
                    if verbose:
                        print(f"   ⚠️  Max depth reached ({self.max_depth}): {current_url}")
                    continue
                
                # Check if should skip
                if self.should_skip_url(current_url):
                    if verbose:
                        print(f"   ⏭️  Skipped: {current_url} (already visited/external/file type)")
                    continue
                
                # Mark as visited
                self.visited.add(current_url)
                self.stats['pages_checked'] += 1
                
                if verbose:
                    print(f"\n[{self.stats['pages_checked']}] 📄 Checking page: {current_url} (depth: {depth})", flush=True)
                    print(f"   🔄 Loading page...", flush=True)
                
                # Check the URL itself
                if verbose:
                    print(f"   🔍 Checking URL status...", flush=True)
                check_result = self.check_url_status(current_url)
                check_result['source'] = current_url
                
                if not check_result['valid']:
                    self.broken_links.append(check_result)
                    if verbose:
                        status = check_result.get('status', 'N/A')
                        error = check_result.get('error', 'Unknown error')
                        print(f"   ❌ Page is broken! (HTTP {status}: {error})", flush=True)
                        print(f"\n❌ Found broken link!", flush=True)
                        print(f"   🔗 Broken URL: {check_result['url']}", flush=True)
                        print(f"   📄 Found on page: {current_url}", flush=True)
                        print(f"   ⚠️  Error: {error}", flush=True)
                    if self.stop_on_first_error:
                        if verbose:
                            print(f"\n🛑 Stopping at first broken link (--stop-on-first-error)", flush=True)
                        return
                    continue
                
                status = check_result.get('status', 'OK')
                if verbose:
                    print(f"   ✅ Page is valid (HTTP {status})", flush=True)
                self.valid_links.append(check_result)
                
                # Extract links from page (only dynamic links, skip static)
                if verbose:
                    print(f"   🔍 Extracting dynamic links from page (skipping static HTML links)...", flush=True)
                links = self.extract_all_links(current_url, verbose=verbose, skip_static=self.skip_static_links)
                self.stats['links_found'] += len(links)
                
                if verbose and links:
                    print(f"   📎 Found {len(links)} links", flush=True)
                    if verbose and len(links) <= 20:  # Show only if few links
                        for i, link in enumerate(list(links)[:10], 1):  # Show first 10
                            print(f"      {i}. {link}", flush=True)
                        if len(links) > 10:
                            print(f"      ... and {len(links) - 10} more links", flush=True)
                
                # If we've reached max_depth, only read links but don't check them
                if depth >= self.max_depth:
                    if verbose:
                        print(f"   ℹ️  Max depth reached ({self.max_depth}) - only reading links, not checking them", flush=True)
                    # Just record that we found links, but don't check them
                    checked_count = 0
                    skipped_count = 0
                    for link in links:
                        normalized = self.normalize_url(link, current_url)
                        if normalized and not self.should_skip_url(normalized):
                            skipped_count += 1
                            if verbose:
                                print(f"      📖 Found link (not checking): {normalized}", flush=True)
                else:
                    # Check links immediately (only if depth < max_depth)
                    checked_count = 0
                    skipped_count = 0
                    for link in links:
                        normalized = self.normalize_url(link, current_url)
                        
                        if not normalized:
                            if verbose:
                                print(f"      ⏭️  Skipped invalid link: {link}")
                            continue
                        
                        if self.should_skip_url(normalized):
                            if not self.is_same_domain(normalized):
                                self.skipped_links.append({
                                    'url': normalized,
                                    'reason': 'External link',
                                    'source': current_url
                                })
                                if verbose:
                                    print(f"      🌐 External link: {normalized}", flush=True)
                            else:
                                if verbose:
                                    print(f"      ⏭️  Skipped: {normalized} (file type/other)", flush=True)
                            skipped_count += 1
                            continue
                        
                        # Check if already visited - don't check again
                        if normalized in self.visited:
                            if verbose:
                                print(f"      ⏭️  Already visited: {normalized}", flush=True)
                            skipped_count += 1
                            continue
                        
                        # Check if already in queue - don't check again
                        if (normalized, depth + 1) in self.to_visit:
                            if verbose:
                                print(f"      ⏭️  Already in queue: {normalized}", flush=True)
                            skipped_count += 1
                            continue
                        
                        # Check the link immediately (even without stop_on_first_error, to find broken links)
                        if verbose:
                            print(f"      🔗 Checking: {normalized}", flush=True)
                        link_check = self.check_url_status(normalized)
                        link_check['source'] = current_url
                        checked_count += 1
                        
                        if not link_check['valid']:
                            self.broken_links.append(link_check)
                            # Mark as visited even if broken, to avoid checking again
                            self.visited.add(normalized)
                            if verbose:
                                print(f"         ❌ Broken! ({link_check.get('error', 'Unknown error')})", flush=True)
                                print(f"\n❌ Found broken link!", flush=True)
                                print(f"   🔗 Broken URL: {link_check['url']}", flush=True)
                                print(f"   📄 Found on page: {current_url}", flush=True)
                                print(f"   ⚠️  Error: {link_check.get('error', 'Unknown error')}", flush=True)
                            if self.stop_on_first_error:
                                if verbose:
                                    print(f"\n🛑 Stopping at first broken link (--stop-on-first-error)", flush=True)
                                return
                        else:
                            if verbose:
                                status = link_check.get('status', 'OK')
                                print(f"         ✅ Valid (HTTP {status})", flush=True)
                            # Valid link - add to valid_links, mark as visited and add to queue
                            self.valid_links.append(link_check)
                            # Mark as visited here to prevent checking it again from other pages
                            self.visited.add(normalized)
                            if (normalized, depth + 1) not in self.to_visit:
                                self.to_visit.append((normalized, depth + 1))
                                if verbose:
                                    print(f"         ➕ Added to crawl queue", flush=True)
                            else:
                                if verbose:
                                    print(f"         ℹ️  Already in queue", flush=True)
                
                if verbose:
                    print(f"   📊 Summary: {checked_count} checked, {skipped_count} skipped, {len(self.to_visit)} in queue", flush=True)
                
                # השהיה קצרה בין דפים
                time.sleep(0.5)
        
        finally:
            self.close_browser()
        
        if verbose:
            print(f"\n✅ Crawl completed!", flush=True)
            self.print_summary()
    
    def print_summary(self):
        """Prints summary"""
        elapsed = time.time() - self.stats['start_time']
        
        print("\n" + "="*70, flush=True)
        print("📊 CRAWL SUMMARY", flush=True)
        print("="*70, flush=True)
        print(f"🌐 Base URL: {self.base_url}", flush=True)
        print(f"⏱️  Total time: {elapsed:.2f} seconds", flush=True)
        print(f"📄 Pages checked: {self.stats['pages_checked']}", flush=True)
        print(f"🔗 Links found: {self.stats['links_found']}", flush=True)
        print(f"✅ Valid links: {len(self.valid_links)}", flush=True)
        print(f"❌ Broken links: {len(self.broken_links)}", flush=True)
        print(f"⏭️  Skipped links: {len(self.skipped_links)}", flush=True)
        print(f"📊 Total unique URLs: {len(self.visited)}", flush=True)
        
        if self.broken_links:
            print(f"\n❌ Broken links ({len(self.broken_links)}):")
            for link in self.broken_links[:20]:
                print(f"   - {link['url']}")
                print(f"     Source: {link.get('source', 'N/A')}")
                print(f"     Error: {link.get('error', 'Unknown')}")
            if len(self.broken_links) > 20:
                print(f"   ... and {len(self.broken_links) - 20} more")
    
    def save_report(self, filename: str = 'js_link_check_report.json'):
        """Saves report to JSON"""
        report = {
            'base_url': self.base_url,
            'start_url': self.start_url,
            'crawl_time': time.strftime('%Y-%m-%d %H:%M:%S'),
            'stats': {
                **self.stats,
                'elapsed_time': time.time() - self.stats['start_time']
            },
            'summary': {
                'pages_checked': self.stats['pages_checked'],
                'valid_links': len(self.valid_links),
                'broken_links': len(self.broken_links),
                'skipped_links': len(self.skipped_links),
                'total_visited': len(self.visited)
            },
            'broken_links': self.broken_links,
            'valid_links_sample': self.valid_links[:100],
            'skipped_links_sample': self.skipped_links[:50]
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Full report saved to: {filename}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Checks all links on a website including those created by JavaScript',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Check external site
  python js_link_checker.py https://moshehoff.github.io/FamilyHistory
  
  # Check local site
  python js_link_checker.py http://localhost:8080
  
  # Stop at first broken link
  python js_link_checker.py http://localhost:8080 --stop-on-first-error
  
  # With custom wait time
  python js_link_checker.py http://localhost:8080 --wait-time 5
  
  # Limit depth
  python js_link_checker.py http://localhost:8080 --max-depth 10
        """
    )
    
    parser.add_argument('url', help='Starting URL for crawling')
    parser.add_argument('--max-depth', type=int, default=50,
                       help='Maximum crawl depth (default: 50)')
    parser.add_argument('--wait-time', type=int, default=5,
                       help='Wait time (in seconds) for page to load before extracting links (default: 5)')
    parser.add_argument('--quiet', action='store_true',
                       help='Minimal output')
    parser.add_argument('--output', default='js_link_check_report.json',
                       help='Report filename (default: js_link_check_report.json)')
    parser.add_argument('--stop-on-first-error', action='store_true',
                       help='Stop at first broken link and show which page it was found on')
    parser.add_argument('--include-static', action='store_true',
                       help='Include static HTML links (by default, only dynamic JavaScript links are checked)')
    
    args = parser.parse_args()
    
    # skip_static_links is True by default, unless --include-static is used
    args.skip_static_links = not args.include_static
    
    # Validate URL
    if not args.url.startswith(('http://', 'https://')):
        print("❌ Error: URL must start with http:// or https://")
        sys.exit(1)
    
    # Create checker
    checker = JSLinkChecker(
        start_url=args.url,
        max_depth=args.max_depth,
        wait_time=args.wait_time,
        stop_on_first_error=args.stop_on_first_error,
        skip_static_links=args.skip_static_links
    )
    
    # Run crawl
    try:
        checker.crawl(verbose=not args.quiet)
        checker.save_report(args.output)
        
        # Exit code based on results
        if checker.broken_links:
            print(f"\n⚠️  Found {len(checker.broken_links)} broken links!")
            sys.exit(1)
        else:
            print("\n✅ All links are valid!")
            sys.exit(0)
    
    except KeyboardInterrupt:
        print("\n\n⚠️  Crawl interrupted by user")
        checker.save_report(args.output)
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

