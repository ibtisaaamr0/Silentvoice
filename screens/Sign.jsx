import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import axios from "axios";
import RNFS from "react-native-fs";
import { useFocusEffect } from "@react-navigation/native";

// ⚠️ CHANGE THIS TO YOUR PC's IP ADDRESS
const BACKEND_URL = "http://192.168.100.185:8080/gesture";

export default function Sign() {
  const device = useCameraDevice("front");
  const cameraRef = useRef(null);
  const [gesture, setGesture] = useState("Show your hand...");
  const [status, setStatus] = useState("Connecting...");
  const isRunning = useRef(false);
  const intervalRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      Camera.requestCameraPermission();
      intervalRef.current = setInterval(captureAndSend, 1500);
      return () => clearInterval(intervalRef.current);
    }, [])
  );

  const captureAndSend = async () => {
    if (isRunning.current || !cameraRef.current) return;
    isRunning.current = true;
    try {
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: "speed",
        skipMetadata: true,
      });
      const base64 = await RNFS.readFile(photo.path, "base64");
      const res = await axios.post(BACKEND_URL, { image: base64 }, {
        timeout: 5000
      });
      setGesture(res.data.gesture);
      setStatus("✅ Connected");
    } catch (err) {
      setStatus("❌ " + err.message);
      console.log("ERROR:", err.message);
    } finally {
      isRunning.current = false;
    }
  };

  if (!device) return (
    <View style={styles.center}>
      <Text style={styles.text}>No Camera Found</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      {/* Status bar at top */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      {/* Gesture result at bottom */}
      <View style={styles.overlay}>
        <Text style={styles.label}>Detected Sign:</Text>
        <Text style={styles.gesture}>{gesture}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000"
  },
  statusBar: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "white",
    fontSize: 13,
  },
  overlay: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    padding: 20,
    borderRadius: 14,
    alignItems: "center",
    minWidth: 200,
  },
  label: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 6,
  },
  gesture: {
    fontSize: 32,
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  text: {
    color: "white",
    fontSize: 18,
  }
});