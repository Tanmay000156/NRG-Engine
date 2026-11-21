const { executeCode } = require('../api/_compiler');

async function runTurtleTests() {
  console.log("==================================================");
  console.log("⚡ TESTING PYTHON TURTLE BRIDGE IN EXECUTION ENGINE");
  console.log("==================================================\n");

  // Test 1: Turtle with loops and colors
  console.log("1. Testing Python Turtle with loops and colors...");
  const turtleCode = `import turtle
t = turtle.Turtle()
t.pencolor("green")
for i in range(4):
    t.forward(50)
    t.right(90)
print("Square drawn successfully!")
`;

  const res1 = await executeCode({
    language: 'python',
    source_code: turtleCode,
    stdin: ''
  });

  console.log("Status:", res1.status);
  console.log("Success:", res1.data.success);
  console.log("Exit code:", res1.data.exit_code);
  console.log("Stdout:", res1.data.stdout.trim());
  console.log("Turtle commands received:", res1.data.turtle_commands ? res1.data.turtle_commands.length : 0);
  
  if (res1.data.turtle_commands && res1.data.turtle_commands.length > 5) {
    console.log("   ✅ Test 1 Passed! Received valid turtle command stream.");
    console.log("   Sample commands:", JSON.stringify(res1.data.turtle_commands.slice(0, 4)));
  } else {
    console.error("   ❌ Test 1 Failed! No turtle commands generated.");
    process.exit(1);
  }

  // Test 2: Standard non-turtle Python (MUST NOT BE AFFECTED)
  console.log("\n2. Testing Standard Python (Zero Turtle interference)...");
  const pyCode = `print("NRG Engine standard Python execution!")
for i in range(1, 4):
    print(f"Num: {i}")
`;
  const res2 = await executeCode({
    language: 'python',
    source_code: pyCode,
    stdin: ''
  });

  console.log("Success:", res2.data.success);
  console.log("Stdout:\n" + res2.data.stdout.trim());
  if (res2.data.turtle_commands === undefined && res2.data.stdout.includes("Num: 3")) {
    console.log("   ✅ Test 2 Passed! Non-turtle Python runs completely untouched.");
  } else {
    console.error("   ❌ Test 2 Failed!");
    process.exit(1);
  }

  // Test 3: Multiple Turtles and Fill
  console.log("\n3. Testing Multiple Turtles and begin_fill / end_fill...");
  const multiTurtleCode = `import turtle
t1 = turtle.Turtle()
t2 = turtle.Turtle()
t1.color("red", "yellow")
t1.begin_fill()
for _ in range(4):
    t1.forward(80)
    t1.right(90)
t1.end_fill()

t2.penup()
t2.goto(-50, -50)
t2.pendown()
t2.pencolor("purple")
t2.circle(30)
`;

  const res3 = await executeCode({
    language: 'python',
    source_code: multiTurtleCode,
    stdin: ''
  });

  const cmds = res3.data.turtle_commands || [];
  console.log(`Received ${cmds.length} commands for multiple turtles.`);
  const tids = new Set(cmds.filter(c => c.tid).map(c => c.tid));
  console.log("Active Turtle IDs:", Array.from(tids));
  const hasFill = cmds.some(c => c.cmd === 'begin_fill') && cmds.some(c => c.cmd === 'end_fill');
  console.log("Has fill commands:", hasFill);

  if (tids.has(1) && tids.has(2) && hasFill) {
    console.log("   ✅ Test 3 Passed! Multiple turtles and fills verified.");
  } else {
    console.error("   ❌ Test 3 Failed!");
    process.exit(1);
  }

  console.log("\n==================================================");
  console.log("🎉 ALL PYTHON TURTLE BRIDGE TESTS PASSED!");
  console.log("==================================================");
}

runTurtleTests().catch(err => {
  console.error("Test execution error:", err);
  process.exit(1);
});
