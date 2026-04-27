import os
import re

def check_platform_imports(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith(('.tsx', '.ts', '.js')):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if 'Platform' in content and 'import' in content:
                        # Check if Platform is in the imports
                        if not re.search(r'import\s+{[^}]*Platform[^}]*}\s+from\s+[\'"]react-native[\'"]', content):
                            # It might be imported as default or something else, but in RN it's usually { Platform }
                            # Let's also check for 'import Platform from' (less common)
                            if not re.search(r'import\s+Platform\s+from', content):
                                # If it's used as Platform.OS or similar
                                if 'Platform.' in content:
                                    print(f"Missing Platform import in: {path}")

check_platform_imports('c:\\1Data\\Ved_Data\\AmritaCSE\\Research\\Research_Sem6\\SoftwareEngineering\\sturdy-goggles\\frontend')
