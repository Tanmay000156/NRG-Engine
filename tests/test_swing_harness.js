const { executeCode } = require('../api/_compiler');

async function testSwingHarness() {
  console.log('--- Testing Java JPanel Component Auto-Harness ---');
  const javaCode = `import javax.swing.*;
import java.awt.*;

public class Main extends JPanel {
    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Graphics2D g2 = (Graphics2D) g;
        g2.setColor(new Color(15, 23, 42));
        g2.fillRect(0, 0, 640, 480);
        
        g2.setColor(new Color(56, 189, 248));
        g2.fillOval(100, 100, 200, 200);
        
        g2.setColor(Color.WHITE);
        g2.setFont(new Font("SansSerif", Font.BOLD, 20));
        g2.drawString("Java Swing JPanel Rendered!", 120, 205);
    }
}`;

  const res = await executeCode({ language: 'java', source_code: javaCode });
  console.log('Status:', res.data.status);
  console.log('is_graphics:', res.data.is_graphics);
  console.log('engine:', res.data.graphics_engine);
  console.log('Has graphics_output:', !!res.data.graphics_output);
  if (res.data.graphics_output) {
    console.log('Output type:', res.data.graphics_output.type);
    console.log('Data length:', res.data.graphics_output.data.length);
  }
}

testSwingHarness().catch(console.error);
