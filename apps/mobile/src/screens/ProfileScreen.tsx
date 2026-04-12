import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileScreenProps {
  navigation: any;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Rohan',
    lastName: 'Sharma',
    email: 'rohan.sharma@school.edu',
    phone: '9876543210',
    dob: '2010-01-15',
    rollNumber: '101',
    section: 'A',
  });

  const [editedData, setEditedData] = useState(formData);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedData(formData);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    // Validation
    if (
      !editedData.firstName.trim() ||
      !editedData.lastName.trim() ||
      !editedData.email.trim()
    ) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      // Save to AsyncStorage for now
      await AsyncStorage.setItem('studentProfile', JSON.stringify(editedData));
      setFormData(editedData);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleChangePassword = () => {
    if (
      !passwordForm.oldPassword.trim() ||
      !passwordForm.newPassword.trim() ||
      !passwordForm.confirmPassword.trim()
    ) {
      Alert.alert('Error', 'Please fill all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // In real app, validate old password and update in Firebase
    Alert.alert('Success', 'Password changed successfully');
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordForm(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('userId');
            await AsyncStorage.removeItem('studentId');
            navigation.replace('Login');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profilePicture}>
            <MaterialIcons name="person" size={60} color="white" />
          </View>
          <Text style={styles.profileName}>
            {formData.firstName} {formData.lastName}
          </Text>
          <Text style={styles.rollNumber}>Roll No: {formData.rollNumber}</Text>
        </View>

        {/* Profile Form */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Personal Information</Text>
              {!isEditing && (
                <TouchableOpacity onPress={handleEditToggle}>
                  <MaterialIcons name="edit" size={20} color="#1976d2" />
                </TouchableOpacity>
              )}
            </View>

            {/* First Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>First Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.firstName}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, firstName: text })
                  }
                  editable={isEditing}
                />
              ) : (
                <Text style={styles.value}>{formData.firstName}</Text>
              )}
            </View>

            {/* Last Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Last Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.lastName}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, lastName: text })
                  }
                  editable={isEditing}
                />
              ) : (
                <Text style={styles.value}>{formData.lastName}</Text>
              )}
            </View>

            {/* Email */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.email}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, email: text })
                  }
                  keyboardType="email-address"
                  editable={isEditing}
                />
              ) : (
                <Text style={styles.value}>{formData.email}</Text>
              )}
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.phone}
                  onChangeText={(text) =>
                    setEditedData({ ...editedData, phone: text })
                  }
                  keyboardType="phone-pad"
                  editable={isEditing}
                />
              ) : (
                <Text style={styles.value}>{formData.phone}</Text>
              )}
            </View>

            {/* DOB */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <Text style={styles.value}>{formData.dob}</Text>
            </View>

            {/* Section */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Section</Text>
              <Text style={styles.value}>{formData.section}</Text>
            </View>

            {/* Action Buttons */}
            {isEditing && (
              <View style={styles.buttonGroup}>
                <Button
                  mode="contained"
                  onPress={handleSaveProfile}
                  style={styles.saveButton}
                >
                  Save Changes
                </Button>
                <Button
                  mode="outlined"
                  onPress={handleEditToggle}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Change Password Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Security</Text>
            </View>

            {!showPasswordForm ? (
              <Button
                mode="outlined"
                onPress={() => setShowPasswordForm(true)}
                style={styles.changePasswordBtn}
              >
                Change Password
              </Button>
            ) : (
              <View>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Current Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter current password"
                    secureTextEntry
                    value={passwordForm.oldPassword}
                    onChangeText={(text) =>
                      setPasswordForm({ ...passwordForm, oldPassword: text })
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password"
                    secureTextEntry
                    value={passwordForm.newPassword}
                    onChangeText={(text) =>
                      setPasswordForm({ ...passwordForm, newPassword: text })
                    }
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm new password"
                    secureTextEntry
                    value={passwordForm.confirmPassword}
                    onChangeText={(text) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: text })
                    }
                  />
                </View>

                <View style={styles.buttonGroup}>
                  <Button
                    mode="contained"
                    onPress={handleChangePassword}
                    style={styles.saveButton}
                  >
                    Update Password
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({
                        oldPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </Button>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            mode="contained"
            onPress={handleLogout}
            buttonColor="#f44336"
            style={styles.logoutButton}
          >
            Logout
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1976d2',
    paddingVertical: 30,
    alignItems: 'center',
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  rollNumber: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  card: {
    marginHorizontal: 12,
    marginVertical: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: '#333',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  buttonGroup: {
    gap: 8,
    marginTop: 16,
  },
  saveButton: {
    paddingVertical: 6,
  },
  cancelButton: {
    paddingVertical: 6,
  },
  changePasswordBtn: {
    marginBottom: 16,
  },
  logoutContainer: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  logoutButton: {
    paddingVertical: 6,
  },
});

export default ProfileScreen;
