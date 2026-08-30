import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TextInput,
  Dimensions,
  SafeAreaView,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function App() {
  const [nombre, setNombre] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
            style={styles.avatar}
          />
          <Text style={styles.headerTitle}>Mi Perfil</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu nombre"
            value={nombre}
            onChangeText={setNombre}
          />
          {nombre !== '' && (
            <Text style={styles.saludo}>Hola, {nombre} !</Text>
          )}
        </View>

        <View style={styles.row}>
          <View style={styles.miniCard}>
            <Text style={styles.miniTitle}>Proyectos</Text>
            <Text style={styles.miniValue}>12</Text>
          </View>
          <View style={styles.miniCard}>
            <Text style={styles.miniTitle}>Tareas</Text>
            <Text style={styles.miniValue}>8</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f4f7fa',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#20232a',
  },
  card: {
    width: width * 0.9,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: '#3c4257',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  saludo: {
    color: '#0d8bb0',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.9,
    alignSelf: 'center',
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  miniTitle: {
    fontSize: 12,
    color: '#3c4257',
  },
  miniValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#20232a',
  },
});
