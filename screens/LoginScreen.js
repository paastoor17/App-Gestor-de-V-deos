import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { auth } from '../firebaseconfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import Toast from 'react-native-toast-message'; // Importar Toast

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLoginOrRegister = async () => {
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigation.navigate('AddVideoScreen');
    } catch (error) {
      const errorMessage = error.message;

      // Manejar error de contraseña débil
      if (errorMessage.includes('auth/weak-password')) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Weak password',
          text2: 'Password should be at least 6 characters long.',
          visibilityTime: 4000,
        });
      } 
      // Manejar error de email inválido
      else if (errorMessage.includes('auth/invalid-email')) {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Invalid email',
          text2: 'Please enter a valid email address.',
          visibilityTime: 4000,
        });
      }
      // Manejar otros errores genéricos
      else {
        Toast.show({
          type: 'error',
          position: 'top',
          text1: 'Error',
          text2: errorMessage,
          visibilityTime: 4000,
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isRegistering ? 'Register' : 'Login'}</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleLoginOrRegister}>
        <Text style={styles.buttonText}>{isRegistering ? 'Register' : 'Login'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)}>
        <Text style={styles.switchText}>
          {isRegistering ? 'Switch to Login' : 'Switch to Register'}
        </Text>
      </TouchableOpacity>

      {/* Agregar el Toast aquí */}
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f0f4f8', // Light blue-gray background
  },
  title: {
    fontSize: 36,
    marginBottom: 30,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#2c3e50', // Dark blue text
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  input: {
    width: '100%',
    padding: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    width: '100%',
    padding: 15,
    backgroundColor: '#3498db', // Bright blue button
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchText: {
    color: '#3498db',
    fontSize: 16,
    marginTop: 15,
    textDecorationLine: 'underline',
  },
});

