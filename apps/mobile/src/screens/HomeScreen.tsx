import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';

export function HomeScreen() {
  const dispatch = useDispatch();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Welcome to School ERP</Text>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardValue}>—</Text>
          <Text style={styles.cardLabel}>Students</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValue}>—</Text>
          <Text style={styles.cardLabel}>Attendance</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => dispatch(logout())}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB', paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 24 },
  grid: { flexDirection: 'row', gap: 12 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  cardValue: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  cardLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  logoutBtn: { marginTop: 32, alignItems: 'center' },
  logoutText: { color: '#6B7280', fontSize: 14 },
});
