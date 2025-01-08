import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, Modal, TouchableOpacity, Image, Switch, StyleSheet, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { db } from '../firebaseconfig';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';


const AddVideoScreen = ({navigation}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [isInstagram, setIsInstagram] = useState(false);
  const [videos, setVideos] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState('');
  const auth = getAuth();
  const [date, setDate] = useState(new Date().toLocaleString());

  // Formatear la fecha para mostrarla de forma legible
  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = new Date(date).toLocaleDateString('es-ES', options);
    return formattedDate;
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchVideos();
    }, [])
  );

  const fetchVideos = async () => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const q = query(collection(db, 'videos'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const videoList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVideos(videoList);
    }
  };

  const handleAddVideo = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (userId && title && description && url) {
        let thumbnailUrl;
        if (isInstagram) {
          thumbnailUrl = await getInstagramThumbnail(url);
        } else {
          thumbnailUrl = getYouTubeThumbnail(url);
        }

        if (thumbnailUrl) {
          const currentDate = new Date();
          console.log("Fecha actual: ", currentDate); 

          await addDoc(collection(db, 'videos'), {
            userId,
            title,
            description,
            url,
            platform: isInstagram ? 'Instagram' : 'YouTube',
            thumbnail: thumbnailUrl,
            date: currentDate.toISOString(), 
          });

          setTitle('');
          setDescription('');
          setUrl('');
          setIsInstagram(false);
          setIsModalVisible(false);
          fetchVideos();
          Alert.alert('Éxito', 'El video se ha añadido correctamente.');
        } else {
          Alert.alert('Error', 'No se pudo generar la miniatura. Por favor, verifica la URL.');
        }
      } else {
        Alert.alert('Error', 'Por favor, completa todos los campos');
      }
    } catch (error) {
      console.error('Error añadiendo el video: ', error.message);
      Alert.alert('Error', 'No se pudo añadir el video. Por favor, inténtalo de nuevo.');
    }
  };

  const handleDeleteVideo = async (id) => {
    try {
      await deleteDoc(doc(db, 'videos', id));
      fetchVideos();
    } catch (error) {
      console.error('Error eliminando el video: ', error.message);
    }
  };

  const handlePlayVideo = (url) => {
    setSelectedUrl(url);
    setIsFullScreen(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
    setSelectedUrl('');
  };

  const getYouTubeThumbnail = (url) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/[^\/]+\/|(?:v|embed)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/0.jpg` : null;
  };

  const getInstagramThumbnail = async (url) => {
    try {
      // Intenta obtener el ID del post de Instagram de la URL
      const regex = /instagram\.com\/(?:p|reel)\/([^/?]+)/;
      const match = url.match(regex);
      if (match && match[1]) {
        const postId = match[1];
        // Usa la API de oEmbed de Instagram para obtener información sobre el post
        const response = await fetch(`https://api.instagram.com/oembed/?url=https://instagram.com/p/${postId}/`);
        const data = await response.json();
        if (data && data.thumbnail_url) {
          return data.thumbnail_url;
        }
      }
    } catch (error) {
      console.error('Error al obtener la miniatura de Instagram:', error);
    }
    // Si no se puede obtener la miniatura, usa una imagen por defecto
    return Image.resolveAssetSource(require('../assets/instagram_thumbnail.jpg')).uri;
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {isFullScreen ? (
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseFullScreen}>
            <Text style={styles.closeButtonText}>GoBack</Text>
          </TouchableOpacity>
          <WebView source={{ uri: selectedUrl }} style={styles.fullScreenWebView} />
        </View>
      ) : (
        <>
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.videoItem}>
                <Image source={{ uri: item.thumbnail }} style={styles.videoThumbnail} />
                <Text style={styles.videoTitle}>{item.title}</Text>
                <Text style={styles.descriptionText}>{item.description}</Text>
                <Text style={styles.platformText}>Plataforma: {item.platform}</Text>
                {/* Aquí se formatea la fecha */}
                            <Text style={styles.videoItem}>
              <Text style={styles.dateContainer}>
                <Text style={styles.dateText}>{formatDate(item.date)}</Text>
              </Text>
            </Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={[styles.button, styles.playButton]} onPress={() => handlePlayVideo(item.url)}>
                    <Text style={styles.buttonText}>Play</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={() => handleDeleteVideo(item.id)}>
                    <Text style={styles.buttonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
          <TouchableOpacity style={styles.fabButton} onPress={() => setIsModalVisible(true)}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
          <Modal visible={isModalVisible} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TouchableOpacity style={styles.closeButtonModal} onPress={() => setIsModalVisible(false)} />
                <TextInput
                  placeholder="Título"
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                  placeholderTextColor="#003049"
                />
                <TextInput
                  placeholder="Descripción"
                  value={description}
                  onChangeText={setDescription}
                  style={styles.input}
                  placeholderTextColor="#003049"
                />
                <TextInput
                  placeholder="URL"
                  value={url}
                  onChangeText={setUrl}
                  style={styles.input}
                  placeholderTextColor="#003049"
                />
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Select YouTube or Instagram</Text>
                  <Switch
                    value={isInstagram}
                    onValueChange={setIsInstagram}
                    trackColor={{ true: '#fcbf49', false: '#eae2b7' }}
                    thumbColor="#003049"
                  />
                  <Text style={styles.switchLabel}>{isInstagram ? "Instagram" : "YouTube"}</Text>
                </View>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity style={[styles.button, styles.addButton]} onPress={handleAddVideo}>
                    <Text style={styles.buttonText}>Añadir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setIsModalVisible(false)}>
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f4f8',
    flex: 1,
    position: 'relative',
  },
  fabButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 70,
    height: 70,
    backgroundColor: '#3498db',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 10,
  },
  fabText: {
    fontSize: 40,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(44, 62, 80, 0.9)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    padding: 25,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    elevation: 8,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#bdc3c7',
    marginBottom: 20,
    padding: 12,
    fontSize: 18,
    color: '#2c3e50',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    marginRight: 15,
    color: '#2c3e50',
    fontSize: 18,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  addButton: {
    backgroundColor: '#3498db',
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
  },
  playButton: {
    backgroundColor: '#2ecc71',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  videoItem: {
    marginBottom: 25,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  videoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#2c3e50',
    textAlign: 'center',
    backgroundColor: '#ecf0f1',
    paddingVertical: 8,
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 15,
    lineHeight: 24,
    textAlign: 'justify',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  platformText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    backgroundColor: '#3498db',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullScreenWebView: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    width: '100%',
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  dateText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    padding: 5,
    borderRadius: 5,
    marginRight: 10,
  },
});

export default AddVideoScreen;

