import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Card,
  CardContent,
  InputAdornment,
  Avatar,
  Divider,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';

interface Message {
  id: string;
  sender: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
  avatar: string;
  fullMessage?: string;
}

export const MessagesPage = () => {
  const [selectedMessageId, setSelectedMessageId] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');

  const messages: Message[] = [
    {
      id: '1',
      sender: 'Mrs. Sharma (Math Teacher)',
      subject: 'Great progress in Math!',
      preview: 'Rohan has shown excellent progress in the recent test...',
      date: '2026-04-14',
      read: true,
      avatar: 'MS',
      fullMessage:
        'Dear Mr. & Mrs. Sharma,\n\nRohan has shown excellent progress in the recent Mathematics test. His score of 85/100 demonstrates a strong understanding of the concepts. I would like to encourage him to continue this momentum.\n\nBest regards,\nMrs. Sharma',
    },
    {
      id: '2',
      sender: 'Mr. Verma (Science Teacher)',
      subject: 'Science Project Suggestions',
      preview: 'Here are some project ideas for the science fair...',
      date: '2026-04-12',
      read: true,
      avatar: 'MV',
      fullMessage:
        'Dear Parent,\n\nThe science fair is coming up on May 5th. I would like to suggest some project ideas:...',
    },
    {
      id: '3',
      sender: 'Principal\'s Office',
      subject: 'Annual Sports Day Participation',
      preview: 'Please confirm participation in sports day...',
      date: '2026-04-10',
      read: false,
      avatar: 'PO',
      fullMessage:
        'Dear Parents,\n\nThe annual sports day is scheduled for April 20th. Please confirm your ward\'s participation...',
    },
    {
      id: '4',
      sender: 'Ms. Gupta (English Teacher)',
      subject: 'Literature Assignment Feedback',
      preview: 'Well done on the literature assignment.',
      date: '2026-04-08',
      read: true,
      avatar: 'MG',
      fullMessage: 'Dear Parent,\n\nYour ward has submitted excellent work on the literature assignment...',
    },
  ];

  const selectedMessage = messages.find((m) => m.id === selectedMessageId);
  const filteredMessages = messages.filter((msg) =>
    msg.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageText.trim()) {
      console.log('Message sent:', messageText);
      setMessageText('');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Messages
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Communicate with teachers and school administration
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 3 }}>
        {/* Messages List */}
        <Paper sx={{ maxHeight: '600px', overflow: 'auto', md: { position: 'sticky', top: 20 } }}>
          {/* Search */}
          <Box sx={{ p: 2, borderBottom: '1px solid #eee' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Message Items */}
          <List sx={{ p: 0 }}>
            {filteredMessages.map((message) => (
              <ListItemButton
                key={message.id}
                selected={selectedMessageId === message.id}
                onClick={() => setSelectedMessageId(message.id)}
                sx={{
                  borderBottom: '1px solid #eee',
                  backgroundColor: !message.read ? '#f5f5f5' : 'white',
                }}
              >
                <Avatar sx={{ mr: 1.5, backgroundColor: '#1976d2' }}>
                  {message.avatar}
                </Avatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: message.read ? 400 : 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {message.sender}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'textSecondary',
                      }}
                    >
                      {message.preview}
                    </Typography>
                  }
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>

        {/* Message Content */}
        {selectedMessage && (
          <Card>
            <CardContent>
              {/* Message Header */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ backgroundColor: '#1976d2' }}>
                    {selectedMessage.avatar}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {selectedMessage.sender}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {selectedMessage.date}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedMessage.subject}
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Message Body */}
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  mb: 3,
                  color: '#555',
                  lineHeight: 1.6,
                }}
              >
                {selectedMessage.fullMessage || selectedMessage.preview}
              </Typography>

              {/* Reply Section */}
              <Divider sx={{ mb: 2 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Reply
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Type your message here..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button variant="text">Cancel</Button>
                  <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                  >
                    Send
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
};

export default MessagesPage;
