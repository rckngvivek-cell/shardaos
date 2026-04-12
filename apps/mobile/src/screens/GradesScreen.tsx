import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Text, Card, SegmentedButtons } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

interface GradesScreenProps {
  navigation: any;
}

interface Grade {
  subject: string;
  marks: number;
  total: number;
  grade: string;
  term: string;
}

const GradesScreen: React.FC<GradesScreenProps> = ({ navigation }) => {
  const [selectedTerm, setSelectedTerm] = useState('term1');
  const [sortBy, setSortBy] = useState('subject');

  const allGrades: Grade[] = [
    { subject: 'Mathematics', marks: 85, total: 100, grade: 'A', term: 'term1' },
    { subject: 'English', marks: 78, total: 100, grade: 'B+', term: 'term1' },
    { subject: 'Science', marks: 88, total: 100, grade: 'A', term: 'term1' },
    { subject: 'Social Studies', marks: 81, total: 100, grade: 'A-', term: 'term1' },
    { subject: 'Hindi', marks: 80, total: 100, grade: 'A-', term: 'term1' },
    { subject: 'Physical Education', marks: 92, total: 100, grade: 'A', term: 'term1' },
    { subject: 'Mathematics', marks: 88, total: 100, grade: 'A', term: 'term2' },
    { subject: 'English', marks: 82, total: 100, grade: 'A-', term: 'term2' },
    { subject: 'Science', marks: 90, total: 100, grade: 'A', term: 'term2' },
    { subject: 'Social Studies', marks: 85, total: 100, grade: 'A', term: 'term2' },
  ];

  const getFilteredGrades = () => {
    let filtered = allGrades.filter((g) => g.term === selectedTerm);
    if (sortBy === 'marks') {
      filtered.sort((a, b) => b.marks - a.marks);
    }
    return filtered;
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#4caf50';
    if (grade.startsWith('B')) return '#2196f3';
    if (grade.startsWith('C')) return '#ff9800';
    return '#f44336';
  };

  const grades = getFilteredGrades();
  const avgMarks = Math.round(
    grades.reduce((sum, g) => sum + g.marks, 0) / grades.length
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Grades</Text>
          <Text style={styles.avgMarks}>{avgMarks}%</Text>
        </View>

        {/* Average Card */}
        <Card style={styles.avgCard}>
          <Card.Content>
            <View style={styles.avgContent}>
              <View>
                <Text style={styles.avgLabel}>Average Score</Text>
                <Text style={styles.avgValue}>{avgMarks}%</Text>
              </View>
              <View style={styles.avgBar}>
                <View
                  style={[
                    styles.avgBarFill,
                    { width: `${avgMarks}%`, backgroundColor: getGradeColor('A') },
                  ]}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Filters */}
        <View style={styles.filterContainer}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Term</Text>
            <SegmentedButtons
              value={selectedTerm}
              onValueChange={setSelectedTerm}
              buttons={[
                { value: 'term1', label: 'Term 1' },
                { value: 'term2', label: 'Term 2' },
              ]}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <SegmentedButtons
              value={sortBy}
              onValueChange={setSortBy}
              buttons={[
                { value: 'subject', label: 'Subject' },
                { value: 'marks', label: 'Marks' },
              ]}
            />
          </View>
        </View>

        {/* Grades List */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>
            {selectedTerm === 'term1' ? 'Term 1 - Grades' : 'Term 2 - Grades'}
          </Text>

          {grades.map((grade, index) => (
            <Card key={index} style={styles.gradeCard}>
              <Card.Content>
                <View style={styles.gradeRow}>
                  <View style={styles.gradeInfo}>
                    <Text style={styles.subjectName}>{grade.subject}</Text>
                    <Text style={styles.marksText}>
                      {grade.marks}/{grade.total}
                    </Text>
                  </View>
                  <View style={styles.gradeRight}>
                    <View
                      style={[
                        styles.gradeCircle,
                        { backgroundColor: getGradeColor(grade.grade) },
                      ]}
                    >
                      <Text style={styles.gradeText}>{grade.grade}</Text>
                    </View>
                    <Text style={styles.percentText}>
                      {Math.round((grade.marks / grade.total) * 100)}%
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
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
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  avgMarks: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  avgCard: {
    marginHorizontal: 12,
    marginVertical: 12,
    elevation: 2,
  },
  avgContent: {
    gap: 12,
  },
  avgLabel: {
    fontSize: 12,
    color: '#666',
  },
  avgValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  avgBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  avgBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 16,
  },
  filterSection: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  gradeCard: {
    marginBottom: 8,
    elevation: 1,
  },
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  marksText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  gradeRight: {
    alignItems: 'center',
    marginLeft: 12,
  },
  gradeCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  gradeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  percentText: {
    fontSize: 12,
    color: '#666',
  },
});

export default GradesScreen;
