const { executeCode } = require('../api/_compiler');

async function testHeadless() {
  const javaCode = `import javax.swing.*;

public class Main {
    public static void main(String[] args) {
        JFrame frame = new JFrame("Test Window");
        frame.setSize(400, 300);
        frame.setVisible(true);
    }
}`;

  console.log('--- Testing Java JFrame Headless Exception ---');
  const res = await executeCode({ language: 'java', source_code: javaCode });
  console.log('Status:', res.data.status);
  console.log('Stderr:', res.data.stderr);
  console.log('Problems:', res.data.problems);
}

testHeadless().catch(console.error);
