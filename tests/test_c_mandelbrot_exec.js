const { executeCode } = require('../api/_compiler');

async function testMandelbrot() {
  const cCode = `#include <stdio.h>
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
                printf("11 17 32  ");
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
}`;

  console.log('--- Testing C Mandelbrot Execution ---');
  const res = await executeCode({ language: 'c', source_code: cCode });
  console.log('Status:', res.data.status);
  console.log('Compile output:', res.data.compile_output);
  console.log('Stdout length:', res.data.stdout.length);
  console.log('is_graphics:', res.data.is_graphics);
  console.log('graphics_engine:', res.data.graphics_engine);
  console.log('Has graphics_output:', !!res.data.graphics_output);
  if (res.data.graphics_output) {
    console.log('graphics_output type:', res.data.graphics_output.type);
    console.log('data length:', res.data.graphics_output.data.length);
  }
}

testMandelbrot().catch(console.error);
