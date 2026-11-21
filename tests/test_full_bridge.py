import sys
import types
import math
import json

_EVENT_LOG = []
def _record_cmd(c):
    _EVENT_LOG.append(c)

def _parse_color(args, colormode=1.0):
    if not args:
        return "black"
    if len(args) == 1:
        c = args[0]
        if isinstance(c, str):
            return c
        if isinstance(c, (tuple, list)) and len(c) >= 3:
            r, g, b = c[0], c[1], c[2]
            if colormode == 1.0 and (isinstance(r, float) or (r <= 1.0 and g <= 1.0 and b <= 1.0)):
                return f"rgb({int(r*255)}, {int(g*255)}, {int(b*255)})"
            return f"rgb({int(r)}, {int(g)}, {int(b)})"
    elif len(args) >= 3:
        r, g, b = args[0], args[1], args[2]
        if colormode == 1.0 and (isinstance(r, float) or (r <= 1.0 and g <= 1.0 and b <= 1.0)):
            return f"rgb({int(r*255)}, {int(g*255)}, {int(b*255)})"
        return f"rgb({int(r)}, {int(g)}, {int(b)})"
    return str(args[0])

class _NRGScreen:
    def __init__(self):
        self._bg = "white"
        self._title = "NRG Turtle"
        self._colormode = 1.0
        self._w, self._h = 800, 600
        self._delay = 10

    def bgcolor(self, *args):
        if not args: return self._bg
        self._bg = _parse_color(args, self._colormode)
        _record_cmd({"cmd": "bgcolor", "color": self._bg})

    def title(self, t):
        self._title = str(t)
        _record_cmd({"cmd": "title", "title": self._title})

    def setup(self, width=None, height=None, startx=None, starty=None):
        if width is not None: self._w = width
        if height is not None: self._h = height
        _record_cmd({"cmd": "setup", "width": self._w, "height": self._h})

    def screensize(self, canvwidth=None, canvheight=None, bg=None):
        if canvwidth is not None: self._w = canvwidth
        if canvheight is not None: self._h = canvheight
        if bg is not None: self.bgcolor(bg)
        return (self._w, self._h)

    def window_width(self): return self._w
    def window_height(self): return self._h

    def colormode(self, cmode=None):
        if cmode is None: return self._colormode
        if cmode in (1.0, 255): self._colormode = cmode

    def clear(self): _record_cmd({"cmd": "screen_clear"})
    def resetscreen(self): _record_cmd({"cmd": "resetscreen"})
    def exitonclick(self): _record_cmd({"cmd": "exitonclick"})
    def bye(self): _record_cmd({"cmd": "bye"})
    def mainloop(self): _record_cmd({"cmd": "done"})
    def done(self): _record_cmd({"cmd": "done"})
    def tracer(self, *a, **k): pass
    def update(self): pass
    def delay(self, d=None):
        if d is not None: self._delay = d
        return self._delay

_SCREEN = _NRGScreen()
_ALL_TURTLES = {}

class _NRGTurtle:
    _next_id = 1
    def __init__(self, shape="classic", visible=True):
        self.tid = _NRGTurtle._next_id
        _NRGTurtle._next_id += 1
        _ALL_TURTLES[self.tid] = self
        self._x = 0.0
        self._y = 0.0
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

        _record_cmd({
            "cmd": "create_turtle", "tid": self.tid, "shape": self._shape,
            "visible": self._visible, "x": self._x, "y": self._y,
            "heading": self._heading, "pencolor": self._pen_color,
            "fillcolor": self._fill_color, "pensize": self._pen_size
        })

    def forward(self, d):
        d = float(d)
        rad = math.radians(self._heading)
        nx = self._x + d * math.cos(rad)
        ny = self._y + d * math.sin(rad)
        self._move_to(nx, ny)

    def fd(self, d): self.forward(d)
    def backward(self, d): self.forward(-float(d))
    def bk(self, d): self.backward(d)
    def back(self, d): self.backward(d)

    def right(self, a):
        self._heading = (self._heading - float(a)) % 360
        _record_cmd({"cmd": "rotate", "tid": self.tid, "heading": self._heading, "by": -float(a)})

    def rt(self, a): self.right(a)

    def left(self, a):
        self._heading = (self._heading + float(a)) % 360
        _record_cmd({"cmd": "rotate", "tid": self.tid, "heading": self._heading, "by": float(a)})

    def lt(self, a): self.left(a)

    def goto(self, x, y=None):
        nx, ny = (float(x[0]), float(x[1])) if y is None else (float(x), float(y))
        self._move_to(nx, ny)

    def setpos(self, x, y=None): self.goto(x, y)
    def setposition(self, x, y=None): self.goto(x, y)
    def setx(self, x): self.goto(float(x), self._y)
    def sety(self, y): self.goto(self._x, float(y))
    def setheading(self, h):
        self._heading = float(h) % 360
        _record_cmd({"cmd": "rotate", "tid": self.tid, "heading": self._heading})
    def seth(self, h): self.setheading(h)
    def home(self): self.setheading(0); self.goto(0, 0)

    def _move_to(self, nx, ny):
        x0, y0 = self._x, self._y
        self._x, self._y = nx, ny
        if self._filling:
            self._fill_path.append([round(nx, 4), round(ny, 4)])
        _record_cmd({
            "cmd": "move", "tid": self.tid,
            "x0": round(x0, 4), "y0": round(y0, 4),
            "x1": round(nx, 4), "y1": round(ny, 4),
            "pen": self._pen_down, "color": self._pen_color,
            "size": self._pen_size, "filling": self._filling
        })

    def circle(self, r, extent=None, steps=None):
        r = float(r)
        ext = 360.0 if extent is None else float(extent)
        if steps is None:
            steps = max(12, int(abs(r) * math.pi * abs(ext) / 360.0 / 4))
            steps = min(steps, 180)
        steps = max(steps, 3)
        w = ext / steps
        w2 = 0.5 * w
        l = 2.0 * r * math.sin(math.radians(w2))
        if r < 0: l = -l; w = -w; w2 = -w2
        self.left(w2)
        for _ in range(steps):
            self.forward(l)
            self.left(w)
        self.right(w2)

    def penup(self): self._pen_down = False; _record_cmd({"cmd": "penup", "tid": self.tid})
    def up(self): self.penup()
    def pu(self): self.penup()
    def pendown(self): self._pen_down = True; _record_cmd({"cmd": "pendown", "tid": self.tid})
    def down(self): self.pendown()
    def pd(self): self.pendown()
    def isdown(self): return self._pen_down

    def speed(self, s=None):
        if s is None: return self._speed
        self._speed = s
        _record_cmd({"cmd": "speed", "tid": self.tid, "speed": s})

    def pensize(self, w=None):
        if w is None: return self._pen_size
        self._pen_size = max(1, float(w))
        _record_cmd({"cmd": "pensize", "tid": self.tid, "size": self._pen_size})

    def width(self, w=None): return self.pensize(w)

    def pencolor(self, *args):
        if not args: return self._pen_color
        self._pen_color = _parse_color(args, _SCREEN.colormode())
        _record_cmd({"cmd": "pencolor", "tid": self.tid, "color": self._pen_color})

    def fillcolor(self, *args):
        if not args: return self._fill_color
        self._fill_color = _parse_color(args, _SCREEN.colormode())
        _record_cmd({"cmd": "fillcolor", "tid": self.tid, "color": self._fill_color})

    def color(self, *args):
        if not args: return (self._pen_color, self._fill_color)
        if len(args) == 1: self.pencolor(args[0]); self.fillcolor(args[0])
        elif len(args) == 2: self.pencolor(args[0]); self.fillcolor(args[1])
        else: self.pencolor(*args); self.fillcolor(*args)

    def begin_fill(self):
        self._filling = True
        self._fill_path = [[round(self._x, 4), round(self._y, 4)]]
        _record_cmd({"cmd": "begin_fill", "tid": self.tid, "x": round(self._x, 4), "y": round(self._y, 4), "color": self._fill_color})

    def end_fill(self):
        self._filling = False
        _record_cmd({"cmd": "end_fill", "tid": self.tid, "path": self._fill_path, "color": self._fill_color})
        self._fill_path = []

    def hideturtle(self): self._visible = False; _record_cmd({"cmd": "hideturtle", "tid": self.tid})
    def ht(self): self.hideturtle()
    def showturtle(self): self._visible = True; _record_cmd({"cmd": "showturtle", "tid": self.tid})
    def st(self): self.showturtle()
    def isvisible(self): return self._visible

    def shape(self, s=None):
        if s is None: return self._shape
        self._shape = str(s)
        _record_cmd({"cmd": "shape", "tid": self.tid, "shape": self._shape})

    def dot(self, size=None, *color):
        s = float(size) if size is not None else max(self._pen_size + 4, 2 * self._pen_size)
        c = _parse_color(color, _SCREEN.colormode()) if color else self._pen_color
        _record_cmd({"cmd": "dot", "tid": self.tid, "x": self._x, "y": self._y, "size": s, "color": c})

    def write(self, arg, move=False, align="left", font=("Arial", 8, "normal")):
        _record_cmd({
            "cmd": "write", "tid": self.tid, "text": str(arg),
            "x": self._x, "y": self._y, "align": align.lower(),
            "font": list(font) if isinstance(font, (list, tuple)) else str(font),
            "color": self._pen_color
        })

    def clear(self): _record_cmd({"cmd": "turtle_clear", "tid": self.tid})
    def reset(self): self.home(); _record_cmd({"cmd": "turtle_reset", "tid": self.tid})
    def xcor(self): return round(self._x, 4)
    def ycor(self): return round(self._y, 4)
    def pos(self): return (round(self._x, 4), round(self._y, 4))
    def position(self): return self.pos()
    def heading(self): return round(self._heading, 4)

_pen = _NRGTurtle(shape="classic")

# Build the virtual module
_tmod = types.ModuleType("turtle")
_tmod.Turtle = _NRGTurtle
_tmod.Screen = lambda: _SCREEN

# Map methods to default pen
for m in ["forward", "fd", "backward", "bk", "back", "right", "rt", "left", "lt",
          "goto", "setpos", "setposition", "setx", "sety", "setheading", "seth", "home",
          "circle", "penup", "up", "pu", "pendown", "down", "pd", "isdown", "speed",
          "pensize", "width", "pencolor", "fillcolor", "color", "begin_fill", "end_fill",
          "hideturtle", "ht", "showturtle", "st", "isvisible", "shape", "dot", "write",
          "clear", "reset", "xcor", "ycor", "pos", "position", "heading"]:
    setattr(_tmod, m, getattr(_pen, m))

# Map screen methods
for m in ["bgcolor", "title", "setup", "screensize", "window_width", "window_height",
          "colormode", "tracer", "update", "delay", "clear", "resetscreen",
          "exitonclick", "bye", "mainloop", "done"]:
    setattr(_tmod, m, getattr(_SCREEN, m))

sys.modules["turtle"] = _tmod

# Test 1: import turtle
import turtle
t1 = turtle.Turtle()
t1.color("red")
t1.forward(50)
t1.right(90)
t1.forward(50)

# Test 2: from turtle import *
from turtle import *
bgcolor("navy")
pensize(3)
circle(25)
print("Top-level pos:", pos())
done()

print(f"Recorded events: {len(_EVENT_LOG)}")
print(f"__NRG_TURTLE_STREAM_START__{json.dumps(_EVENT_LOG)}__NRG_TURTLE_STREAM_END__")
