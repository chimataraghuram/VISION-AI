import os
import re

directory = r"a:\VISION AI\frontend\src\pages"

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # If it has "card " followed by other things, we might want to clean them.
    # But wait, it's easier to just remove " bg-white", " bg-white/95", " border border-surface-200", " border-surface-200/80", " shadow-sm" from className.
    # Let's specifically look for classes that conflict with dark mode.
    # bg-white inside a className.
    # Let's replace 'bg-white' with 'bg-surface-50 dark:bg-[#0b1220]' or we can just remove 'bg-white' if 'card' is there.
    
    # Let's just find and replace specific known bad patterns.
    # Pattern 1: classNames with 'card' and 'bg-white'
    
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if 'className=' in line and 'bg-white' in line:
            if 'card' in line:
                # Remove bg-white, border, border-surface-200, shadow-sm, rounded-2xl, rounded-3xl, p-6, p-8
                line = line.replace(' bg-white', '')
                line = line.replace(' border border-surface-200', '')
                line = line.replace(' border-surface-200', '')
                line = line.replace(' shadow-sm', '')
            else:
                # If it doesn't have card, add dark mode equivalents
                if 'bg-white/95' in line:
                    line = line.replace('bg-white/95', 'bg-white/95 dark:bg-[#0b1220]/95')
                elif 'bg-white' in line and 'dark:bg-' not in line:
                    line = line.replace('bg-white', 'bg-white dark:bg-[#0b1220]')
        
        # also handle text-surface-900 if it doesn't have dark:text-
        if 'className=' in line and 'text-surface-900' in line and 'dark:text-' not in line:
            line = line.replace('text-surface-900', 'text-surface-900 dark:text-white')
            
        new_lines.append(line)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))

for filename in os.listdir(directory):
    if filename.endswith(".jsx"):
        fix_file(os.path.join(directory, filename))

# Also fix components
comp_dir = r"a:\VISION AI\frontend\src\components"
for filename in os.listdir(comp_dir):
    if filename.endswith(".jsx"):
        fix_file(os.path.join(comp_dir, filename))
