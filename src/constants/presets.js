// NRG ENGINE 2.0 — Universal Graphics Presets
export const GRAPHICS_PRESETS = [
  {
    id: 'turtle_spiral',
    title: 'Python Turtle Rainbow Spiral',
    lang: 'python',
    engine: 'Python Turtle',
    desc: 'Multi-colored logarithmic forward-angle geometric spiral using browser HTML5 canvas.',
    code: `import turtle

t = turtle.Turtle()
t.speed(0)
turtle.bgcolor("#070d18")

colors = ["#38bdf8", "#818cf8", "#c084fc", "#f472b6", "#fb7185", "#34d399"]

for i in range(120):
    t.pencolor(colors[i % len(colors)])
    t.pensize(i / 30 + 1)
    t.forward(i * 2)
    t.left(59)

turtle.done()
`
  },
  {
    id: 'turtle_star',
    title: 'Python Turtle Starburst',
    lang: 'python',
    engine: 'Python Turtle',
    desc: 'Filled 36-point radiant geometric starburst with gradient fill emulation.',
    code: `import turtle

t = turtle.Turtle()
t.speed(0)
turtle.bgcolor("#070d18")

t.color("#facc15", "#f59e0b")
t.begin_fill()

for i in range(36):
    t.forward(160)
    t.left(170)

t.end_fill()
t.hideturtle()
turtle.done()
`
  },
  {
    id: 'matplotlib',
    title: 'Matplotlib Dual Waveform',
    lang: 'python',
    engine: 'Matplotlib',
    desc: 'High-resolution trigonometric waveforms rendered into the obsidian viewport.',
    code: `import matplotlib.pyplot as plt
import numpy as np

# High-resolution trigonometric waveforms
t = np.linspace(0, 2 * np.pi, 300)
y1 = np.sin(t)
y2 = np.cos(t)

fig, ax = plt.subplots(figsize=(6, 4), dpi=120)
ax.plot(t, y1, label="sin(t)", color="#0066ff", lw=2.5)
ax.plot(t, y2, label="cos(t)", color="#8b5cf6", lw=2.5)
ax.set_facecolor("#070d18")
fig.patch.set_facecolor("#0b1120")
ax.tick_params(colors="#94a3b8")
for spine in ax.spines.values(): spine.set_color("#334155")
ax.set_title("NRG Engine • Matplotlib Waveform", color="#f8fafc", fontsize=12, pad=10)
ax.legend(loc="upper right", facecolor="#1e293b", edgecolor="#334155", labelcolor="#e2e8f0")
ax.grid(True, linestyle="--", alpha=0.3, color="#475569")

plt.show()
`
  },
  {
    id: 'js_canvas',
    title: 'JavaScript 3D Wireframe Polyhedron',
    lang: 'javascript',
    engine: 'Canvas 2D / WebGL',
    desc: 'Continuous requestAnimationFrame 3D rotation with perspective projection.',
    code: `// 3D Rotating Polyhedron in Canvas 2D
const ctx = canvas.getContext('2d');
let angleX = 0, angleY = 0;

const vertices = [
    [-90, -90, -90], [90, -90, -90], [90, 90, -90], [-90, 90, -90],
    [-90, -90, 90],  [90, -90, 90],  [90, 90, 90],  [-90, 90, 90]
];

const edges = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7]
];

function render() {
    ctx.fillStyle = '#070d18';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2, cy = canvas.height / 2;

    angleX += 0.015; angleY += 0.02;
    const radX = angleX, radY = angleY;

    const projected = vertices.map(([x, y, z]) => {
        let x1 = x * Math.cos(radY) + z * Math.sin(radY);
        let z1 = -x * Math.sin(radY) + z * Math.cos(radY);
        let y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
        let z2 = y * Math.sin(radX) + z1 * Math.cos(radX);
        const fov = 400;
        const scale = fov / (fov + z2 + 200);
        return [cx + x1 * scale, cy + y2 * scale];
    });

    ctx.strokeStyle = '#0066ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#0066ff';
    ctx.shadowBlur = 10;

    edges.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(projected[i][0], projected[i][1]);
        ctx.lineTo(projected[j][0], projected[j][1]);
        ctx.stroke();
    });
    requestAnimationFrame(render);
}
render();
`
  },
  {
    id: 'c_framebuffer',
    title: 'C Mandelbrot PPM Framebuffer',
    lang: 'c',
    engine: 'PPM Framebuffer',
    desc: 'Direct pixel-buffer generation of the complex Mandelbrot set rendered in PPM format.',
    code: `#include <stdio.h>
#include <math.h>

int main() {
    int width = 240, height = 180;
    printf("P3\\n%d %d\\n255\\n", width, height);

    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            double cr = (x - width * 0.7) / (width * 0.35);
            double ci = (y - height * 0.5) / (height * 0.35);
            double zr = 0, zi = 0;
            int iter = 0, max_iter = 64;

            while (zr * zr + zi * zi <= 4.0 && iter < max_iter) {
                double temp = zr * zr - zi * zi + cr;
                zi = 2.0 * zr * zi + ci;
                zr = temp;
                iter++;
            }

            if (iter == max_iter) {
                printf("7 13 24  ");
            } else {
                int r = (int)(sin(iter * 0.16) * 127 + 128);
                int g = (int)(sin(iter * 0.16 + 2) * 127 + 128);
                int b = (int)(sin(iter * 0.16 + 4) * 127 + 128);
                printf("%d %d %d  ", r, g, b);
            }
        }
        printf("\\n");
    }
    return 0;
}
`
  }
];
