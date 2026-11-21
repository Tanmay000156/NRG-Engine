import math
import json

class TestTurtle:
    def __init__(self, tid=1):
        self.tid = tid
        self.x = 0.0
        self.y = 0.0
        self.angle = 0.0 # 0 = East (+X), 90 = North (+Y)
        self.pen_is_down = True
        self.events = []

    def forward(self, dist):
        rad = math.radians(self.angle)
        nx = self.x + dist * math.cos(rad)
        ny = self.y + dist * math.sin(rad)
        self.events.append({"cmd": "forward", "tid": self.tid, "x0": self.x, "y0": self.y, "x1": nx, "y1": ny, "pen": self.pen_is_down})
        self.x, self.y = nx, ny

    def right(self, deg):
        self.angle = (self.angle - deg) % 360
        self.events.append({"cmd": "rotate", "tid": self.tid, "angle": self.angle})

    def pos(self):
        return (round(self.x, 4), round(self.y, 4))

t = TestTurtle()
for _ in range(4):
    t.forward(100)
    t.right(90)

print("Final Pos:", t.pos())
print("Events count:", len(t.events))
assert t.pos() == (0.0, 0.0), f"Expected (0, 0), got {t.pos()}"
print("Square test passed perfectly!")
