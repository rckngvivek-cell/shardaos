import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');

  // Handle phone number login with OTP
  const handlePhoneLogin = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      Alert.alert('Error', 'Please enter valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber('+91' + phoneNumber);
      setVerificationId(confirmation.verificationId);
      setShowOtpInput(true);
      Alert.alert('Success', 'OTP sent to your phone');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter OTP');
      return;
    }

    if (!verificationId) {
      Alert.alert('Error', 'Verification ID not found');
      return;
    }

    setLoading(true);
    try {
      const credential = auth.PhoneAuthProvider.credential(verificationId, otp);
      const userCredential = await auth().signInWithCredential(credential);
      
      // Cache user info
      await AsyncStorage.setItem('userId', userCredential.user.uid);
      await AsyncStorage.setItem('userPhone', phoneNumber);
      
      navigation.replace('Dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle email/password login
  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      
      // Cache user info
      await AsyncStorage.setItem('userId', userCredential.user.uid);
      await AsyncStorage.setItem('userEmail', email);
      
      navigation.replace('Dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>School ERP</Text>
          <Text style={styles.subtitle}>Student App</Text>
        </View>

        {!showOtpInput ? (
          <View style={styles.form}>
            {/* Phone Login Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Login with Phone</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number (+91)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit phone number"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  editable={!loading}
                  placeholderTextColor="#999"
                />
              </View>
              <Button
                mode="contained"
                onPress={handlePhoneLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
              >
                Send OTP
              </Button>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email Login Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Login with Email</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  editable={!loading}
                  placeholderTextColor="#999"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                  placeholderTextColor="#999"
                />
              </View>
              <Button
                mode="contained"
                onPress={handleEmailLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
              >
                Login
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Enter OTP</Text>
            <Text style={styles.helpText}>
              We've sent an OTP to {phoneNumber}
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>One-Time Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
                placeholderTextColor="#999"
              />
            </View>
            <Button
              mode="contained"
              onPress={handleVerifyOtp}
              loading={loading}
              disabled={loading}
              style={styles.button}
            >
              Verify OTP
            </Button>
            <Button
              mode="text"
              onPress={() => {
                setShowOtpInput(false);
                setOtp('');
                setVerificationId(null);
              }}
              disabled={loading}
              style={styles.secondaryButton}
            >
              Back to Login
            </Button>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  button: {
    marginTop: 12,
    paddingVertical: 6,
  },
  secondaryButton: {
    marginTop: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 12,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
});

export default LoginScreen;
