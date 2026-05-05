import os
import re

def check_platform_imports(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.expo' in root or '.next' in root:
            continue
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        if 'Platform.' in content:
                            # Search for any import from react-native that includes Platform
                            if not re.search(r'import\s+{[^}]*Platform[^}]*}\s+from\s+[\'"]react-native[\'"]', content):
                                # Also check for 'import Platform from'
                                if not re.search(r'import\s+Platform\s+from', content):
                                     print(f"Missing Platform import in: {path}")
                except Exception as e:
                    pass

check_platform_imports('c:\\1Data\\Ved_Data\\AmritaCSE\\Research\\Research_Sem6\\SoftwareEngineering\\sturdy-goggles\\frontend')
