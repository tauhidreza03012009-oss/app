import math

filename = "Jarvis.svg"
cx, cy = 100, 100
r_base = 80

with open(filename, "w") as f:
    f.write('<svg width="200" height="200" viewBox="0 0 200 200"\n')
    f.write('          xmlns="http://www.w3.org/2000/svg">\n\n')
    f.write(f'  <circle cx="100" cy="100" r="{r_base}" fill="none" stroke="#66eaff" stroke-width="3"/>\n')
    f.write('  <path d="M 45,144 A 70,70 0 1,1 168 117"\n')
    f.write('        fill="none" \n')
    f.write('        stroke="#3488ff"\n')
    f.write('        stroke-width="13"/>\n\n')
    f.write('  <!-- Radiating Ticks (Projecting OUTWARD) -->\n')

    for degree in range(0, 360, 2):
        radians = math.radians(degree)
        
        length = 10.0 if degree % 8 == 0 else 5
            
        x1 = cx + r_base * math.cos(radians)
        y1 = cy + r_base * math.sin(radians)
        
        x2 = cx + (r_base + length) * math.cos(radians)
        y2 = cy + (r_base + length) * math.sin(radians)
        
        f.write(f'  <line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="#66eaff" stroke-width="1" />\n')

    f.write('\n</svg>')

print(f"Success! Outward-facing layout generated inside '{filename}'.")
