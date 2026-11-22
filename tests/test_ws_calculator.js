const http = require('http');
const WebSocket = require('ws');
const server = http.createServer();
const mgr = require('../api/_interactive_manager');

mgr.attachWebSocketServer(server);

server.listen(0, () => {
  const port = server.address().port;
  console.log('Testing DIGITAL CALCULATOR on port', port);
  const ws = new WebSocket(`ws://localhost:${port}/api/interactive/ws`);

  const calcCode = `
#include <stdio.h>

int main() {
    int choice;
    double num1, num2, result;

    do {
        printf("\\n========================================\\n");
        printf("          DIGITAL CALCULATOR            \\n");
        printf("========================================\\n");
        printf("1. Addition (+)\\n");
        printf("2. Subtraction (-)\\n");
        printf("3. Multiplication (*)\\n");
        printf("4. Division (/)\\n");
        printf("5. Modulus (%%)\\n");
        printf("6. Exit\\n");
        printf("----------------------------------------\\n");
        printf("Enter your choice (1-6): ");
        if (scanf("%d", &choice) != 1) break;

        if (choice >= 1 && choice <= 5) {
            printf("Enter first number: ");
            scanf("%lf", &num1);
            printf("Enter second number: ");
            scanf("%lf", &num2);

            switch (choice) {
                case 1:
                    result = num1 + num2;
                    printf("Result: %.2lf + %.2lf = %.2lf\\n", num1, num2, result);
                    break;
                case 2:
                    result = num1 - num2;
                    printf("Result: %.2lf - %.2lf = %.2lf\\n", num1, num2, result);
                    break;
                case 3:
                    result = num1 * num2;
                    printf("Result: %.2lf * %.2lf = %.2lf\\n", num1, num2, result);
                    break;
                case 4:
                    if (num2 != 0) {
                        result = num1 / num2;
                        printf("Result: %.2lf / %.2lf = %.2lf\\n", num1, num2, result);
                    } else {
                        printf("Error: Division by zero!\\n");
                    }
                    break;
                case 5:
                    printf("Result: %d %% %d = %d\\n", (int)num1, (int)num2, (int)num1 % (int)num2);
                    break;
            }
        } else if (choice == 6) {
            printf("Exiting Calculator. Thank you!\\n");
        } else {
            printf("Invalid choice! Please select 1-6.\\n");
        }
    } while (choice != 6);

    return 0;
}
`;

  ws.on('open', () => {
    ws.send(JSON.stringify({
      type: 'start',
      language: 'c',
      source_code: calcCode
    }));
  });

  let fullOutput = '';
  let step = 0;

  ws.on('message', (d) => {
    const msg = JSON.parse(d.toString());
    if (msg.type === 'stdout') {
      fullOutput += msg.data;
      process.stdout.write(msg.data);

      if (step === 0 && fullOutput.includes('Enter your choice (1-6):')) {
        step = 1;
        console.log('\n[TEST SENDING]: choice 1');
        ws.send(JSON.stringify({ type: 'stdin', data: '1' }));
      } else if (step === 1 && fullOutput.includes('Enter first number:')) {
        step = 2;
        console.log('\n[TEST SENDING]: 15');
        ws.send(JSON.stringify({ type: 'stdin', data: '15' }));
      } else if (step === 2 && fullOutput.includes('Enter second number:')) {
        step = 3;
        console.log('\n[TEST SENDING]: 35');
        ws.send(JSON.stringify({ type: 'stdin', data: '35' }));
      } else if (step === 3 && fullOutput.includes('Result: 15.00 + 35.00 = 50.00') && fullOutput.lastIndexOf('Enter your choice (1-6):') > fullOutput.indexOf('Result: 15.00 + 35.00 = 50.00')) {
        step = 4;
        console.log('\n[TEST SENDING]: choice 6 (Exit)');
        ws.send(JSON.stringify({ type: 'stdin', data: '6' }));
      }
    }

    if (msg.type === 'exit') {
      console.log('\nProcess exited with code:', msg.code);
      if (fullOutput.includes('Result: 15.00 + 35.00 = 50.00') && fullOutput.includes('Exiting Calculator. Thank you!') && msg.code === 0) {
        console.log('✅ DIGITAL CALCULATOR TEST PASSED (Multi-step loop + switch-case)!');
        ws.close();
        server.close();
        process.exit(0);
      } else {
        console.error('❌ DIGITAL CALCULATOR TEST FAILED! Output:', fullOutput);
        process.exit(1);
      }
    }
  });
});
