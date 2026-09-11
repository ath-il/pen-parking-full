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
            return cv2.VideoCapture(0)

        source_str = str(source).strip()
        if not source_str:
            return cv2.VideoCapture(0)

        if source_str.startswith(("http://", "https://", "rtsp://", "rtmp://")):
            cap = cv2.VideoCapture(source_str, cv2.CAP_FFMPEG)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            if not cap.isOpened():
                cap = cv2.VideoCapture(source_str)
            return cap

        if source_str.isdigit():
            return cv2.VideoCapture(int(source_str))

        if os.path.exists(source_str):
            return cv2.VideoCapture(source_str)

        return cv2.VideoCapture(source_str)
    except Exception:
        return cv2.VideoCapture(0)


def get_target_position(frame_shape):
    h, w = frame_shape[:2]
    return {
        "x": int(w * TARGET_RATIO_X),
        "y": int(h * TARGET_RATIO_Y),
    }


def _line_kernel(length, angle_deg):
    size = length + 4
    kernel = np.zeros((size, size), dtype=np.uint8)
    center = size // 2
    rad = np.deg2rad(angle_deg)
    dx = int(round(np.cos(rad) * (length / 2)))
    dy = int(round(np.sin(rad) * (length / 2)))
    cv2.line(kernel, (center - dx, center - dy), (center + dx, center + dy), 1, 1)
    return kernel


def _enhance_thin_objects(binary):
    enhanced = np.zeros_like(binary)
    for angle in range(0, 180, 10):
        opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, _line_kernel(21, angle))
        enhanced = cv2.bitwise_or(enhanced, opened)
    return enhanced


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
    """Detect a pen by shape (long, thin stick), not by color."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    gray = clahe.apply(gray)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    dark_pen = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 31, 7
    )
    light_pen = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 7
    )
    edges = cv2.Canny(blurred, 25, 80)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)

    combined = cv2.bitwise_or(dark_pen, light_pen)
    combined = cv2.bitwise_or(combined, edges)
    combined = cv2.medianBlur(combined, 3)
    combined = _enhance_thin_objects(combined)
    combined = cv2.dilate(combined, np.ones((3, 3), np.uint8), iterations=1)
    combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8), iterations=1)

    candidates = []

    contours, _ = cv2.findContours(combined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 80 or area > 40000:
            continue
        candidate = _candidate_from_min_rect(cv2.minAreaRect(contour), contour)
        if candidate:
            candidates.append(candidate)

    lines = cv2.HoughLinesP(
        combined,
        rho=1,
        theta=np.pi / 180,
        threshold=40,
        minLineLength=70,
        maxLineGap=18,
    )
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            length = float(np.hypot(x2 - x1, y2 - y1))
            if length < 70:
                continue
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2
            angle = float(np.degrees(np.arctan2(y2 - y1, x2 - x1)))
            pad = 10
            x = min(x1, x2) - pad
            y = min(y1, y2) - pad
            w = abs(x2 - x1) + pad * 2
            h = abs(y2 - y1) + pad * 2
            candidate = {
                "center": (int(cx), int(cy)),
                "bbox": (int(x), int(y), int(w), int(h)),
                "angle": angle,
                "area": float(length * 12),
                "length": length,
                "aspect": min(length / 10.0, 16.0),
            }
            candidates.append(candidate)

    if not candidates:
        return None

    best = max(candidates, key=lambda item: _score_candidate(item, previous))
    return {
        "center": best["center"],
        "bbox": best["bbox"],
        "angle": best["angle"],
        "area": best["area"],
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
