const { submitToJudge0 } = require('../api/_compiler');

async function testJavaAwt() {
  console.log('Testing Java AWT & BufferedImage on Judge0...');

  const javaCode = `
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import javax.imageio.ImageIO;

public class Main {
    public static void main(String[] args) {
        try {
            int w = 200, h = 150;
            BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g = img.createGraphics();
            g.setColor(Color.RED);
            g.fillRect(10, 10, 180, 130);
            g.setColor(Color.WHITE);
            g.drawString("Java AWT OK", 30, 75);
            g.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "png", baos);
            String b64 = Base64.getEncoder().encodeToString(baos.toByteArray());
            System.out.println("Java Render Success! B64 len: " + b64.length());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
`;

  try {
    const res = await submitToJudge0(91, javaCode, ''); // Java JDK 17
    const out = Buffer.from(res.stdout || '', 'base64').toString();
    const err = Buffer.from(res.stderr || '', 'base64').toString();
    const compile = Buffer.from(res.compile_output || '', 'base64').toString();
    console.log('Status:', res.status);
    console.log('Stdout:', out);
    if (err) console.log('Stderr:', err);
    if (compile) console.log('Compile:', compile);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testJavaAwt();
