"""
Crawler שמבצע DFS על כל הלינקים באתר
בודק שכל הלינקים תקינים ולא שבורים
עובד גם על אתר פנימי וגם חיצוני
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urlunparse
from urllib.robotparser import RobotFileParser
from collections import deque
import time
import json
from typing import Set, Dict, List, Optional
import sys
import io

# Fix encoding for Windows console
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

class LinkCrawler:
    def __init__(self, start_url: str, max_depth: int = 100, delay: float = 0.1):
        """
        Args:
            start_url: URL התחלתי לסריקה
            max_depth: עומק מקסימלי לסריקה (למניעת לולאות אינסופיות)
            delay: השהיה בין בקשות (בשניות)
        """
        self.start_url = start_url.rstrip('/')
        parsed = urlparse(self.start_url)
        self.base_scheme = parsed.scheme
        self.base_netloc = parsed.netloc
        self.base_path = parsed.path.rstrip('/')
        
        # Base URL כולל path (למשל: https://moshehoff.github.io/FamilyHistory)
        self.base_url = f"{self.base_scheme}://{self.base_netloc}{self.base_path}"
        
        # URLs שכבר נבדקו
        self.visited: Set[str] = set()
        
        # תור לסריקה (DFS stack)
        self.to_visit: deque = deque([(start_url, 0)])  # (url, depth)
        
        # תוצאות
        self.valid_links: List[Dict] = []
        self.broken_links: List[Dict] = []
        self.skipped_links: List[Dict] = []  # לינקים חיצוניים, anchors, וכו'
        
        # סטטיסטיקה
        self.stats = {
            'pages_checked': 0,
            'links_found': 0,
            'links_checked': 0,
            'start_time': time.time()
        }
        
        self.max_depth = max_depth
        self.delay = delay
        
        # Session לניהול cookies ו-connection pooling
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Link Crawler Bot)'
        })
        
        # Robots.txt parser (אופציונלי)
        self.robots_parser = None
        try:
            robots_url = urljoin(self.base_url, '/robots.txt')
            self.robots_parser = RobotFileParser()
            self.robots_parser.set_url(robots_url)
            self.robots_parser.read()
        except:
            pass  # אם אין robots.txt, נמשיך בלי
        
        # Chapters index data - loaded once and reused
        self.chapters_data = {}
        
        # ID to slug mapping - loaded once and reused
        self.id_to_slug = {}
    
    def is_same_domain(self, url: str) -> bool:
        """בודק אם URL שייך לאותו domain/base path"""
        parsed = urlparse(url)
        
        # חובה אותו scheme ו-netloc
        if parsed.scheme != self.base_scheme or parsed.netloc != self.base_netloc:
            return False
        
        # אם יש base_path, ה-URL חייב להתחיל איתו
        if self.base_path:
            url_path = parsed.path.rstrip('/')
            # בדיקה אם ה-URL מתחיל עם base_path
            if not url_path.startswith(self.base_path):
                return False
        
        return True
    
    def normalize_url(self, url: str, current_url: str = None) -> str:
        """מנרמל URL למייצג יחיד"""
        # דלג על mailto:, tel:, data: וכו' - החזר None
        if url.startswith(('mailto:', 'tel:', 'data:')):
            return None
        
        # אם זה לינק יחסי, הופך למוחלט
        if url.startswith('/'):
            # לינק יחסי מהשורש
            normalized = urljoin(self.base_url, url)
        elif url.startswith('http://') or url.startswith('https://'):
            # לינק מוחלט
            normalized = url
        elif current_url:
            # לינק יחסי מהדף הנוכחי
            normalized = urljoin(current_url, url)
        else:
            normalized = urljoin(self.base_url, url)
        
        # הסרת fragment (#anchor)
        parsed = urlparse(normalized)
        normalized = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            parsed.query,
            ''  # הסרת fragment
        ))
        
        # הסרת trailing slash (אלא אם זה directory)
        if normalized.endswith('/') and normalized != self.base_url + '/':
            normalized = normalized.rstrip('/')
        
        return normalized
    
    def should_skip_url(self, url: str) -> bool:
        """בודק אם צריך לדלג על URL"""
        # Skip אם כבר ביקרנו
        if url in self.visited:
            return True
        
        # Skip אם לא באותו domain
        if not self.is_same_domain(url):
            return True
        
        # Skip אם robots.txt אוסר
        if self.robots_parser and not self.robots_parser.can_fetch('*', url):
            return True
        
        # Skip קבצים ספציפיים (אופציונלי)
        skip_extensions = {'.pdf', '.zip', '.jpg', '.jpeg', '.png', '.gif', 
                          '.svg', '.ico', '.css', '.js', '.json', '.xml'}
        if any(url.lower().endswith(ext) for ext in skip_extensions):
            # אבל תמונות שמופיעות ב-HTML נבדקות
            return False  # נבדוק גם תמונות
        
        return False
    
    def check_url(self, url: str, source: str = "") -> Dict:
        """בודק אם URL תקין"""
        try:
            # נסה HEAD request קודם (מהיר יותר)
            response = self.session.head(url, timeout=10, allow_redirects=True)
            
            # אם HEAD לא נתמך, נסה GET
            if response.status_code == 405 or response.status_code == 501:
                response = self.session.get(url, timeout=10, allow_redirects=True, stream=True)
                response.close()
            
            status = response.status_code
            
            if status >= 400:
                return {
                    'url': url,
                    'status': status,
                    'valid': False,
                    'source': source,
                    'error': f'HTTP {status}'
                }
            else:
                return {
                    'url': url,
                    'status': status,
                    'valid': True,
                    'source': source
                }
                
        except requests.exceptions.Timeout:
            return {
                'url': url,
                'valid': False,
                'source': source,
                'error': 'Timeout'
            }
        except requests.exceptions.ConnectionError:
            return {
                'url': url,
                'valid': False,
                'source': source,
                'error': 'Connection error'
            }
        except Exception as e:
            return {
                'url': url,
                'valid': False,
                'source': source,
                'error': str(e)
            }
    
    def extract_links_from_mermaid(self, mermaid_code: str, current_url: str) -> Set[str]:
        """מחלץ לינקים מקוד Mermaid"""
        import re
        links = set()
        
        # חיפוש אחר click handlers ב-Mermaid
        # פורמט: click nodeId "../profiles/name" "label"
        # או: click nodeId "/profiles/name" "label"
        click_pattern = r'click\s+\w+\s+["\']([^"\']+)["\']'
        matches = re.findall(click_pattern, mermaid_code)
        
        for match in matches:
            # הסרת "../" אם קיים
            url = match.replace('../', '/')
            # אם זה לינק יחסי, הוסף את base path
            if url.startswith('/profiles/'):
                # בדוק אם זה לינק שבור (רק מספר או ID)
                path_part = url.replace('/profiles/', '')
                # זהה לינקים שבורים: רק מספר (39), או ID pattern (I123)
                if re.match(r'^[0-9]+$', path_part) or re.match(r'^I\d+', path_part):
                    # זה לינק שבור - הוסף אותו לרשימת הלינקים השבורים
                    normalized = self.normalize_url(url, current_url)
                    if normalized:
                        # בדוק אם הלינק באמת שבור
                        check_result = self.check_url(normalized)
                        if not check_result['valid']:
                            self.broken_links.append({
                                'url': normalized,
                                'valid': False,
                                'source': current_url,
                                'error': f'Broken Mermaid link: {url} (ID/number instead of slug)',
                                'original_url': url
                            })
                        links.add(normalized)  # הוסף גם אם שבור, כדי לבדוק אותו
                else:
                    normalized = self.normalize_url(url, current_url)
                    if normalized:
                        links.add(normalized)
        
        return links
    
    def extract_links(self, html: str, current_url: str) -> Set[str]:
        """מחלץ כל הלינקים מדף HTML"""
        soup = BeautifulSoup(html, 'html.parser')
        links = set()
        
        # לינקים רגילים (כולל בתוך SVG שנוצר על ידי Mermaid)
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            # דלג על javascript:, mailto:, tel:, וכו' (גם עם סלאש)
            if href.startswith(('javascript:', 'mailto:', 'tel:', 'data:')) or 'mailto:' in href.lower():
                continue
            # דלג על anchors פנימיים בלבד (#section)
            if href.startswith('#') and len(href) == 1:
                continue
            
            normalized = self.normalize_url(href, current_url)
            if normalized:
                links.add(normalized)
        
        # לינקים בתוך SVG (שנוצרו על ידי Mermaid)
        # Mermaid יוצר SVG עם <a> tags בתוכו
        for svg in soup.find_all('svg'):
            for a_tag in svg.find_all('a', href=True):
                href = a_tag['href']
                # דלג על javascript:, mailto:, tel:, וכו'
                if href.startswith(('javascript:', 'mailto:', 'tel:', 'data:')):
                    continue
                # דלג על anchors פנימיים בלבד (#section)
                if href.startswith('#') and len(href) == 1:
                    continue
                
                # בדוק אם זה לינק שבור (רק מספר או ID במקום slug)
                if href.startswith('/profiles/'):
                    path_part = href.replace('/profiles/', '')
                    # זהה לינקים שבורים: רק מספר (39), או ID pattern (I123)
                    import re
                    if re.match(r'^[0-9]+$', path_part) or re.match(r'^I\d+', path_part):
                        # זה לינק שבור - בדוק אותו והוסף לרשימת הלינקים השבורים
                        normalized = self.normalize_url(href, current_url)
                        if normalized:
                            check_result = self.check_url(normalized)
                            if not check_result['valid']:
                                self.broken_links.append({
                                    'url': normalized,
                                    'valid': False,
                                    'source': current_url,
                                    'error': f'Broken SVG link: {href} (ID/number instead of slug)',
                                    'original_url': href
                                })
                            links.add(normalized)  # הוסף גם אם שבור, כדי לבדוק אותו
                        continue
                
                normalized = self.normalize_url(href, current_url)
                if normalized:
                    links.add(normalized)
        
        # תמונות
        for img_tag in soup.find_all('img', src=True):
            src = img_tag['src']
            if not src.startswith('data:'):  # דלג על data URIs
                normalized = self.normalize_url(src, current_url)
                if normalized:
                    links.add(normalized)
        
        # CSS ב-background images (אופציונלי - מורכב יותר)
        # לינקים ב-<link> tags
        for link_tag in soup.find_all('link', href=True):
            href = link_tag['href']
            normalized = self.normalize_url(href, current_url)
            if normalized:
                links.add(normalized)
        
        # לינקים ב-Mermaid diagrams
        # חיפוש code blocks עם mermaid
        for code_block in soup.find_all('code'):
            code_classes = code_block.get('class', [])
            if code_classes and any('mermaid' in str(c).lower() for c in code_classes):
                mermaid_code = code_block.get_text()
                mermaid_links = self.extract_links_from_mermaid(mermaid_code, current_url)
                links.update(mermaid_links)
        
        # גם חיפוש pre > code עם mermaid
        for pre_block in soup.find_all('pre'):
            code_elem = pre_block.find('code')
            if code_elem:
                code_text = code_elem.get_text()
                code_classes = code_elem.get('class', [])
                # בדוק אם זה Mermaid
                is_mermaid = (
                    any('mermaid' in str(c).lower() for c in code_classes) or
                    code_text.strip().startswith(('flowchart', 'graph')) or
                    '```mermaid' in code_text
                )
                if is_mermaid:
                    mermaid_links = self.extract_links_from_mermaid(code_text, current_url)
                    links.update(mermaid_links)
        
        # גם חיפוש div.mermaid (אחרי ש-Mermaid רנדר)
        for mermaid_div in soup.find_all('div', class_='mermaid'):
            mermaid_code = mermaid_div.get_text()
            mermaid_links = self.extract_links_from_mermaid(mermaid_code, current_url)
            links.update(mermaid_links)
        
        # גם חיפוש pre.mermaid (לפני הרנדור)
        for pre_block in soup.find_all('pre', class_=lambda x: x and 'mermaid' in str(x).lower()):
            code_elem = pre_block.find('code')
            if code_elem:
                code_text = code_elem.get_text()
                mermaid_links = self.extract_links_from_mermaid(code_text, current_url)
                links.update(mermaid_links)
        
        return links
    
    def load_id_to_slug(self, verbose: bool = True) -> bool:
        """
        טוען את id-to-slug.json ושומר אותו במחלקה
        כל הגישה היא דרך HTTP בלבד - לא ניגש לקבצים מקומיים
        """
        if self.id_to_slug:
            return True  # כבר נטען
        
        id_to_slug_url = f"{self.base_url}/static/id-to-slug.json"
        try:
            response = self.session.get(id_to_slug_url, timeout=10)
            if response.status_code == 200:
                self.id_to_slug = response.json()
                
                if verbose:
                    print(f"🔗 Loaded ID to slug mapping with {len(self.id_to_slug)} entries")
                return True
                
        except requests.exceptions.RequestException as e:
            if verbose:
                print(f"⚠️  Could not load id-to-slug.json: {e}")
            return False
    
    def load_chapters_index(self, verbose: bool = True) -> bool:
        """
        טוען את chapters-index.json ושומר אותו במחלקה
        כל הגישה היא דרך HTTP בלבד - לא ניגש לקבצים מקומיים
        """
        if self.chapters_data:
            return True  # כבר נטען
        
        chapters_index_url = f"{self.base_url}/static/chapters-index.json"
        
        try:
            response = self.session.get(chapters_index_url, timeout=10)
            response.raise_for_status()
            self.chapters_data = response.json()
            
            if verbose:
                print(f"📚 Found chapters index with {len(self.chapters_data)} profiles")
            return True
                
        except requests.exceptions.RequestException as e:
            if verbose:
                print(f"⚠️  Could not load chapters index: {e}")
            return False
    
    def check_chapters_index(self, verbose: bool = True):
        """
        בודק לינקים בפרקים דרך chapters-index.json
        כל הגישה היא דרך HTTP בלבד - לא ניגש לקבצים מקומיים
        """
        if not self.load_chapters_index(verbose):
            return
        
        for profile_id, profile_chapters in self.chapters_data.items():
            # בדוק main chapter
            if 'main' in profile_chapters:
                main_file = profile_chapters['main'].get('filename', '')
                if main_file:
                    chapter_url = f"{self.base_url}/static/chapters/{profile_id}/{main_file}"
                    # הוסף לתור אם לא ביקרנו
                    if chapter_url not in self.visited and (chapter_url, 0) not in self.to_visit:
                        self.to_visit.append((chapter_url, 0))
            
            # בדוק שאר הפרקים
            for chapter in profile_chapters.get('chapters', []):
                chapter_file = chapter.get('filename', '')
                if chapter_file:
                    chapter_url = f"{self.base_url}/static/chapters/{profile_id}/{chapter_file}"
                    if chapter_url not in self.visited and (chapter_url, 0) not in self.to_visit:
                        self.to_visit.append((chapter_url, 0))
        
        if verbose:
            print(f"   Added {sum(1 for _ in self.to_visit if '/static/chapters/' in _[0])} chapter URLs to queue")
    
    def resolve_chapter_wikilink(self, wikilink_text: str, current_chapter_url: str) -> Optional[str]:
        """
        ממיר wikilink לפרק ל-URL של הפרק
        wikilink_text יכול להיות:
        - "bios/I11052340/02-savran_progrom" (full path)
        - "02-savran_progrom" (filename only)
        - "savran_progrom" (slug only)
        
        current_chapter_url: ה-URL של הפרק הנוכחי (למשל: http://localhost:8080/static/chapters/I11052340/01-in_russia.md)
        """
        if not self.chapters_data:
            return None
        
        # Extract profile ID from current chapter URL
        # URL format: /static/chapters/{profile_id}/{filename}
        import re
        match = re.search(r'/static/chapters/([^/]+)/', current_chapter_url)
        if not match:
            return None
        
        profile_id = match.group(1)
        if profile_id not in self.chapters_data:
            return None
        
        profile_chapters = self.chapters_data[profile_id]
        
        # Extract slug from wikilink
        # Remove path if present (e.g., "bios/I11052340/02-savran_progrom" -> "02-savran_progrom")
        slug = wikilink_text
        if '/' in slug:
            slug = slug.split('/')[-1]
        
        # Normalize slug (remove .md if present, replace _ with -, lowercase)
        slug = slug.replace('.md', '').replace('_', '-').lower()
        
        # Try to find matching chapter
        # Check main chapter
        if 'main' in profile_chapters:
            main = profile_chapters['main']
            main_slug = main.get('slug', '').lower()
            main_filename = main.get('filename', '').replace('.md', '').replace('_', '-').lower()
            main_name = main.get('name', '').lower().replace('_', '-')
            main_title = main.get('title', '').lower()
            
            # Try exact match
            if (main_slug == slug or 
                main_filename == slug or 
                main_name == slug or 
                main_title == slug):
                return f"{self.base_url}/static/chapters/{profile_id}/{main['filename']}"
            
            # Try match without leading numbers
            import re
            slug_without_numbers = re.sub(r'^\d+-', '', slug)
            main_filename_without_numbers = re.sub(r'^\d+-', '', main_filename)
            if main_filename_without_numbers == slug_without_numbers:
                return f"{self.base_url}/static/chapters/{profile_id}/{main['filename']}"
        
        # Check other chapters
        for chapter in profile_chapters.get('chapters', []):
            chapter_slug = chapter.get('slug', '').lower()
            chapter_filename = chapter.get('filename', '').replace('.md', '').replace('_', '-').lower()
            chapter_name = chapter.get('name', '').lower().replace('_', '-')
            chapter_title = chapter.get('title', '').lower()
            
            # Try exact match
            if (chapter_slug == slug or 
                chapter_filename == slug or 
                chapter_name == slug or 
                chapter_title == slug):
                return f"{self.base_url}/static/chapters/{profile_id}/{chapter['filename']}"
            
            # Try match without leading numbers (e.g., "02-savran_progrom" matches "01-savran-progrom")
            import re
            slug_without_numbers = re.sub(r'^\d+-', '', slug)
            chapter_slug_without_numbers = re.sub(r'^\d+-', '', chapter_slug)
            chapter_filename_without_numbers = re.sub(r'^\d+-', '', chapter_filename)
            
            if (chapter_slug_without_numbers == slug_without_numbers or
                chapter_filename_without_numbers == slug_without_numbers):
                return f"{self.base_url}/static/chapters/{profile_id}/{chapter['filename']}"
        
        return None
    
    def extract_links_from_markdown(self, markdown_text: str, current_url: str, include_images: bool = False) -> Set[str]:
        """
        מחלץ לינקים מקובץ Markdown
        include_images: אם False, לא מחלץ תמונות (כי הן מטופלות ב-JavaScript)
        """
        import re
        links = set()
        
        # לינקי Markdown: [text](/path) - צריך לטפל נכון בסוגריים בתוך ה-URL
        # גישה: נחפש ידנית את הלינקים על ידי ספירת סוגריים
        i = 0
        while i < len(markdown_text):
            # חפש התחלה של לינק: [text](
            bracket_start = markdown_text.find('[', i)
            if bracket_start == -1:
                break
            
            bracket_end = markdown_text.find(']', bracket_start + 1)
            if bracket_end == -1:
                i = bracket_start + 1
                continue
            
            # בדוק אם יש `(` מיד אחרי `]`
            if bracket_end + 1 >= len(markdown_text) or markdown_text[bracket_end + 1] != '(':
                i = bracket_end + 1
                continue
            
            # מצאנו [text]( - עכשיו צריך למצוא את הסוגריים הסוגרים הנכונים
            url_start = bracket_end + 2  # אחרי `(`
            paren_count = 1
            url_end = url_start
            
            # ספור סוגריים עד שנגיע לסוגריים הסוגרים הנכונים
            for j in range(url_start, len(markdown_text)):
                char = markdown_text[j]
                if char == '(':
                    paren_count += 1
                elif char == ')':
                    paren_count -= 1
                    if paren_count == 0:
                        url_end = j
                        break
                # אם הגענו לסוף שורה או לינק חדש, נעצור
                if char == '\n' and paren_count > 1:
                    break
            
            if paren_count == 0:
                # מצאנו לינק תקין
                href = markdown_text[url_start:url_end]
                # דלג על anchors, mailto, וכו'
                if not href.startswith(('javascript:', 'mailto:', 'tel:', 'data:', '#')):
                    # אם זה לינק לפרופיל עם ID (לא slug), המיר ל-slug
                    # JavaScript ממיר [Name|ID] או [Name](/profiles/ID) ל-/profiles/Slug
                    if href.startswith('/profiles/'):
                        profile_part = href[len('/profiles/'):]
                        # בדוק אם זה ID (I123 או מספר)
                        if profile_part.startswith('I') and len(profile_part) > 1 and profile_part[1:].isdigit():
                            # זה ID - המיר ל-slug
                            if not self.id_to_slug:
                                self.load_id_to_slug(verbose=False)
                            slug = self.id_to_slug.get(profile_part, profile_part)
                            href = f'/profiles/{slug}'
                        elif profile_part.isdigit():
                            # זה מספר - נסה עם I prefix
                            if not self.id_to_slug:
                                self.load_id_to_slug(verbose=False)
                            id_with_prefix = f'I{profile_part}'
                            slug = self.id_to_slug.get(id_with_prefix, self.id_to_slug.get(profile_part, profile_part))
                            href = f'/profiles/{slug}'
                    
                    normalized = self.normalize_url(href, current_url)
                    if normalized:
                        links.add(normalized)
                i = url_end + 1
            else:
                i = bracket_start + 1
        
        # Wikilinks: [[chapter-name]] או [[chapter-name|text]]
        # אלה יכולים להיות לינקים לפרקים - נמיר אותם ל-URLs
        wikilink_pattern = r'\[\[([^\]]+)\]\]'
        for match in re.finditer(wikilink_pattern, markdown_text):
            # דלג על תמונות
            if match.start() > 0 and markdown_text[match.start()-1] == '!':
                continue
            
            # Extract wikilink text (may contain | separator)
            wikilink_text = match.group(1)
            # Remove display text if present (e.g., "bios/I11052340/02-savran_progrom|1917 Savran Pogrom" -> "bios/I11052340/02-savran_progrom")
            if '|' in wikilink_text:
                wikilink_text = wikilink_text.split('|')[0].strip()
            
            # Try to resolve as chapter link
            # Make sure chapters index is loaded
            if not self.chapters_data:
                self.load_chapters_index(verbose=False)
            
            chapter_url = self.resolve_chapter_wikilink(wikilink_text, current_url)
            if chapter_url:
                links.add(chapter_url)
        
        # תמונות: ![[image.png]]
        # לא מחלצים תמונות מקובצי Markdown גולמיים
        # התמונות נבדקות מה-HTML שנוצר בפועל (אחרי ש-JavaScript מעבד אותן)
        # זה מבטיח שאנחנו בודקים את ה-URL האמיתי שהתמונה משתמשת בו
        if include_images:
            image_pattern = r'!\[\[([^\]]+)\]\]'
            for match in re.finditer(image_pattern, markdown_text):
                image_path = match.group(1)
                # לוקח רק את שם הקובץ (החלק האחרון אחרי /)
                filename = image_path.split('/')[-1]
                # מחליף רווחים וקווים תחתונים במקפים (כמו ש-ProfileTabs.tsx עושה)
                filename_with_dashes = filename.replace(' ', '-').replace('_', '-')
                # התמונות נמצאות ב-root של האתר (site/content/ מוגש ישירות)
                # נסה גם עם רווחים/קווים תחתונים (fallback)
                image_urls = [
                    f"{self.base_url}/{filename_with_dashes}",
                    f"{self.base_url}/{filename}"
                ]
                for img_url in image_urls:
                    links.add(img_url)
        
        # Check for broken links in code blocks (ASCII trees, etc.)
        # JavaScript converts [Name|ID] to /profiles/ID instead of /profiles/Slug
        self.check_broken_links_in_code_blocks(markdown_text, current_url)
        
        return links
    
    def check_broken_links_in_code_blocks(self, markdown_text: str, current_url: str, verbose: bool = True):
        """
        בודק לינקים שבורים בתוך code blocks (עצי ASCII, וכו')
        JavaScript ממיר [Name|ID] ל-/profiles/ID במקום /profiles/Slug
        """
        import re
        issues = []
        
        # Find all code blocks (triple backticks)
        # Pattern: ```lang?\n...code...\n```
        code_block_pattern = r'```(\w+)?\s*\n(.*?)```'
        code_block_matches = re.finditer(code_block_pattern, markdown_text, re.DOTALL)
        
        for match in code_block_matches:
            lang = match.group(1) or ''
            code = match.group(2)
            
            # Skip Mermaid code blocks (they're handled separately)
            if 'mermaid' in lang.lower():
                continue
            
            # Look for [Name|ID] format inside code blocks
            # This format is converted by JavaScript to /profiles/ID (broken link)
            name_id_pattern = r'\[([^\|]+)\|(I\d+)\]'
            name_id_matches = re.finditer(name_id_pattern, code)
            
            for name_id_match in name_id_matches:
                name = name_id_match.group(1)
                person_id = name_id_match.group(2)
                
                # JavaScript converts [Name|ID] to /profiles/Slug using id-to-slug.json
                # Load mapping if not already loaded
                if not self.id_to_slug:
                    self.load_id_to_slug(verbose=False)
                
                # Get slug for this ID
                slug = self.id_to_slug.get(person_id, person_id)
                correct_url = f'/profiles/{slug}'
                normalized = self.normalize_url(correct_url, current_url)
                
                if normalized:
                    # Check if this URL is actually broken
                    check_result = self.check_url(normalized)
                    if not check_result['valid']:
                        issues.append({
                            'url': normalized,
                            'valid': False,
                            'source': current_url,
                            'error': f'Broken link in code block: [{name}|{person_id}] is converted by JavaScript to {correct_url} (slug: {slug})',
                            'original_format': f'[{name}|{person_id}]',
                            'note': f'This [Name|ID] format in a code block is converted by JavaScript to /profiles/{slug}, but the link is broken.'
                        })
                        if verbose:
                            print(f"   ❌ Found broken link in code block: [{name}|{person_id}]")
                            print(f"      JavaScript converts it to: {correct_url} (slug: {slug})")
                            print(f"      Status: {check_result.get('status', check_result.get('error', 'Unknown'))}")
            
            # Also check for [Name](/profiles/ID) format inside code blocks
            # This is a direct broken link (ID or number instead of slug)
            markdown_link_pattern = r'\[([^\]]+)\]\((/profiles/[^)]+)\)'
            markdown_matches = re.finditer(markdown_link_pattern, code)
            
            for markdown_match in markdown_matches:
                link_text = markdown_match.group(1)
                href = markdown_match.group(2)
                
                # Check if it's a broken link (ID or number instead of slug)
                if href.startswith('/profiles/'):
                    path_part = href.replace('/profiles/', '')
                    # Identify broken links: just a number (39), or ID pattern (I123)
                    if re.match(r'^[0-9]+$', path_part) or re.match(r'^I\d+', path_part):
                        normalized = self.normalize_url(href, current_url)
                        if normalized:
                            check_result = self.check_url(normalized)
                            if not check_result['valid']:
                                issues.append({
                                    'url': normalized,
                                    'valid': False,
                                    'source': current_url,
                                    'error': f'Broken link in code block: [{link_text}]({href}) (ID/number instead of slug)',
                                    'original_format': f'[{link_text}]({href})',
                                    'note': 'This link in a code block uses an ID or number instead of a slug, creating a broken link.'
                                })
                                if verbose:
                                    print(f"   ❌ Found broken link in code block: [{link_text}]({href})")
                                    print(f"      Status: {check_result.get('status', check_result.get('error', 'Unknown'))}")
        
        # Add all issues to broken links list
        for issue in issues:
            self.broken_links.append(issue)
        
        return issues
    
    def check_links_with_parentheses(self, markdown_text: str, current_url: str, verbose: bool = True):
        """
        בודק לינקים עם סוגריים בקובץ Markdown
        לינקים כאלה עלולים להיות שבורים ב-HTML שנוצר על ידי JavaScript
        """
        import re
        issues = []
        
        # מצא כל הלינקים בקובץ Markdown (עם טיפול נכון בסוגריים)
        i = 0
        while i < len(markdown_text):
            # חפש התחלה של לינק: [text](
            bracket_start = markdown_text.find('[', i)
            if bracket_start == -1:
                break
            
            bracket_end = markdown_text.find(']', bracket_start + 1)
            if bracket_end == -1:
                i = bracket_start + 1
                continue
            
            # בדוק אם יש `(` מיד אחרי `]`
            if bracket_end + 1 >= len(markdown_text) or markdown_text[bracket_end + 1] != '(':
                i = bracket_end + 1
                continue
            
            # מצאנו [text]( - עכשיו צריך למצוא את הסוגריים הסוגרים הנכונים
            url_start = bracket_end + 2  # אחרי `(`
            paren_count = 1
            url_end = url_start
            
            # ספור סוגריים עד שנגיע לסוגריים הסוגרים הנכונים
            for j in range(url_start, len(markdown_text)):
                char = markdown_text[j]
                if char == '(':
                    paren_count += 1
                elif char == ')':
                    paren_count -= 1
                    if paren_count == 0:
                        url_end = j
                        break
                # אם הגענו לסוף שורה או לינק חדש, נעצור
                if char == '\n' and paren_count > 1:
                    break
            
            if paren_count == 0:
                # מצאנו לינק תקין
                href = markdown_text[url_start:url_end]
                link_text = markdown_text[bracket_start + 1:bracket_end]
                
                # דלג על anchors, mailto, וכו'
                if not href.startswith(('javascript:', 'mailto:', 'tel:', 'data:', '#')):
                    # בדוק אם ה-URL מכיל סוגריים (זה עלול להיות בעייתי)
                    if '(' in href or ')' in href:
                        # נסה לנרמל את ה-URL
                        normalized = self.normalize_url(href, current_url)
                        if normalized:
                            # בדוק את הלינק
                            check_result = self.check_url(normalized)
                            if not check_result['valid']:
                                issues.append({
                                    'url': normalized,
                                    'original_url': href,
                                    'link_text': link_text,
                                    'source': current_url,
                                    'valid': False,
                                    'error': check_result.get('error', 'Link with parentheses is broken'),
                                    'note': 'This link contains parentheses and may be incorrectly parsed by JavaScript'
                                })
                                if verbose:
                                    print(f"   ⚠️  Found broken link with parentheses: {href}")
                                    print(f"      Normalized: {normalized}")
                                    print(f"      Error: {check_result.get('error', 'Unknown')}")
                            else:
                                # הלינק תקין בקובץ Markdown, אבל עלול להיות שבור ב-HTML
                                # נבדוק אם יש לינק דומה שבור (עד הסוגריים הראשונים)
                                if '(' in href:
                                    # נסה ליצור את הלינק השבור ש-JavaScript עלול ליצור
                                    broken_url = href.split('(')[0]  # עד הסוגריים הראשונים
                                    if broken_url != href:
                                        broken_normalized = self.normalize_url(broken_url, current_url)
                                        if broken_normalized:
                                            broken_check = self.check_url(broken_normalized)
                                            if not broken_check['valid']:
                                                # הלינק השבור הוא באמת שבור - הוסף אותו לרשימת הלינקים השבורים
                                                issues.append({
                                                    'url': broken_normalized,
                                                    'original_url': href,
                                                    'correct_url': normalized,
                                                    'link_text': link_text,
                                                    'source': current_url,
                                                    'valid': False,
                                                    'error': f'Link with parentheses is broken in rendered HTML. JavaScript parses it as: {broken_url} (returns {broken_check.get("status", "error")})',
                                                    'note': f'The original link {href} is valid in Markdown, but JavaScript incorrectly parses it as {broken_url} which is broken.'
                                                })
                                                if verbose:
                                                    print(f"   ❌ Broken link with parentheses: {href}")
                                                    print(f"      JavaScript parses it as: {broken_url} (Status: {broken_check.get('status', broken_check.get('error', 'Unknown'))})")
                                                    print(f"      Correct URL should be: {normalized}")
                i = url_end + 1
            else:
                i = bracket_start + 1
        
        # הוסף את הבעיות לרשימת הלינקים השבורים
        for issue in issues:
            # כל הבעיות הן לינקים שבורים בפועל (או עלולים להיות שבורים)
            self.broken_links.append(issue)
        
        return issues
    
    def crawl(self, verbose: bool = True, check_chapters: bool = True):
        """
        מבצע DFS על כל הלינקים באתר
        כל הבדיקות נעשות דרך HTTP בלבד - לא ניגש לקבצים מקומיים
        """
        if verbose:
            print(f"🚀 Starting crawl from: {self.start_url}")
            print(f"📌 Base URL: {self.base_url}")
            print(f"⏱️  Delay between requests: {self.delay}s")
            print(f"🌐 All checks via HTTP only (no local file access)\n")
        
        # הוסף פרקים לתור אם אפשר (דרך HTTP)
        if check_chapters:
            self.check_chapters_index(verbose)
        
        while self.to_visit:
            current_url, depth = self.to_visit.popleft()
            
            # בדוק עומק
            if depth > self.max_depth:
                if verbose:
                    print(f"⚠️  Max depth reached for: {current_url}")
                continue
            
            # בדוק אם צריך לדלג
            if self.should_skip_url(current_url):
                continue
            
            # סמן כביקר
            self.visited.add(current_url)
            self.stats['pages_checked'] += 1
            
            if verbose:
                print(f"[{self.stats['pages_checked']}] Checking: {current_url} (depth: {depth})")
            
            # בדוק את ה-URL עצמו
            check_result = self.check_url(current_url)
            if not check_result['valid']:
                self.broken_links.append(check_result)
                if verbose:
                    print(f"   ❌ Broken: {check_result.get('error', 'Unknown error')}")
                continue  # אם הדף שבור, לא נמשיך לחלץ לינקים ממנו
            
            self.valid_links.append(check_result)
            
            # קבל את תוכן הדף
            try:
                response = self.session.get(current_url, timeout=15)
                response.raise_for_status()
                
                # בדוק אם זה קובץ Markdown (פרק)
                # עבור קבצי Markdown, נחלץ רק לינקים לפרופילים (לא תמונות)
                # תמונות נבדקות מה-HTML שנוצר בפועל, לא מקובצי Markdown גולמיים
                if current_url.endswith('.md') or '/static/chapters/' in current_url:
                    # חלץ לינקים מ-Markdown (רק לינקים לפרופילים, לא תמונות)
                    links = self.extract_links_from_markdown(response.text, current_url, include_images=False)
                    # בדוק לינקים עם סוגריים (עלולים להיות שבורים ב-HTML)
                    self.check_links_with_parentheses(response.text, current_url, verbose)
                else:
                    # חלץ לינקים מ-HTML (כולל תמונות מה-HTML שנוצר)
                    links = self.extract_links(response.text, current_url)
                
                self.stats['links_found'] += len(links)
                
                if verbose and links:
                    print(f"   📎 Found {len(links)} links")
                
                # הוסף לינקים חדשים לתור
                for link in links:
                    normalized = self.normalize_url(link, current_url)
                    
                    if self.should_skip_url(normalized):
                        # שמור לינקים שדילגנו עליהם (למעט כאלה שכבר ביקרנו)
                        if normalized not in self.visited:
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
                        self.stats['links_checked'] += 1
                
                # השהיה בין בקשות
                time.sleep(self.delay)
                
            except requests.exceptions.RequestException as e:
                if verbose:
                    print(f"   ⚠️  Error fetching page: {e}")
                self.broken_links.append({
                    'url': current_url,
                    'valid': False,
                    'error': str(e)
                })
        
        if verbose:
            print(f"\n✅ Crawl completed!")
            self.print_summary()
    
    def print_summary(self):
        """מדפיס סיכום של הסריקה"""
        elapsed = time.time() - self.stats['start_time']
        
        print("\n" + "="*70)
        print("📊 CRAWL SUMMARY")
        print("="*70)
        print(f"🌐 Base URL: {self.base_url}")
        print(f"⏱️  Time elapsed: {elapsed:.2f} seconds")
        print(f"📄 Pages checked: {self.stats['pages_checked']}")
        print(f"🔗 Links found: {self.stats['links_found']}")
        print(f"✅ Valid links: {len(self.valid_links)}")
        print(f"❌ Broken links: {len(self.broken_links)}")
        print(f"⏭️  Skipped links: {len(self.skipped_links)}")
        print(f"📊 Total unique URLs visited: {len(self.visited)}")
        
        if self.broken_links:
            print(f"\n❌ BROKEN LINKS ({len(self.broken_links)}):")
            for link in self.broken_links[:20]:  # הצג 20 ראשונים
                print(f"   - {link['url']}")
                print(f"     Source: {link.get('source', 'N/A')}")
                print(f"     Error: {link.get('error', 'Unknown')}")
            if len(self.broken_links) > 20:
                print(f"   ... and {len(self.broken_links) - 20} more")
        
        if self.skipped_links and len(self.skipped_links) <= 50:
            print(f"\n⏭️  SKIPPED LINKS (external/other):")
            for link in self.skipped_links[:10]:
                print(f"   - {link['url']} ({link.get('reason', 'N/A')})")
    
    def save_report(self, filename: str = 'link_crawl_report.json'):
        """שומר דוח מפורט ל-JSON"""
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
            'valid_links_sample': self.valid_links[:100],  # דוגמה
            'skipped_links_sample': self.skipped_links[:50]
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"\n📄 Full report saved to: {filename}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Crawl website links using DFS algorithm',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Check external site
  python link_crawler.py https://moshehoff.github.io/FamilyHistory
  
  # Check local site
  python link_crawler.py http://localhost:8080
  
  # With custom delay
  python link_crawler.py http://localhost:8080 --delay 0.5
  
  # Limit depth
  python link_crawler.py http://localhost:8080 --max-depth 5
        """
    )
    
    parser.add_argument('url', help='Starting URL to crawl')
    parser.add_argument('--max-depth', type=int, default=100,
                       help='Maximum crawl depth (default: 100)')
    parser.add_argument('--delay', type=float, default=0.1,
                       help='Delay between requests in seconds (default: 0.1)')
    parser.add_argument('--quiet', action='store_true',
                       help='Less verbose output')
    parser.add_argument('--output', default='link_crawl_report.json',
                       help='Output JSON report filename (default: link_crawl_report.json)')
    parser.add_argument('--no-chapters', action='store_true',
                       help='Skip checking chapter files')
    
    args = parser.parse_args()
    
    # Validate URL
    if not args.url.startswith(('http://', 'https://')):
        print("❌ Error: URL must start with http:// or https://")
        sys.exit(1)
    
    # Create crawler
    crawler = LinkCrawler(
        start_url=args.url,
        max_depth=args.max_depth,
        delay=args.delay
    )
    
    # Run crawl
    try:
        crawler.crawl(verbose=not args.quiet, check_chapters=not args.no_chapters)
        crawler.save_report(args.output)
        
        # Exit code based on broken links
        if crawler.broken_links:
            print(f"\n⚠️  Found {len(crawler.broken_links)} broken links!")
            sys.exit(1)
        else:
            print("\n✅ All links are valid!")
            sys.exit(0)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Crawl interrupted by user")
        crawler.save_report(args.output)
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

