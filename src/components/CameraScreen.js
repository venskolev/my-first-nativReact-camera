import React, { useState, useEffect, useRef } from "react";
import { Camera } from "expo-camera";
import {
  Button,
  StyleSheet,
  Text,
  // TouchableOpacity,
  View,
  Dimensions,
  Alert,
  Platform,
} from "react-native";
import * as MediaLibrary from "expo-media-library";

// icons
import { MaterialIcons } from '@expo/vector-icons';
import { Entypo } from '@expo/vector-icons';

import { PanResponder, TouchableOpacity as GestureTouchableOpacity } from 'react-native'; 
// import { TapGestureHandler, State } from 'react-native-gesture-handler';

const initialFocusIconPosition = { x: 0, y: 0 };

export default function CameraApp() {
  // Управление на компонентата
  const [focusIconPosition, setFocusIconPosition] = useState(initialFocusIconPosition);
  const [showFocusIcon, setShowFocusIcon] = useState(true);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef(null);
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));
  const [lastCoordinate, setLastCoordinate] = useState({ x: 0, y: 0 });

  // Използване на useEffect за следене на промените в размерите на прозореца
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions(Dimensions.get("window"));
    };

    Dimensions.addEventListener("change", updateDimensions);

    return () => {
      Dimensions.removeEventListener("change", updateDimensions);
    };
  }, []);

  // Използване на useEffect за искане на разрешение за камерата при първоначално зареждане
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Ако разрешението все още не е било определено, показваме празен екран
  if (hasPermission === null) {
    return <View />;
  }

  // Ако разрешението е отказано, показваме съобщение и бутон за повторно искане на разрешение
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <Button
          onPress={() => Camera.requestCameraPermissionsAsync()}
          title="Grant Permission"
        />
      </View>
    );
  }

  // Създаване на PanResponder за проследяване на жестовете
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      // Обновяване на позицията на иконата за фокус при движение на жеста
      const x = gestureState.moveX - dimensions.width / 2;
      const y = gestureState.moveY - dimensions.height / 2;
      setFocusIconPosition({ x, y });
      setShowFocusIcon(true);
    },
    onPanResponderRelease: (_, gestureState) => {
      // Запазване на последните координати при освобождаване на жеста
      setLastCoordinate({
        x: gestureState.moveX - dimensions.width / 2,
        y: gestureState.moveY - dimensions.height / 2,
      });
      setShowFocusIcon(true);
    },
  });

  // Функция за стартиране на камерата
  const startCamera = async () => {
    setCameraReady(true);
    const { current } = cameraRef;
    if (current) {
      await current.resumePreview();
      focusCamera();
    }
  };

  // Функция за фокусиране на камерата
  const focusCamera = () => {
    if (cameraRef.current) {
      const getCamera = cameraRef.current.getCamera;
      if (getCamera && typeof getCamera === "function") {
        const camera = getCamera();
        if (camera && camera.focus) {
          camera.focus();
        }
      } 
      setFocusIconPosition({ x: lastCoordinate.x, y: lastCoordinate.y });
    }
  };

  // Функция за заснемане на снимка
  const takePicture = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.5, base64: true };
      const data = await cameraRef.current.takePictureAsync(options);
      console.log("Picture taken:", data);
      savePictureToGallery(data.uri);
    }
  };

  // Функция за запазване на снимката в галерията
  const savePictureToGallery = async (uri) => {
    if (Platform.OS === "android") {
      try {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert("Success", "The picture has been saved to the gallery!");
      } catch (error) {
        console.error("Error saving picture to gallery:", error);
      }
    } else {
      try {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert("Success", "The picture has been saved to the gallery!");
      } catch (error) {
        console.error("Error saving picture to gallery:", error);
      }
    }
  };

  // Функция за промяна на типа на камерата - предна/задна
  function toggleCameraType() {
    setType((current) =>
      current === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  }

  // Визуализация на компонентата
  return (
    <View style={{ ...styles.container, width: dimensions.width, height: dimensions.height }}>
      {!isCameraReady ? (
        <View style={styles.container}>
          <Button style={styles.button} onPress={startCamera} title="Start Camera" />
        </View>
      ) : (
        <Camera
          style={{ ...styles.camera, width: dimensions.width, height: dimensions.height }}
          type={type}
          ref={cameraRef}
          ratio="16:9"
        >
          <View style={styles.buttonContainer}>
            <GestureTouchableOpacity style={styles.button} onPress={takePicture}>
              <Entypo name="picasa" size={24} color="black" />
            </GestureTouchableOpacity>
            <GestureTouchableOpacity style={styles.button} onPress={toggleCameraType}>
              <MaterialIcons name="flip-camera-android" size={24} color="black" />
            </GestureTouchableOpacity>
            {showFocusIcon && (
              <View
                style={{
                  ...styles.button,
                  position: 'absolute',
                  top: focusIconPosition.y + dimensions.height / 2 - 20,
                  left: focusIconPosition.x + dimensions.width / 2 - 20,
                }}
                {...panResponder.panHandlers}
              >
                <MaterialIcons name="adjust" size={40} color="red" />
              </View>
            )}
          </View>
        </Camera>
      )}
    </View>
  );
}

// Визуални стилове
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    justifyContent: "space-between",
    margin: 20,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 15,
    borderRadius: 10,
  },
  text: {
    fontSize: 18,
    color: "white",
  },
});
