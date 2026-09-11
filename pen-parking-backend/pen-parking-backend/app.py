import os
import cv2
import numpy as np
from flask import Flask, jsonify, Response, request
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
from threading import Thread, Lock, Event
import time
from pen_datection import (
    detect_pen,
    compute_score,
    get_instruction,
    get_target_position,
    open_camera,
    parse_camera_source,
    normalize_camera_source,
)

app = Flask(__name__)
CORS(app)

# Global variables for camera stream
camera_lock = Lock()
cap = None
latest_frame = None
latest_pen_data = None
camera_active = False
camera_ready = Event()
camera_init_error = None
requested_camera_source = None


def init_camera():
    """Initialize camera from request, environment, or default source"""
    global cap
    camera_source = normalize_camera_source(
        requested_camera_source if requested_camera_source is not None else parse_camera_source()
    )
    cap = open_camera(camera_source)
    if not cap.isOpened():
        print(f"Warning: Could not open camera source: {camera_source}")
        return False
    print(f"Camera initialized from: {camera_source}")
    return True


def annotate_frame(frame, pen_data):
    """Draw parking zone and pen detection on a frame copy."""
    annotated = frame.copy()
    target = get_target_position(annotated.shape)

    cv2.circle(annotated, (target["x"], target["y"]), 12, (255, 255, 0), 2)
    cv2.putText(
        annotated,
        "Target Parking Zone",
        (target["x"] + 15, target["y"] - 15),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (255, 255, 0),
        1,
    )

    if pen_data and pen_data.get("detected"):
        cx, cy = pen_data["center"]["x"], pen_data["center"]["y"]
        px, py = pen_data["bbox"]["x"], pen_data["bbox"]["y"]
        w, h = pen_data["bbox"]["width"], pen_data["bbox"]["height"]

        cv2.rectangle(annotated, (px, py), (px + w, py + h), (0, 255, 0), 2)
        cv2.circle(annotated, (cx, cy), 5, (0, 0, 255), -1)
        cv2.line(annotated, (cx, cy), (target["x"], target["y"]), (255, 0, 0), 2)
        cv2.putText(
            annotated,
            f"Pen Score: {pen_data['score']:.0f}/100",
            (20, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 255),
            2,
        )
        cv2.putText(
            annotated,
            pen_data["instruction"],
            (20, annotated.shape[0] - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2,
        )
    else:
        cv2.putText(
            annotated,
            "No pen detected",
            (20, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 0, 255),
            2,
        )

    return annotated


def camera_worker():
    """Background thread to continuously read from camera"""
    global latest_frame, latest_pen_data, camera_active, camera_init_error

    camera_ready.clear()
    camera_init_error = None

    if not init_camera():
        camera_init_error = "Could not open camera. For phone: use IP Webcam URL like http://192.168.x.x:8080/video"
        return

    camera_active = True
    camera_ready.set()
    last_pen = None
    missed_frames = 0

    while camera_active:
        with camera_lock:
            ret, frame = cap.read()
            if not ret:
                print("Camera read failed")
                break
            
            latest_frame = frame.copy()
            
            target = get_target_position(frame.shape)
            pen = detect_pen(frame, last_pen)

            if pen:
                last_pen = pen
                missed_frames = 0
            elif last_pen is not None and missed_frames < 12:
                pen = last_pen
                missed_frames += 1
            else:
                last_pen = None
                missed_frames = 0
                pen = None
            
            if pen:
                cx, cy = pen["center"]
                angle = pen["angle"]
                score, dx, dy, distance = compute_score((cx, cy), angle, target)
                instruction = get_instruction(dx, dy)
                
                latest_pen_data = {
                    "detected": True,
                    "center": {"x": cx, "y": cy},
                    "bbox": {
                        "x": pen["bbox"][0],
                        "y": pen["bbox"][1],
                        "width": pen["bbox"][2],
                        "height": pen["bbox"][3],
                    },
                    "angle": float(angle),
                    "area": float(pen["area"]),
                    "score": float(score),
                    "distance": float(distance),
                    "dx": float(dx),
                    "dy": float(dy),
                    "instruction": instruction,
                    "target": target,
                }
            else:
                latest_pen_data = {
                    "detected": False,
                    "target": get_target_position(frame.shape),
                }


def generate_frames():
    """Generator function for streaming video frames"""
    while camera_active:
        with camera_lock:
            if latest_frame is None:
                time.sleep(0.05)
                continue
            frame = annotate_frame(latest_frame, latest_pen_data)

        ret, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        if not ret:
            continue
        frame_bytes = buffer.tobytes()

        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n"
            + frame_bytes
            + b"\r\n"
        )
        time.sleep(0.033)


# ==================== API Routes ====================


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "PenPark Backend"})


@app.route("/api/camera/start", methods=["POST"])
def start_camera():
    """Start camera streaming from laptop webcam or phone IP camera."""
    global camera_active, cap, requested_camera_source

    payload = request.get_json(silent=True) or {}
    source = payload.get("source")
    if source is not None and str(source).strip() != "":
        requested_camera_source = str(source).strip()
    else:
        requested_camera_source = None

    if camera_active:
        camera_active = False
        camera_ready.clear()
        time.sleep(0.4)
        if cap:
            cap.release()
            cap = None

    camera_thread = Thread(target=camera_worker, daemon=True)
    camera_thread.start()

    wait_seconds = 15 if requested_camera_source and str(requested_camera_source).startswith("http") else 8
    if not camera_ready.wait(timeout=wait_seconds):
        camera_active = False
        if cap:
            cap.release()
            cap = None
        return jsonify({
            "error": camera_init_error or "Camera failed to start. Check phone IP, WiFi, and /video URL."
        }), 500

    return jsonify({
        "status": "Camera started",
        "message": "Camera stream initialized",
        "source": requested_camera_source or parse_camera_source(),
    })


@app.route("/api/camera/stop", methods=["POST"])
def stop_camera():
    """Stop camera streaming"""
    global camera_active, cap, latest_frame, latest_pen_data

    camera_active = False
    camera_ready.clear()
    if cap:
        cap.release()
        cap = None
    latest_frame = None
    latest_pen_data = None

    return jsonify({"status": "Camera stopped"})


@app.route("/api/camera/status", methods=["GET"])
def camera_status():
    """Get camera status"""
    return jsonify({
        "active": camera_active,
        "has_frame": latest_frame is not None,
        "pen_detected": latest_pen_data is not None and latest_pen_data.get("detected", False),
    })


@app.route("/api/camera/frame", methods=["GET"])
def get_frame():
    """Get current frame with pen detection data"""
    global latest_pen_data
    
    if latest_pen_data is None:
        return jsonify({"error": "No frame available"}), 404
    
    return jsonify(latest_pen_data)


@app.route("/api/camera/snapshot")
def camera_snapshot():
    """Return a single annotated JPEG frame (best for browser polling)."""
    if not camera_active or latest_frame is None:
        return jsonify({"error": "No frame available"}), 404

    with camera_lock:
        frame = annotate_frame(latest_frame, latest_pen_data)

    ret, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
    if not ret:
        return jsonify({"error": "Failed to encode frame"}), 500

    return Response(buffer.tobytes(), mimetype="image/jpeg")


@app.route("/api/camera/video_feed")
def video_feed():
    """Stream video feed with pen detection overlay"""
    return Response(
        generate_frames(),
        mimetype="multipart/x-mixed-replace; boundary=frame"
    )


@app.route("/api/parking/check", methods=["POST"])
def check_parking():
    """Check if pen is properly parked"""
    if latest_pen_data is None:
        return jsonify({"error": "No detection data available"}), 404
    
    pen_data = latest_pen_data
    
    if not pen_data.get("detected"):
        return jsonify({
            "parked": False,
            "score": 0,
            "message": "No pen detected"
        })
    
    is_parked = pen_data["score"] >= 85  # Threshold for "parked"
    
    return jsonify({
        "parked": is_parked,
        "score": pen_data["score"],
        "message": "Pen properly parked!" if is_parked else pen_data["instruction"],
        "details": {
            "angle": pen_data["angle"],
            "distance": pen_data["distance"],
            "dx": pen_data["dx"],
            "dy": pen_data["dy"],
        }
    })


@app.route("/api/parking/history", methods=["GET"])
def parking_history():
    """Get parking history (placeholder)"""
    return jsonify({
        "history": [
            {
                "id": 1,
                "timestamp": "2024-12-15 10:30:00",
                "duration": "00:05:23",
                "score": 95,
                "status": "success"
            },
            {
                "id": 2,
                "timestamp": "2024-12-15 10:25:00",
                "duration": "00:03:15",
                "score": 87,
                "status": "success"
            }
        ]
    })


@app.route("/api/parking/stats", methods=["GET"])
def parking_stats():
    """Get parking statistics"""
    return jsonify({
        "total_attempts": 42,
        "successful_parks": 38,
        "success_rate": 90.5,
        "average_score": 87.3,
        "today_parks": 5,
    })


@app.route("/api/config", methods=["GET"])
def get_config():
    """Get configuration"""
    return jsonify({
        "target_ratio_x": 0.38,
        "target_ratio_y": 0.73,
        "target_angle": 0.0,
        "min_area": 300,
        "success_threshold": 85,
    })


if __name__ == "__main__":
    print("Starting PenPark Backend Server...")
    print("Running on http://localhost:5000")
    print("Frontend should connect to this API")
    
    app.run(debug=False, host="0.0.0.0", port=5000, threaded=True)
