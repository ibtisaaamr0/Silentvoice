import React, { useEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';

const BACKEND_URL = "http://10.0.2.2:5000";

export default function CameraScreen() {
  const device = useCameraDevice('front');

  useEffect(() => {
    (async () => {
      const permission = await Camera.requestCameraPermission();
      console.log("Camera permission:", permission);
    })();
  }, []);

  // FRAME PROCESSOR (runs every frame)
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    // ⚠️ You cannot directly use fetch here
    runOnJS(sendFrameToBackend)();
  }, []);

  const sendFrameToBackend = async () => {
    try {
      await fetch(`${BACKEND_URL}/frame`, {
        method: 'POST',
      });
    } catch (e) {
      console.log("Frame send error", e);
    }
  };

  if (device == null) return <Text>No Camera Found</Text>;

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        frameProcessorFps={1}
      />
    </View>
  );
}