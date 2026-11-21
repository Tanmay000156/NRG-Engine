import base64
import sys

raw_user_code = """import turtle
t = turtle.Turtle()
t.forward(100)
def err():
    x = 1 / 0
err()
"""

b64 = base64.b64encode(raw_user_code.encode('utf-8')).decode('ascii')

runner_script = f"""
import sys, types, math, json, atexit, base64

_EVENT_LOG = []
def _record_cmd(c): _EVENT_LOG.append(c)
def _flush():
    if _EVENT_LOG:
        print(f"\\n__NRG_TURTLE_STREAM_START__{{json.dumps(_EVENT_LOG)}}__NRG_TURTLE_STREAM_END__")
atexit.register(_flush)

class _NRGTurtle:
    _next_id = 1
    def __init__(self):
        self.tid = _NRGTurtle._next_id
        _NRGTurtle._next_id += 1
        self._x, self._y = 0.0, 0.0
        _record_cmd({{"cmd": "create_turtle", "tid": self.tid, "x": self._x, "y": self._y}})
    def forward(self, d):
        self._x += float(d)
        _record_cmd({{"cmd": "forward", "tid": self.tid, "d": d}})

_tmod = types.ModuleType("turtle")
_pen = _NRGTurtle()
_tmod.Turtle = _NRGTurtle
_tmod.forward = _pen.forward
sys.modules["turtle"] = _tmod

_user_code_str = base64.b64decode("{b64}").decode("utf-8")
_compiled = compile(_user_code_str, "main.py", "exec")
exec(_compiled, globals())
"""

import subprocess
res = subprocess.run([sys.executable, "-c", runner_script], capture_output=True, text=True)
print("Return code:", res.returncode)
print("STDOUT:\n", res.stdout)
print("STDERR:\n", res.stderr)
