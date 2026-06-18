ObjC.import("CoreGraphics");

function moveMouse(x, y) {
  var event = $.CGEventCreateMouseEvent(
    null,
    $.kCGEventMouseMoved,
    { x: x, y: y },
    $.kCGMouseButtonLeft
  );
  $.CGEventPost($.kCGHIDEventTap, event);
}

function tapF15() {
  var source = $.CGEventSourceCreate($.kCGEventSourceStateHIDSystemState);
  var keyDown = $.CGEventCreateKeyboardEvent(source, 113, true);
  var keyUp = $.CGEventCreateKeyboardEvent(source, 113, false);
  $.CGEventPost($.kCGHIDEventTap, keyDown);
  $.CGEventPost($.kCGHIDEventTap, keyUp);
}

function nudgePixels() {
  var raw = $.getenv("DESKFLOW_KEEP_ALIVE_NUDGE_PX");
  var px = parseInt(raw, 10);
  return px > 0 ? px : 6;
}

function rotateScreensEnabled() {
  var raw = ($.getenv("DESKFLOW_KEEP_ALIVE_ROTATE_SCREENS") || "").toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

var current = $.CGEventCreate(null);
if (!current) {
  throw new Error("keep-alive: could not read cursor position");
}

if (rotateScreensEnabled()) {
  throw new Error("keep-alive: screen rotation requires Swift nudge script");
}

var px = nudgePixels();
var point = $.CGEventGetLocation(current);
var startX = point.x;
var startY = point.y;
moveMouse(startX, startY);

var deltas = [[px, 0], [px, px], [0, px], [-2 * px, -2 * px]];
for (var i = 0; i < deltas.length; i += 1) {
  point.x += deltas[i][0];
  point.y += deltas[i][1];
  moveMouse(point.x, point.y);
  $.usleep(40000);
}

tapF15();
"ok";
