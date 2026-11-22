const { executeCode } = require('../api/_compiler');

async function main() {
  const javaCode = `import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import javax.imageio.ImageIO;

public class Main {
    public static void main(String[] args) throws Exception {
        int width = 300, height = 200;
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        g.setColor(new Color(11, 17, 32));
        g.fillRect(0, 0, width, height);
        g.setColor(new Color(0, 102, 255));
        g.fillOval(50, 50, 100, 100);
        g.setColor(Color.WHITE);
        g.drawString("NRG Java Graphics", 60, 105);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        String b64 = Base64.getEncoder().encodeToString(baos.toByteArray());
        System.out.println("\\n__NRG_GRAPHICS_STREAM_START__{\\"type\\":\\"image\\",\\"engine\\":\\"java-awt\\",\\"format\\":\\"png\\",\\"data\\":\\"data:image/png;base64," + b64 + "\\"}\\n__NRG_GRAPHICS_STREAM_END__");
    }
}`;

  console.log('Sending Java AWT code to executeCode...');
  const res = await executeCode({ language: 'java', source_code: javaCode });
  console.log('Status:', res.data.status);
  console.log('is_graphics:', res.data.is_graphics);
  console.log('engine:', res.data.graphics_engine);
  console.log('Has graphics_output:', !!res.data.graphics_output);
  if (res.data.graphics_output) {
    console.log('Output type:', res.data.graphics_output.type);
    console.log('Data len:', res.data.graphics_output.data.length);
  }
  if (res.data.stderr) {
    console.log('Stderr:', res.data.stderr);
  }
}

main().catch(console.error);
