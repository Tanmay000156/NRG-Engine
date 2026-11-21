import sys
import types
import math
import json
import atexit

_EVENT_LOG = []
def _record_cmd(c):
    _EVENT_LOG.append(c)

def _flush():
    if _EVENT_LOG:
        print(f"\n__NRG_TURTLE_STREAM_START__{json.dumps(_EVENT_LOG)}__NRG_TURTLE_STREAM_END__")

atexit.register(_flush)

class _NRGTurtle:
    _next_id = 1
    def __init__(self):
        self.tid = _NRGTurtle._next_id
        _NRGTurtle._next_id += 1
        self._x = 0.0
        self._y = 0.0
        self._heading = 0.0
        _record_cmd({"cmd": "create_turtle", "tid": self.tid, "x": self._x, "y": self._y})

    def forward(self, d):
        self._x += float(d)
        _record_cmd({"cmd": "forward", "tid": self.tid, "d": d})

_tmod = types.ModuleType("turtle")
_pen = _NRGTurtle()
_tmod.Turtle = _NRGTurtle
_tmod.forward = _pen.forward
sys.modules["turtle"] = _tmod

# Simulate user code crashing on line 3
import turtle
turtle.forward(100)
raise ValueError("Intentional user code error for testing")
