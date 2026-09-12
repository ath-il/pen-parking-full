import os
import cv2
import numpy as np


TARGET_RATIO_X = 0.38
TARGET_RATIO_Y = 0.73
TARGET_ANGLE = 0.0


def parse_camera_source():
    default_source = os.getenv("CAMERA_SOURCE", "0")
    source = default_source

    try:
        import sys

        if len(sys.argv) > 1:
            source = sys.argv[1]
    except Exception:
        pass

    return source


def normalize_camera_source(source):
    if source is None:
        return parse_camera_source()

    source_str = str(source).strip()
    if not source_str:
        return parse_camera_source()

    if source_str.startswith(("http://", "https://")):
        source_str = source_str.rstrip("/")
        from urllib.parse import urlparse

        parsed = urlparse(source_str)
        if parsed.path in ("", "/"):
            # IP Webcam / DroidCam default video path
            if parsed.port == 4747:
                return source_str + "/video"
            return source_str + "/video"
        return source_str

    return source_str


def open_camera(source):
    try:
        if source is None:
            source_str = "0"
        else:
            source_str = str(source).strip() or "0"

        if source_str.startswith(("http://", "https://", "rtsp://", "rtmp://")):
            cap = cv2.VideoCapture(source_str, cv2.CAP_FFMPEG)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            if not cap.isOpened():
                cap = cv2.VideoCapture(source_str)
            return cap

        if source_str.isdigit():
            index = int(source_str)
            cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
            if not cap.isOpened():
                cap = cv2.VideoCapture(index)
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            cap.set(cv2.CAP_PROP_FPS, 30)
            return cap

        if os.path.exists(source_str):
            return cv2.VideoCapture(source_str)

        return cv2.VideoCapture(source_str)
    except Exception:
        return cv2.VideoCapture(0, cv2.CAP_DSHOW)


def get_target_position(frame_shape):
    h, w = frame_shape[:2]
    return {
        "x": int(w * TARGET_RATIO_X),
        "y": int(h * TARGET_RATIO_Y),
    }


def _candidate_from_min_rect(rect, contour=None):
    (cx, cy), (rw, rh), angle = rect
    if rw < 1 or rh < 1:
        return None
    long_side = max(rw, rh)
    short_side = min(rw, rh)
    if rw < rh:
        angle += 90
    if contour is not None:
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
    else:
        w, h = int(rw), int(rh)
        x, y = int(cx - w / 2), int(cy - h / 2)
        area = long_side * short_side
    if long_side < 55 or short_side < 2 or short_side > 90:
        return None
    aspect = long_side / max(short_side, 1)
    if aspect < 2.8:
        return None
    return {
        "center": (int(cx), int(cy)),
        "bbox": (x, y, w, h),
        "angle": float(angle),
        "area": float(max(area, 1)),
        "length": float(long_side),
        "aspect": float(aspect),
    }


def _score_candidate(candidate, previous=None):
    score = candidate["length"] * min(candidate["aspect"], 16.0)
    if previous:
        px, py = previous["center"]
        cx, cy = candidate["center"]
        dist = np.hypot(cx - px, cy - py)
        score += max(0, 180 - dist)
    return score


def detect_pen(frame, previous=None):
    """Detect a pen by shape on a small grayscale frame."""
    h, w = frame.shape[:2]
    scale = 1.0
    max_w = 320
    work = frame
    if w > max_w:
        scale = w / float(max_w)
        work = cv2.resize(frame, (max_w, int(h / scale)), interpolation=cv2.INTER_AREA)

    gray = cv2.cvtColor(work, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 140)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)

    previous_scaled = None
    if previous:
        previous_scaled = {
            "center": (
                int(previous["center"][0] / scale),
                int(previous["center"][1] / scale),
            )
        }

    candidates = []
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 40 or area > 20000:
            continue
        candidate = _candidate_from_min_rect(cv2.minAreaRect(contour), contour)
        if candidate:
            candidates.append(candidate)

    if not candidates:
        return None

    best = max(candidates, key=lambda item: _score_candidate(item, previous_scaled))
    return {
        "center": (int(best["center"][0] * scale), int(best["center"][1] * scale)),
        "bbox": (
            int(best["bbox"][0] * scale),
            int(best["bbox"][1] * scale),
            int(best["bbox"][2] * scale),
            int(best["bbox"][3] * scale),
        ),
        "angle": best["angle"],
        "area": float(best["area"] * scale * scale),
    }


def compute_score(pen_center, angle, target_position):
    target_x = target_position["x"]
    target_y = target_position["y"]
    dx = pen_center[0] - target_x
    dy = pen_center[1] - target_y
    distance = np.hypot(dx, dy)

    position_score = max(0, 100 - distance / 2)
    angle_error = abs(angle - TARGET_ANGLE)
    angle_score = max(0, 100 - angle_error * 2)
    total_score = max(0, min(100, (position_score * 0.7) + (angle_score * 0.3)))

    return total_score, dx, dy, distance


def get_instruction(dx, dy):
    if abs(dx) < 15 and abs(dy) < 15:
        return "PEN PARKED PERFECTLY"

    move_x = "left" if dx < 0 else "right"
    move_y = "up" if dy < 0 else "down"

    x_text = f"Move pen {abs(dx):.1f}px {move_x}" if abs(dx) > 10 else ""
    y_text = f"Move pen {abs(dy):.1f}px {move_y}" if abs(dy) > 10 else ""

    if x_text and y_text:
        return f"{x_text} and {y_text}"
    return x_text or y_text or "PEN PARKED PERFECTLY"


def main():
    camera_source = parse_camera_source()
    cap = open_camera(camera_source)

    if not cap.isOpened():
        print("Unable to open camera source:", camera_source)
        print("Try using your phone camera via IP Webcam, for example:")
        print("  http://192.168.1.12:8080/video")
        print("Or set CAMERA_SOURCE from environment:")
        print("  export CAMERA_SOURCE='http://192.168.1.12:8080/video'")
        return

    print(f"Camera opened successfully from: {camera_source}")

    while True:
        ret, frame = cap.read()
        if not ret:
            print("Camera read failed")
            break

        target = get_target_position(frame.shape)

        pen = detect_pen(frame)
        if pen:
            cx, cy = pen["center"]
            px, py, w, h = pen["bbox"]
            angle = pen["angle"]

            score, dx, dy, distance = compute_score((cx, cy), angle, target)
            instruction = get_instruction(dx, dy)

            cv2.rectangle(frame, (px, py), (px + w, py + h), (0, 255, 0), 2)
            cv2.circle(frame, (cx, cy), 5, (0, 0, 255), -1)
            cv2.line(frame, (cx, cy), (target["x"], target["y"]), (255, 0, 0), 2)

            cv2.circle(frame, (target["x"], target["y"]), 8, (255, 255, 0), -1)

            cv2.putText(
                frame,
                f"Pen Score: {score:.0f}/100",
                (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 255),
                2,
            )
            cv2.putText(
                frame,
                f"Angle: {angle:.1f} deg",
                (20, 60),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 255),
                2,
            )
            cv2.putText(
                frame,
                f"Distance: {distance:.1f}px",
                (20, 90),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 255),
                2,
            )
            cv2.putText(
                frame,
                instruction,
                (20, frame.shape[0] - 20),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0),
                2,
            )

        else:
            cv2.putText(
                frame,
                "No pen detected",
                (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 0, 255),
                2,
            )

        cv2.circle(frame, (target["x"], target["y"]), 12, (255, 255, 0), 2)
        cv2.putText(
            frame,
            "Target Parking Zone",
            (target["x"] + 15, target["y"] - 15),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 0),
            1,
        )

        cv2.imshow("PenPark - Simple Version", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
