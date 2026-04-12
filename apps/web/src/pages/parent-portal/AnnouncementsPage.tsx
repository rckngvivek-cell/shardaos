import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'general' | 'event' | 'assignment';
  date: string;
  author: string;
}

export const AnnouncementsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const announcements: Announcement[] = [
    {
      id: '1',
      title: 'Summer Vacation Announcement',
      content:
        'Summer vacation for all students will begin from May 1st, 2026. Classes will resume on June 15th, 2026.',
      category: 'general',
      date: '2026-04-14',
      author: 'Principal',
    },
    {
      id: '2',
      title: 'Annual Sports Day',
      content:
        'Annual sports day will be held on April 20, 2026. All students are required to participate in at least one event.',
      category: 'event',
      date: '2026-04-12',
      author: 'Sports Coordinator',
    },
    {
      id: '3',
      title: 'Math Project Submission',
      content: 'Project deadline for Mathematics (Project Topic: Real Numbers) is April 25th, 2026.',
      category: 'assignment',
      date: '2026-04-10',
      author: 'Math Department',
    },
    {
      id: '4',
      title: 'Parent-Teacher Meeting',
      content:
        'PTM will be held on April 22, 2026. Parents are requested to attend and discuss their ward\'s progress.',
      category: 'event',
      date: '2026-04-08',
      author: 'Administration',
    },
    {
      id: '5',
      title: 'Science Practical Exam',
      content: 'Science practical exams scheduled for April 18-20, 2026. Check your schedule on the portal.',
      category: 'assignment',
      date: '2026-04-06',
      author: 'Science Department',
    },
  ];

  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch = announcement.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || announcement.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'event':
        return <EventIcon />;
      case 'assignment':
        return <AssignmentIcon />;
      default:
        return <AnnouncementIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'event':
        return '#ff9800';
      case 'assignment':
        return '#2196f3';
      default:
        return '#4caf50';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Announcements
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Stay updated with school announcements, events, and assignments
        </Typography>
      </Box>

      {/* Search and Filter */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search announcements..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: 250 }}
        />
      </Box>

      {/* Category Filter */}
      <Box sx={{ mb: 4, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Chip
          label="All"
          onClick={() => setSelectedCategory('all')}
          variant={selectedCategory === 'all' ? 'filled' : 'outlined'}
          color={selectedCategory === 'all' ? 'primary' : 'default'}
        />
        <Chip
          label="General"
          onClick={() => setSelectedCategory('general')}
          variant={selectedCategory === 'general' ? 'filled' : 'outlined'}
          color={selectedCategory === 'general' ? 'primary' : 'default'}
        />
        <Chip
          label="Events"
          onClick={() => setSelectedCategory('event')}
          variant={selectedCategory === 'event' ? 'filled' : 'outlined'}
          color={selectedCategory === 'event' ? 'primary' : 'default'}
        />
        <Chip
          label="Assignments"
          onClick={() => setSelectedCategory('assignment')}
          variant={selectedCategory === 'assignment' ? 'filled' : 'outlined'}
          color={selectedCategory === 'assignment' ? 'primary' : 'default'}
        />
      </Box>

      {/* Announcements List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredAnnouncements.length > 0 ? (
          filteredAnnouncements.map((announcement) => (
            <Card
              key={announcement.id}
              sx={{
                borderLeft: `4px solid ${getCategoryColor(announcement.category)}`,
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: 3,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: getCategoryColor(announcement.category),
                      borderRadius: '50%',
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 48,
                      height: 48,
                      color: 'white',
                    }}
                  >
                    {getCategoryIcon(announcement.category)}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {announcement.title}
                      </Typography>
                      <Chip
                        label={announcement.category.toUpperCase()}
                        size="small"
                        sx={{ backgroundColor: getCategoryColor(announcement.category), color: 'white' }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {announcement.content}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="textSecondary">
                        {announcement.author} • {announcement.date}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="textSecondary">
              No announcements found
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
};

export default AnnouncementsPage;
