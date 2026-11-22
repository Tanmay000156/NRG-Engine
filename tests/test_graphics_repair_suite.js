const { executeCode } = require('../api/_compiler');

async function runSuite() {
  console.log('====================================================');
  console.log('   NRG ENGINE GRAPHICS EXECUTION REPAIR SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(desc, condition, extra = '') {
    if (condition) {
      console.log(`  [PASS] ${desc} ${extra}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc} ${extra}`);
      failed++;
    }
  }

  // 1. C Mandelbrot with math.h sin/cos (GCC -lm linker test)
  console.log('1. Testing C Mandelbrot PPM with math.h (GCC -lm linker)...');
  const cMandelbrot = `#include <stdio.h>
#include <math.h>

int main() {
    int width = 80, height = 60;
    printf("P3\\n# NRG Mandelbrot\\n%d %d\\n255\\n", width, height);
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            double cr = (x - width * 0.7) / (width * 0.35);
            double ci = (y - height * 0.5) / (height * 0.35);
            double zr = 0, zi = 0;
            int iter = 0, max_iter = 32;
            while (zr * zr + zi * zi <= 4.0 && iter < max_iter) {
                double temp = zr * zr - zi * zi + cr;
                zi = 2.0 * zr * zi + ci;
                zr = temp;
                iter++;
            }
            if (iter == max_iter) {
                printf("11 17 32  ");
            } else {
                int r = (int)(sin(iter * 0.16) * 127 + 128);
                int g = (int)(cos(iter * 0.16) * 127 + 128);
                int b = (int)(sin(iter * 0.16 + 4) * 127 + 128);
                printf("%d %d %d  ", r, g, b);
            }
        }
        printf("\\n");
    }
    return 0;
}`;
  const cRes = await executeCode({ language: 'c', source_code: cMandelbrot });
  assert('C Mandelbrot executes with status 3 (Accepted)', cRes.data.status.id === 3, `(status: ${cRes.data.status.description})`);
  assert('C Mandelbrot detected as graphics', cRes.data.is_graphics === true);
  assert('C Mandelbrot extracts PPM graphics output', cRes.data.graphics_output && cRes.data.graphics_output.type === 'ppm');
  assert('C Mandelbrot PPM data contains P3 header', cRes.data.graphics_output && cRes.data.graphics_output.data.includes('P3'));
  assert('Raw PPM pixel text filtered out of stdout', !cRes.data.stdout.startsWith('P3') && cRes.data.stdout.includes('[Graphical Framebuffer: PPM image'));

  // 2. C Math dynamic tests: sqrt, pow, atan2
  console.log('\n2. Testing GCC dynamic math functions (sqrt, pow, atan2)...');
  const cMathCode = `#include <stdio.h>
#include <math.h>

int main() {
    volatile double v = 144.0;
    double s = sqrt(v);
    double p = pow(s, 2.0);
    double a = atan2(1.0, 1.0);
    printf("sqrt=%.1f, pow=%.1f, atan2=%.4f\\n", s, p, a);
    return 0;
}`;
  const cMathRes = await executeCode({ language: 'c', source_code: cMathCode });
  assert('C GCC math functions compile and run with -lm', cMathRes.data.status.id === 3, `(stdout: ${cMathRes.data.stdout.trim()})`);

  // 3. Java HeadlessException diagnostic test
  console.log('\n3. Testing Java HeadlessException diagnostic parsing...');
  const javaHeadless = `import javax.swing.*;
public class Main {
    public static void main(String[] args) {
        JFrame frame = new JFrame("Window");
        frame.setVisible(true);
    }
}`;
  const javaHeadlessRes = await executeCode({ language: 'java', source_code: javaHeadless });
  const hasHeadlessProblem = javaHeadlessRes.data.problems && javaHeadlessRes.data.problems.some(p => p.message.includes('Java Desktop GUI window'));
  assert('HeadlessException parsed into clear diagnostic problem', hasHeadlessProblem);

  // 4. Java AWT & BufferedImage offscreen stream
  console.log('\n4. Testing Java AWT BufferedImage offscreen stream...');
  const javaAwt = `import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import javax.imageio.ImageIO;

public class Main {
    public static void main(String[] args) throws Exception {
        BufferedImage img = new BufferedImage(100, 80, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        g.setColor(Color.BLUE);
        g.fillRect(0, 0, 100, 80);
        g.dispose();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        String b64 = Base64.getEncoder().encodeToString(baos.toByteArray());
        System.out.println("\\n__NRG_GRAPHICS_STREAM_START__{\\"type\\":\\"image\\",\\"engine\\":\\"java-awt\\",\\"format\\":\\"png\\",\\"data\\":\\"data:image/png;base64," + b64 + "\\"}\\n__NRG_GRAPHICS_STREAM_END__");
    }
}`;
  const javaAwtRes = await executeCode({ language: 'java', source_code: javaAwt });
  assert('Java AWT execution accepted', javaAwtRes.data.status.id === 3);
  assert('Java AWT graphics extracted', javaAwtRes.data.graphics_output && javaAwtRes.data.graphics_output.engine === 'java-awt');
  assert('Java AWT image data is valid Base64 PNG', javaAwtRes.data.graphics_output && javaAwtRes.data.graphics_output.data.startsWith('data:image/png;base64,'));

  // 5. Java Swing JPanel Component Auto-Harness
  console.log('\n5. Testing Java JPanel Component Auto-Harness...');
  const javaPanel = `import javax.swing.*;
import java.awt.*;

public class Main extends JPanel {
    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        g.setColor(Color.CYAN);
        g.fillOval(10, 10, 50, 50);
    }
}`;
  const javaPanelRes = await executeCode({ language: 'java', source_code: javaPanel });
  assert('Java JPanel auto-harness executes accepted', javaPanelRes.data.status.id === 3);
  assert('Java JPanel renders to graphics output', javaPanelRes.data.graphics_output && javaPanelRes.data.graphics_output.data.startsWith('data:image/png;base64,'));

  // 6. Python Turtle Command Stream
  console.log('\n6. Testing Python Turtle Graphics Command Stream...');
  const pyTurtle = `import turtle
t = turtle.Turtle()
t.forward(100)
t.left(90)
t.forward(100)
turtle.done()`;
  const pyTurtleRes = await executeCode({ language: 'python', source_code: pyTurtle });
  assert('Python Turtle executes accepted', pyTurtleRes.data.status.id === 3);
  assert('Python Turtle produces turtle_commands array', Array.isArray(pyTurtleRes.data.turtle_commands) && pyTurtleRes.data.turtle_commands.length >= 2);

  // 7. Python Matplotlib Scientific Visualization
  console.log('\n7. Testing Python Matplotlib Headless Agg Stream...');
  const pyMpl = `import matplotlib.pyplot as plt
fig, ax = plt.subplots(figsize=(4, 3))
ax.plot([0, 1, 2], [0, 1, 4])
plt.show()`;
  const pyMplRes = await executeCode({ language: 'python', source_code: pyMpl });
  assert('Python Matplotlib executes accepted', pyMplRes.data.status.id === 3);
  assert('Python Matplotlib produces PNG image stream', pyMplRes.data.graphics_output && pyMplRes.data.graphics_output.data.startsWith('data:image/png;base64,'));

  console.log('\n====================================================');
  console.log(`SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runSuite().catch(err => {
  console.error('Suite error:', err);
  process.exit(1);
});
