const { executeCode } = require('../api/_compiler');

async function testJavaFx() {
  const javaCode = `import javafx.application.Application;
import javafx.scene.Scene;
import javafx.stage.Stage;

public class Main {
    public static void main(String[] args) {
        System.out.println("JavaFX test");
    }
}`;

  console.log('--- Testing JavaFX on Judge0 ---');
  const res = await executeCode({ language: 'java', source_code: javaCode });
  console.log('Status:', res.data.status);
  console.log('Compile output:', res.data.compile_output);
  console.log('Problems:', res.data.problems);
}

testJavaFx().catch(console.error);
