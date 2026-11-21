const { submitToJudge0, executeCode } = require('../api/_compiler');

async function testJudge0Turtle() {
  console.log("Testing Judge0 with Python Turtle code...");
  const rawCode = `import turtle
t = turtle.Turtle()
t.pencolor("blue")
for _ in range(4):
    t.forward(100)
    t.right(90)
print("Finished drawing square!")
`;

  // Base64 encode raw code for Python runner
  const b64 = Buffer.from(rawCode, 'utf-8').toString('base64');
  const pythonBridge = `
import sys, types, math, json, atexit, base64

_EVENT_LOG = []
def _record_cmd(c): _EVENT_LOG.append(c)
def _flush():
    if _EVENT_LOG:
        print(f"\\n__NRG_TURTLE_STREAM_START__{{json.dumps(_EVENT_LOG)}}__NRG_TURTLE_STREAM_END__")
atexit.register(_flush)

class _NRGTurtle:
    _next_id = 1
    def __init__(self, shape="classic", visible=True):
        self.tid = _NRGTurtle._next_id
        _NRGTurtle._next_id += 1
        self._x, self._y = 0.0, 0.0
        self._heading = 0.0
        self._pen_down = True
        self._pen_color = "black"
        self._fill_color = "black"
        self._pen_size = 1
        self._speed = 3
        self._visible = visible
        self._shape = shape
        self._filling = False
        self._fill_path = []
        _record_cmd({"cmd": "create_turtle", "tid": self.tid, "shape": self._shape, "visible": self._visible, "x": self._x, "y": self._y, "heading": self._heading, "pencolor": self._pen_color, "fillcolor": self._fill_color, "pensize": self._pen_size})

    def forward(self, d):
        d = float(d)
        rad = math.radians(self._heading)
        nx = self._x + d * math.cos(rad)
        ny = self._y + d * math.sin(rad)
        x0, y0 = self._x, self._y
        self._x, self._y = nx, ny
        if self._filling: self._fill_path.append([round(nx, 4), round(ny, 4)])
        _record_cmd({"cmd": "move", "tid": self.tid, "x0": round(x0, 4), "y0": round(y0, 4), "x1": round(nx, 4), "y1": round(ny, 4), "pen": self._pen_down, "color": self._pen_color, "size": self._pen_size, "filling": self._filling})

    def right(self, a):
        self._heading = (self._heading - float(a)) % 360
        _record_cmd({"cmd": "rotate", "tid": self.tid, "heading": self._heading, "by": -float(a)})

    def pencolor(self, *a):
        self._pen_color = str(a[0])
        _record_cmd({"cmd": "pencolor", "tid": self.tid, "color": self._pen_color})

_tmod = types.ModuleType("turtle")
_pen = _NRGTurtle()
_tmod.Turtle = _NRGTurtle
_tmod.forward = _pen.forward
_tmod.right = _pen.right
_tmod.pencolor = _pen.pencolor
sys.modules["turtle"] = _tmod

_user_code_str = base64.b64decode("${b64}").decode("utf-8")
_compiled = compile(_user_code_str, "main.py", "exec")
exec(_compiled, globals())
`;

  const result = await submitToJudge0(100, pythonBridge, '');
  const stdout = Buffer.from(result.stdout || '', 'base64').toString('utf-8');
  const stderr = Buffer.from(result.stderr || '', 'base64').toString('utf-8');

  console.log("Judge0 Status:", result.status);
  console.log("Judge0 stdout:\n", stdout);
  if (stderr) console.log("Judge0 stderr:\n", stderr);
}

testJudge0Turtle().catch(console.error);
