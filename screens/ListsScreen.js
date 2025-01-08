import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, Alert } from 'react-native';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebaseconfig';
import { useFocusEffect } from '@react-navigation/native';

const ListsScreen = ({ navigation }) => {
  const [lists, setLists] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [allVideos, setAllVideos] = useState([]);

  const fetchLists = async () => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      console.log('Obteniendo listas para el usuario:', userId);
      const q = query(collection(db, 'lists'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      const userLists = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Listas obtenidas:', userLists);
      setLists(userLists);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchLists();
      fetchVideos();
    }, [])
  );

  useEffect(() => {
    fetchVideos();

    const userId = auth.currentUser?.uid;
    if (userId) {
      const q = query(collection(db, 'lists'), where('userId', '==', userId));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userLists = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLists(userLists);
      });

      return () => unsubscribe();
    }
  }, []);

  const fetchVideos = async () => {
    const userId = auth.currentUser?.uid;
    const q = query(collection(db, 'videos'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const userVideos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setAllVideos(userVideos);
  };

  const handleCreateList = async () => {
    const userId = auth.currentUser?.uid;
    if (userId && title && selectedVideos.length > 0) {
      await addDoc(collection(db, 'lists'), {
        userId,
        title,
        videos: selectedVideos,
      });
      setIsModalVisible(false);
      setTitle('');
      setSelectedVideos([]);
      fetchLists();
    } else {
      alert('Completa todos los campos y selecciona al menos un video');
    }
  };

  const handleDeleteList = async (listId) => {
    Alert.alert(
      'Eliminar lista',
      '¿Estás seguro de que deseas eliminar esta lista?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          onPress: async () => {
            try {
              console.log('Intentando eliminar lista con ID:', listId);
              // Eliminar la lista de Firestore
              const listRef = doc(db, 'lists', listId);
              await deleteDoc(listRef);
              console.log('Lista eliminada de Firestore');
              // Eliminar la lista del estado local
              setLists(prevLists => {
                const updatedLists = prevLists.filter(list => list.id !== listId);
                console.log('Listas actualizadas:', updatedLists);
                return updatedLists;
              });
              await refreshLists();
              // Mostrar un mensaje de éxito
              Alert.alert('Éxito', 'La lista ha sido eliminada correctamente.');
            } catch (error) {
              console.error('Error al eliminar la lista:', error);
              Alert.alert('Error', 'No se pudo eliminar la lista. Por favor, inténtalo de nuevo.');
            }
          },
        },
      ]
    );
  };

  const refreshLists = async () => {
    console.log('Actualizando listas...');
    await fetchLists();
    console.log('Listas actualizadas');
  };

  const handleRemoveVideo = (videoId) => {
    setSelectedVideos(prevSelectedVideos =>
      prevSelectedVideos.filter(video => video.id !== videoId)
    );
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => setIsModalVisible(true)}>
        <Text style={styles.buttonText}>Create List</Text>
      </TouchableOpacity>

      <FlatList
        data={lists}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <TouchableOpacity
              onPress={() => navigation.navigate('ListDetailScreen', { list: item })}
            >
              <Text style={styles.listTitle}>{item.title}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteList(item.id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.input}
            placeholder="List Title"
            value={title}
            onChangeText={setTitle}
          />
          <FlatList
            data={allVideos}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View>
                <TouchableOpacity
                  style={[
                    styles.videoItem,
                    selectedVideos.some(video => video.id === item.id) && styles.selectedVideo,
                  ]}
                  onPress={() => {
                    setSelectedVideos(prev =>
                      prev.some(video => video.id === item.id)
                        ? prev.filter(video => video.id !== item.id)
                        : [...prev, item]
                    );
                  }}
                >
                  <Text>{item.title}</Text>
                </TouchableOpacity>

                {selectedVideos.some(video => video.id === item.id) && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveVideo(item.id)}
                  >
                    <Text>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
          <TouchableOpacity style={styles.button} onPress={handleCreateList}>
            <Text style={styles.buttonText}>Save List</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buttonCancel} onPress={handleCloseModal}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#f0f4f8' 
  },
  button: { 
    backgroundColor: '#3498db', 
    padding: 15, 
    borderRadius: 30, 
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonCancel: { 
    backgroundColor: '#95a5a6', 
    padding: 15, 
    borderRadius: 30, 
    marginVertical: 15 
  },
  buttonText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontWeight: 'bold',
    fontSize: 18,
  },
  listItem: { 
    padding: 20, 
    borderBottomWidth: 1, 
    borderColor: '#ecf0f1', 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#2c3e50' 
  },
  deleteButton: { 
    backgroundColor: '#e74c3c', 
    padding: 10, 
    borderRadius: 20 
  },
  deleteButtonText: { 
    color: 'white',
    fontWeight: 'bold'
  },
  modalContainer: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#f0f4f8' 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#bdc3c7', 
    padding: 12, 
    marginVertical: 20, 
    borderRadius: 8,
    fontSize: 16
  },
  videoItem: { 
    padding: 15, 
    borderBottomWidth: 1, 
    borderColor: '#ecf0f1' 
  },
  selectedVideo: { 
    backgroundColor: '#3498db',
    borderRadius: 8
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
    alignSelf: 'flex-start'
  }
});

export default ListsScreen;

