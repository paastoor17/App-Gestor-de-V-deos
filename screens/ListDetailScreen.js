import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, Image, TouchableOpacity, Modal, StyleSheet, Alert, Animated } from 'react-native';
import { WebView } from 'react-native-webview';
import { db } from '../firebaseconfig';
import { collection, query, where, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';  // Importar useFocusEffect
import Icon from 'react-native-vector-icons/FontAwesome';

const ListDetailScreen = ({ navigation }) => {
  const [videos, setVideos] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState('');
  const auth = getAuth();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(50));

  useFocusEffect(
    React.useCallback(() => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const q = query(collection(db, 'videos'), where('userId', '==', userId));

        // Usamos onSnapshot para recibir actualizaciones en tiempo real
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const videoList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setVideos(videoList);
        });

        // Limpiar el listener cuando el componente se desmonte o cuando se pierda el foco
        return () => unsubscribe();
      }
    }, [auth.currentUser?.uid])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePlayVideo = (url) => {
    setSelectedUrl(url);
    setIsFullScreen(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
    setSelectedUrl('');
  };

  const handleDeleteVideo = (id) => {
    Alert.alert(
      "Eliminar Video",
      "¿Estás seguro de que deseas eliminar este video?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'videos', id));
            } catch (error) {
              console.error('Error eliminando el video: ', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {isFullScreen ? (
        <View style={styles.fullScreenContainer}>
          <WebView source={{ uri: selectedUrl }} style={styles.fullScreenWebView} />
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Animated.View 
              style={[styles.videoItem, {
                opacity: fadeAnim,
                transform: [{ translateY: translateY }]
              }]}
            >
              <Image source={{ uri: item.thumbnail }} style={styles.videoThumbnail} />
              <Text style={styles.videoTitle}>{item.title}</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.playButton]} onPress={() => handlePlayVideo(item.url)}>
                  <Icon name="play" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Play</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => handleDeleteVideo(item.id)}>
                  <Icon name="trash" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        />
      )}
      {/* Botón para regresar a la pantalla anterior */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>GoBack </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    padding: 15,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  fullScreenWebView: {
    flex: 1,
  },
  videoItem: {
    marginBottom: 25,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  videoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#2c3e50',
  },
  descriptionText: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 15,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  playButton: {
    backgroundColor: '#3498db',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  backButton: {
    marginTop: 25,
    backgroundColor: '#2c3e50',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ListDetailScreen;

