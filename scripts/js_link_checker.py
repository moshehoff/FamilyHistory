"""
JavaScript Link Checker - בודק את כל הלינקים באתר כולל כאלה שנוצרים ב-JavaScript
משתמש ב-Playwright להרצת JavaScript וחילוץ לינקים מה-DOM המרונדר
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
    print("❌ Playwright לא מותקן!")
    print("📦 התקן עם: pip install playwright")
    print("🔧 ואז: playwright install chromium")
    sys.exit(1)


class JSLinkChecker:
    """בודק לינקים באתר כולל כאלה שנוצרים ב-JavaScript"""
    
    def __init__(self, start_url: str, max_depth: int = 50, wait_time: int = 3):
        """
        Args:
            start_url: URL התחלתי לסריקה
            max_depth: עומק מקסימלי לסריקה
            wait_time: זמן המתנה (בשניות) שהדף יטען לפני חילוץ לינקים
        """
        self.start_url = start_url.rstrip('/')
        parsed = urlparse(self.start_url)
        self.base_scheme = parsed.scheme
        self.base_netloc = parsed.netloc
        self.base_path = parsed.path.rstrip('/')
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
        self.wait_time = wait_time * 1000  # המרה למילישניות
        
        # אתחל Playwright
        self.playwright = None
        self.browser = None
        self.page = None
        
    def start_browser(self):
        """מתחיל את הדפדפן"""
        try:
            self.playwright = sync_playwright().start()
            self.browser = self.playwright.chromium.launch(headless=True)
            context = self.browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Link Checker Bot)'
            )
            self.page = context.new_page()
            self.page.set_default_timeout(30000)  # 30 שניות
            print("✅ דפדפן הותחל בהצלחה")
        except Exception as e:
            print(f"❌ שגיאה בהפעלת דפדפן: {e}")
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
        """בודק אם URL שייך לאותו domain"""
        parsed = urlparse(url)
        if parsed.scheme != self.base_scheme or parsed.netloc != self.base_netloc:
            return False
        if self.base_path:
            url_path = parsed.path.rstrip('/')
            if not url_path.startswith(self.base_path):
                return False
        return True
    
    def normalize_url(self, url: str, current_url: str = None) -> Optional[str]:
        """מנרמל URL"""
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
        
        # הסר fragment
        parsed = urlparse(normalized)
        normalized = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            parsed.query,
            ''  # הסר fragment
        ))
        
        # הסר trailing slash
        if normalized.endswith('/') and normalized != self.base_url + '/':
            normalized = normalized.rstrip('/')
        
        return normalized
    
    def should_skip_url(self, url: str) -> bool:
        """בודק אם צריך לדלג על URL"""
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
        """בודק סטטוס של URL"""
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
    
    def extract_all_links(self, url: str) -> Set[str]:
        """מחלץ את כל הלינקים מהדף אחרי ש-JavaScript רץ"""
        links = set()
        
        try:
            # טען את הדף
            self.page.goto(url, wait_until='networkidle', timeout=30000)
            
            # המתן שהדף יטען לגמרי (חשוב ל-JavaScript דינמי)
            self.page.wait_for_timeout(self.wait_time)
            
            # חלץ את כל הלינקים מה-DOM
            # כולל כאלה שנוצרו ב-JavaScript
            all_links = self.page.query_selector_all('a[href]')
            
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
                    
                    # נרמל את ה-URL
                    normalized = self.normalize_url(href, url)
                    if normalized:
                        links.add(normalized)
                except:
                    continue
            
            # גם תמונות
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
            print(f"   ⚠️  Timeout בטעינת הדף: {url}")
        except Exception as e:
            print(f"   ⚠️  שגיאה בטעינת הדף: {url} - {e}")
        
        return links
    
    def crawl(self, verbose: bool = True):
        """מבצע סריקה של כל הלינקים"""
        if verbose:
            print(f"🚀 מתחיל סריקה מ: {self.start_url}")
            print(f"📌 Base URL: {self.base_url}")
            print(f"⏱️  זמן המתנה לדף: {self.wait_time/1000} שניות")
            print(f"🌐 משתמש ב-Playwright לבדיקת JavaScript\n")
        
        # התחל דפדפן
        self.start_browser()
        
        try:
            while self.to_visit:
                current_url, depth = self.to_visit.popleft()
                
                # בדוק עומק
                if depth > self.max_depth:
                    if verbose:
                        print(f"⚠️  הגעת לעומק מקסימלי: {current_url}")
                    continue
                
                # בדוק אם צריך לדלג
                if self.should_skip_url(current_url):
                    continue
                
                # סמן כביקר
                self.visited.add(current_url)
                self.stats['pages_checked'] += 1
                
                if verbose:
                    print(f"[{self.stats['pages_checked']}] בודק: {current_url} (עומק: {depth})")
                
                # בדוק את ה-URL עצמו
                check_result = self.check_url_status(current_url)
                check_result['source'] = current_url
                
                if not check_result['valid']:
                    self.broken_links.append(check_result)
                    if verbose:
                        print(f"   ❌ שבור: {check_result.get('error', 'Unknown error')}")
                    continue
                
                self.valid_links.append(check_result)
                
                # חלץ לינקים מהדף
                links = self.extract_all_links(current_url)
                self.stats['links_found'] += len(links)
                
                if verbose and links:
                    print(f"   📎 נמצאו {len(links)} לינקים")
                
                # הוסף לינקים חדשים לתור
                for link in links:
                    normalized = self.normalize_url(link, current_url)
                    
                    if not normalized:
                        continue
                    
                    if self.should_skip_url(normalized):
                        if not self.is_same_domain(normalized):
                            self.skipped_links.append({
                                'url': normalized,
                                'reason': 'External link',
                                'source': current_url
                            })
                        continue
                    
                    # הוסף לתור אם לא ביקרנו
                    if normalized not in self.visited and (normalized, depth + 1) not in self.to_visit:
                        self.to_visit.append((normalized, depth + 1))
                
                # השהיה קצרה בין דפים
                time.sleep(0.5)
        
        finally:
            self.close_browser()
        
        if verbose:
            print(f"\n✅ סריקה הושלמה!")
            self.print_summary()
    
    def print_summary(self):
        """מדפיס סיכום"""
        elapsed = time.time() - self.stats['start_time']
        
        print("\n" + "="*70)
        print("📊 סיכום סריקה")
        print("="*70)
        print(f"🌐 Base URL: {self.base_url}")
        print(f"⏱️  זמן כולל: {elapsed:.2f} שניות")
        print(f"📄 דפים שנבדקו: {self.stats['pages_checked']}")
        print(f"🔗 לינקים שנמצאו: {self.stats['links_found']}")
        print(f"✅ לינקים תקינים: {len(self.valid_links)}")
        print(f"❌ לינקים שבורים: {len(self.broken_links)}")
        print(f"⏭️  לינקים שדולגו: {len(self.skipped_links)}")
        print(f"📊 סה\"כ URLs ייחודיים: {len(self.visited)}")
        
        if self.broken_links:
            print(f"\n❌ לינקים שבורים ({len(self.broken_links)}):")
            for link in self.broken_links[:20]:
                print(f"   - {link['url']}")
                print(f"     מקור: {link.get('source', 'N/A')}")
                print(f"     שגיאה: {link.get('error', 'Unknown')}")
            if len(self.broken_links) > 20:
                print(f"   ... ועוד {len(self.broken_links) - 20}")
    
    def save_report(self, filename: str = 'js_link_check_report.json'):
        """שומר דוח ל-JSON"""
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
        
        print(f"\n📄 דוח מלא נשמר ב: {filename}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='בודק את כל הלינקים באתר כולל כאלה שנוצרים ב-JavaScript',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
דוגמאות:
  # בדוק אתר חיצוני
  python js_link_checker.py https://moshehoff.github.io/FamilyHistory
  
  # בדוק אתר מקומי
  python js_link_checker.py http://localhost:8080
  
  # עם זמן המתנה מותאם
  python js_link_checker.py http://localhost:8080 --wait-time 5
  
  # הגבל עומק
  python js_link_checker.py http://localhost:8080 --max-depth 10
        """
    )
    
    parser.add_argument('url', help='URL התחלתי לסריקה')
    parser.add_argument('--max-depth', type=int, default=50,
                       help='עומק מקסימלי לסריקה (ברירת מחדל: 50)')
    parser.add_argument('--wait-time', type=int, default=3,
                       help='זמן המתנה (בשניות) שהדף יטען לפני חילוץ לינקים (ברירת מחדל: 3)')
    parser.add_argument('--quiet', action='store_true',
                       help='פלט מינימלי')
    parser.add_argument('--output', default='js_link_check_report.json',
                       help='שם קובץ הדוח (ברירת מחדל: js_link_check_report.json)')
    
    args = parser.parse_args()
    
    # בדוק URL
    if not args.url.startswith(('http://', 'https://')):
        print("❌ שגיאה: URL חייב להתחיל ב-http:// או https://")
        sys.exit(1)
    
    # צור checker
    checker = JSLinkChecker(
        start_url=args.url,
        max_depth=args.max_depth,
        wait_time=args.wait_time
    )
    
    # הרץ סריקה
    try:
        checker.crawl(verbose=not args.quiet)
        checker.save_report(args.output)
        
        # קוד יציאה בהתאם לתוצאות
        if checker.broken_links:
            print(f"\n⚠️  נמצאו {len(checker.broken_links)} לינקים שבורים!")
            sys.exit(1)
        else:
            print("\n✅ כל הלינקים תקינים!")
            sys.exit(0)
    
    except KeyboardInterrupt:
        print("\n\n⚠️  סריקה הופסקה על ידי המשתמש")
        checker.save_report(args.output)
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ שגיאה: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

