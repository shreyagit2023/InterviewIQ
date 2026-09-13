import {
  FaceDetector,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

let faceDetector = null;
let initializing = null;

const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm";

const MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

export const initializeFaceDetector = async () => {
  if (faceDetector) {
    return faceDetector;
  }

  if (initializing) {
    return initializing;
  }

  initializing = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      WASM_PATH
    );

    faceDetector =
      await FaceDetector.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath: MODEL_PATH,
          },

          runningMode: "VIDEO",

          minDetectionConfidence: 0.5,
        }
      );

    return faceDetector;
  })();

  try {
    return await initializing;
  } finally {
    initializing = null;
  }
};

export const detectFace = (
  videoElement,
  timestamp
) => {
  if (!faceDetector || !videoElement) {
    return false;
  }

  if (
    videoElement.readyState <
    HTMLMediaElement.HAVE_CURRENT_DATA
  ) {
    return false;
  }

  const result =
    faceDetector.detectForVideo(
      videoElement,
      timestamp
    );

  return result.detections.length > 0;
};