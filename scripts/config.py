"""
Configuration and constants for the family history generator.
"""

# Image file extensions supported
IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp']

# Mermaid diagram CSS styles
MERMAID_STYLES = {
    'person': 'fill:#e1f5fe,stroke:#0277bd,stroke-width:2px',
    'internal_link': 'fill:#e1f5fe,stroke:#0277bd,stroke-width:2px',
    'current': 'fill:#bbdefb,stroke:#1976d2,stroke-width:3px'
}

# Place to Wikipedia article name mapping
# This helps create accurate Wikipedia links for birth/death places
PLACE_TO_WIKI = {
    # Australia
    "Subiaco, Perth, Western Australia, Australia": "Subiaco,_Western_Australia",
    "Perth, Western Australia, Australia": "Perth,_Western_Australia",
    "Perth, WA, Australia": "Perth,_Western_Australia",
    "Perth, Australia": "Perth,_Western_Australia",
    "Perth": "Perth,_Western_Australia",
    "Sydney, NSW, Australia": "Sydney",
    "Sydney, New South Wales, Australia": "Sydney",
    "Brisbane, Queensland, Australia": "Brisbane",
    
    # Israel
    "Rehovot, Israel": "Rehovot",
    "Rehovot, Center District, Israel": "Rehovot",
    "Jerusalem": "Jerusalem",
    
    # Europe
    "Wien, Austria": "Vienna",
    "Vienna, Vienna, Austria": "Vienna",
    "Nikolsburg (Mikulov), Moravia, Czechoslovakia": "Mikulov",
    "Blackburn, Lancashire, England (United Kingdom)": "Blackburn,_Lancashire",
    "Pitten or Schwarzau am Steinfeld, near Neunkirchen, Lower Austria, Austria": "Neunkirchen,_Lower_Austria",
    
    # Eastern Europe/Asia
    "Savran, Podolia, Odessa oblast, Ukraine": "Savran,_Ukraine",
    "Bershad, Ukraine": "Bershad",
    "Hamedan, Iran, Islamic Republic of": "Hamadan",
}

# Default directories
DEFAULT_OUTPUT_DIR = "site/content/profiles"
DEFAULT_BIOS_DIR = "bios"
DEFAULT_CONTENT_DIR = "content"
DEFAULT_DOCUMENTS_DIR = "documents"
DEFAULT_STATIC_DIR = "site/quartz/static"

# Logging format
LOG_FORMAT = "[%(asctime)s] [%(levelname)s] %(name)s: %(message)s"
LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

