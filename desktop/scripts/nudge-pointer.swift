import CoreGraphics
import Foundation

func moveMouse(to point: CGPoint) {
    guard let event = CGEvent(
        mouseEventSource: nil,
        mouseType: .mouseMoved,
        mouseCursorPosition: point,
        mouseButton: .left
    ) else {
        return
    }
    event.post(tap: .cghidEventTap)
}

func tapF15() {
    let source = CGEventSource(stateID: .hidSystemState)
    let keyDown = CGEvent(keyboardEventSource: source, virtualKey: 113, keyDown: true)
    let keyUp = CGEvent(keyboardEventSource: source, virtualKey: 113, keyDown: false)
    keyDown?.post(tap: .cghidEventTap)
    keyUp?.post(tap: .cghidEventTap)
}

func jitterAround(_ origin: CGPoint, px: Int) {
    let amount = CGFloat(max(1, px))
    let pattern: [(CGFloat, CGFloat)] = [
        (amount, 0),
        (0, amount),
        (-amount, 0),
        (0, -amount),
        (0, 0),
    ]
    var point = origin
    moveMouse(to: point)
    for (dx, dy) in pattern {
        point.x += dx
        point.y += dy
        moveMouse(to: point)
        usleep(40_000)
    }
}

func nudgeInPlace(from origin: CGPoint, px: Int) {
    let amount = CGFloat(max(1, px))
    let pattern: [(CGFloat, CGFloat)] = [
        (amount, 0),
        (amount, amount),
        (0, amount),
        (-2 * amount, -2 * amount),
    ]
    var point = origin
    moveMouse(to: point)
    for (dx, dy) in pattern {
        point.x += dx
        point.y += dy
        moveMouse(to: point)
        usleep(40_000)
    }
}

func optionalJumpPoint() -> CGPoint? {
    guard
        let xRaw = ProcessInfo.processInfo.environment["DESKFLOW_JUMP_X"],
        let yRaw = ProcessInfo.processInfo.environment["DESKFLOW_JUMP_Y"],
        let x = Double(xRaw),
        let y = Double(yRaw)
    else {
        return nil
    }
    return CGPoint(x: x, y: y)
}

let argPx = CommandLine.arguments.dropFirst().first
let envPx = ProcessInfo.processInfo.environment["DESKFLOW_KEEP_ALIVE_NUDGE_PX"]
let nudgePx = max(1, Int(argPx ?? envPx ?? "6") ?? 6)

guard let current = CGEvent(source: nil) else {
    fputs("keep-alive: could not read cursor position\n", stderr)
    exit(1)
}

var point = current.location
var mode = "in-place"

if let jump = optionalJumpPoint() {
    point = jump
    moveMouse(to: point)
    usleep(150_000)
    jitterAround(point, px: nudgePx)
    mode = "jump-drag"
} else {
    nudgeInPlace(from: point, px: nudgePx)
}

tapF15()
print("ok mode=\(mode)")
