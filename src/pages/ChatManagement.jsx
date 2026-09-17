// src/pages/ChatManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Chip,
  Stack, InputAdornment, CircularProgress, Avatar, List, ListItem,
  ListItemAvatar, ListItemText, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, Select, FormControl,
  InputLabel, Pagination, Badge, Tooltip, Skeleton, Divider, alpha,
} from '@mui/material';
import {
  Send, Search, Refresh, Person, CameraAlt, PersonPin, Add,
  DoneAll, Delete, Phone, Email, MoreVert, Image as ImageIcon,
  AttachFile, Mic, EmojiEmotions, Close, Verified,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import PanelHeader from '../components/PanelHeader';
import apiClient from '../api/axios';
import { COLORS, FONT_DISPLAY } from '../theme/dashboardTheme';

// ---------- Color Palette ----------
const PALETTE = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  bg: '#F0F4FF',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#1E293B',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  online: '#10B981',
  offline: '#CBD5E1',
  guider: '#8B5CF6',
  photographer: '#EC4899',
  user: '#3B82F6',
  admin: '#F59E0B',
  messageBg: '#F1F5F9',
  inputBg: '#F8FAFC',
};

// ✅ Helper: get logged-in admin's own user id.
// Adjust this if your app stores the admin user differently
// (e.g. from a Redux store or AuthContext instead of localStorage).
const getCurrentUserId = () => {
  try {
    const raw =
      localStorage.getItem('user') ||
      localStorage.getItem('adminUser') ||
      localStorage.getItem('authUser');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id || parsed?.userId || null;
  } catch {
    return null;
  }
};

// ---------- Role Badge ----------
const RoleBadge = ({ role, size = 'small' }) => {
  const styles = {
    GUIDER: { bg: alpha(PALETTE.guider, 0.1), color: PALETTE.guider, label: 'Guider' },
    PHOTOGRAPHER: { bg: alpha(PALETTE.photographer, 0.1), color: PALETTE.photographer, label: 'Photographer' },
    USER: { bg: alpha(PALETTE.user, 0.1), color: PALETTE.user, label: 'User' },
    ADMIN: { bg: alpha(PALETTE.admin, 0.1), color: PALETTE.admin, label: 'Admin' },
  };
  const style = styles[role] || styles.USER;
  return (
    <Chip
      label={style.label}
      size={size}
      sx={{
        bgcolor: style.bg,
        color: style.color,
        fontWeight: 700,
        fontSize: size === 'small' ? '0.65rem' : '0.7rem',
        height: size === 'small' ? 20 : 24,
        borderRadius: '6px',
        letterSpacing: '0.02em',
      }}
    />
  );
};

// ---------- Online Indicator ----------
const OnlineIndicator = ({ online }) => (
  <Tooltip title={online ? 'Online' : 'Offline'}>
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: online ? PALETTE.online : PALETTE.offline,
        display: 'inline-block',
        ml: 0.5,
        boxShadow: online ? `0 0 0 2px ${alpha(PALETTE.online, 0.2)}` : 'none',
      }}
    />
  </Tooltip>
);

// ---------- Avatar with initials ----------
const UserAvatar = ({ user, size = 40 }) => {
  const role = user?.role || 'USER';
  const bgColors = {
    GUIDER: alpha(PALETTE.guider, 0.1),
    PHOTOGRAPHER: alpha(PALETTE.photographer, 0.1),
    USER: alpha(PALETTE.user, 0.1),
    ADMIN: alpha(PALETTE.admin, 0.1),
  };
  return (
    <Avatar
      src={user?.profileImage || user?.avatar}
      sx={{
        width: size,
        height: size,
        bgcolor: bgColors[role] || alpha(PALETTE.user, 0.1),
        color: role === 'GUIDER' ? PALETTE.guider : role === 'PHOTOGRAPHER' ? PALETTE.photographer : role === 'ADMIN' ? PALETTE.admin : PALETTE.user,
        fontWeight: 800,
        fontSize: size * 0.38,
        border: `2px solid ${role === 'GUIDER' ? alpha(PALETTE.guider, 0.3) : role === 'PHOTOGRAPHER' ? alpha(PALETTE.photographer, 0.3) : alpha(PALETTE.user, 0.3)}`,
      }}
    >
      {(user?.firstName || 'U').charAt(0).toUpperCase()}
    </Avatar>
  );
};

// ---------- Search Users Dialog (Fixed Role Label) ----------
const SearchUsersDialog = ({ open, onClose, onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const searchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: searchTerm,
        role: roleFilter === 'ALL' ? undefined : roleFilter,
      };
      const res = await apiClient.get('/admin/users', { params });
      const data = res.data.data;
      const users = Array.isArray(data) ? data : (data?.rows || data?.items || []);
      setSearchResults(users);
      setTotal(data?.total || data?.count || users.length || 0);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, page]);

  useEffect(() => {
    if (open) searchUsers();
  }, [open, searchUsers]);

  const handleClose = () => {
    setSearchTerm('');
    setRoleFilter('ALL');
    setPage(1);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: '1.1rem' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Search sx={{ color: PALETTE.primary }} />
          <span>Find People</span>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pb: 0 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: '#F8FAFC',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: PALETTE.primary,
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: PALETTE.textFaint, fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />
          {/* ✅ FIX: Role Select – Label ab cut nahi hoga */}
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel shrink>Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="Role"
              notched
              sx={{ borderRadius: '12px', bgcolor: '#F8FAFC' }}
            >
              <MenuItem value="ALL">All Roles</MenuItem>
              <MenuItem value="USER">Users</MenuItem>
              <MenuItem value="GUIDER">Guiders</MenuItem>
              <MenuItem value="PHOTOGRAPHER">Photographers</MenuItem>
              <MenuItem value="ADMIN">Admins</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: PALETTE.primary }} />
          </Box>
        ) : (
          <List sx={{ maxHeight: 380, overflowY: 'auto' }}>
            {searchResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography color="textSecondary">No users found</Typography>
              </Box>
            ) : (
              searchResults.map((user) => (
                <ListItem
                  key={user.id}
                  button
                  onClick={() => onSelectUser(user)}
                  sx={{
                    borderRadius: '12px',
                    mb: 0.5,
                    px: 2,
                    py: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: alpha(PALETTE.primary, 0.04),
                      transform: 'translateX(2px)',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <UserAvatar user={user} size={44} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" fontWeight={700}>
                          {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown'}
                        </Typography>
                        <RoleBadge role={user.role} />
                        <OnlineIndicator online={user.isOnline} />
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" spacing={0.5} alignItems="center" mt={0.3}>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <Email sx={{ fontSize: 12 }} /> {user.email || 'No email'}
                        </Typography>
                        {user.phone && (
                          <>
                            <Divider orientation="vertical" flexItem sx={{ height: 12, alignSelf: 'center' }} />
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                              <Phone sx={{ fontSize: 12 }} /> {user.phone}
                            </Typography>
                          </>
                        )}
                      </Stack>
                    }
                  />
                  <IconButton size="small" sx={{ color: PALETTE.primary }}>
                    <Add fontSize="small" />
                  </IconButton>
                </ListItem>
              ))
            )}
          </List>
        )}

        {total > limit && (
          <Stack alignItems="center" sx={{ py: 1.5 }}>
            <Pagination count={Math.ceil(total / limit)} page={page} onChange={(e, p) => setPage(p)} color="primary" size="small" />
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} sx={{ color: PALETTE.textMuted }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ---------- Main Chat Management Component ----------
const ChatManagement = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const limit = 20;
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);
  const [showMore, setShowMore] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachments, setAttachments] = useState([]);

  // ✅ refs so the socket listener always sees the latest selected conversation
  const socketRef = useRef(null);
  const selectedConversationRef = useRef(null);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/chat/conversations');
      const data = res.data.data;
      const convs = Array.isArray(data) ? data : [];
      setConversations(convs);
      const counts = {};
      convs.forEach((c) => { counts[c.id] = c.unreadCount || 0; });
      setUnreadCounts(counts);
      setTotal(data?.total || convs.length);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // ✅ FIX: Use socket.io-client instead of raw WebSocket — backend runs
  // Socket.IO, and a plain `new WebSocket(...)` cannot talk to it (different
  // handshake protocol), so real-time events never actually arrived here.
  useEffect(() => {
    const adminId = getCurrentUserId();
    if (!adminId) {
      console.warn('⚠️ Could not determine current admin user id — real-time chat updates will not work. Check getCurrentUserId().');
      return;
    }

    const SOCKET_URL = apiClient.defaults.baseURL.replace('/api/v1', '');
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Admin socket connected:', socket.id);
      socket.emit('register', adminId);
    });

    socket.on('chat:new-message', (data) => {
      const message = data?.message || data;
      const conversationId = data?.conversationId || message?.conversationId;
      if (!message) return;

      const currentConv = selectedConversationRef.current;
      if (currentConv && String(conversationId) === String(currentConv.id)) {
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message]
        );
        setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));
      } else if (conversationId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }));
      }

      // Keep conversation list preview + ordering fresh
      fetchConversations();
    });

    socket.on('connect_error', (err) => {
      console.log('❌ Admin socket connect_error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchConversations]);

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setLoadingMessages(true);
    try {
      const res = await apiClient.get(`/chat/conversations/${conversation.id}/messages`);
      const data = res.data.data;
      setMessages(data.messages || []);
      setUnreadCounts((prev) => ({ ...prev, [conversation.id]: 0 }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const otherParticipantId = selectedConversation.otherParticipant?.id;
    if (!otherParticipantId) {
      toast.error('User ID not found');
      return;
    }

    const content = newMessage.trim();
    setNewMessage('');

    try {
      const res = await apiClient.post('/chat/send', {
        receiverId: otherParticipantId,
        content,
      });
      // ✅ Backend may return { message, conversationId } or the message directly — handle both
      const payload = res.data.data;
      const newMsg = payload?.message || payload;

      setMessages((prev) =>
        prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]
      );
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? { ...conv, lastMessage: newMsg.content, lastMessageAt: new Date().toISOString() }
            : conv
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
      setNewMessage(content); // restore on failure
    }
  };

  const handleStartConversation = async (user) => {
    try {
      const res = await apiClient.post('/chat/conversations/start', { otherUserId: user.id });
      const conversation = res.data.data;
      setSearchDialogOpen(false);
      await fetchConversations();
      await handleSelectConversation(conversation);
      toast.success(`Chat started with ${user.firstName || 'User'}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start chat');
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const filteredConversations = conversations.filter((conv) => {
    const name = conv.otherParticipant?.name?.toLowerCase() || '';
    const role = conv.otherParticipant?.role?.toLowerCase() || '';
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || conv.otherParticipant?.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  const isMyMessage = (message) => message.senderId !== selectedConversation?.otherParticipant?.id;

  return (
    // ✅ FIX: fixed viewport height on the outer box so nothing pushes the
    // whole page taller — everything below scrolls inside its own panel.
    <Box sx={{
      bgcolor: PALETTE.bg,
      p: { xs: 2, md: 3 },
      height: '100vh',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      background: `linear-gradient(135deg, ${alpha(PALETTE.primary, 0.03)} 0%, ${PALETTE.bg} 40%, ${alpha(PALETTE.user, 0.03)} 100%)`,
    }}>
      <PanelHeader eyebrow="Support Center" title="💬 Chat Management" />

      <Grid container spacing={2.5} sx={{ flex: 1, minHeight: 0, mt: 0.5 }}>
        {/* ===== LEFT: Conversations List ===== */}
        <Grid item xs={12} md={4} lg={3.5} sx={{ height: '100%', minHeight: 0 }}>
          <Paper elevation={0} sx={{
            height: '100%',
            borderRadius: '20px',
            border: `1px solid ${PALETTE.border}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: PALETTE.surface,
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}>
            {/* Header */}
            <Box sx={{ p: 2.5, borderBottom: `1px solid ${PALETTE.border}`, bgcolor: alpha(PALETTE.primary, 0.03), flexShrink: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                <Typography variant="h6" fontWeight={800} sx={{ fontFamily: FONT_DISPLAY, color: PALETTE.text }}>
                  💬 Chats
                  <Chip
                    label={filteredConversations.length}
                    size="small"
                    sx={{ ml: 1, bgcolor: alpha(PALETTE.primary, 0.1), color: PALETTE.primary, fontWeight: 700, height: 20, fontSize: '0.65rem' }}
                  />
                </Typography>
                <Tooltip title="Start New Chat">
                  <IconButton
                    size="small"
                    onClick={() => setSearchDialogOpen(true)}
                    sx={{
                      bgcolor: PALETTE.primary,
                      color: '#fff',
                      '&:hover': { bgcolor: PALETTE.primaryDark, transform: 'scale(1.05)' },
                      transition: 'all 0.2s ease',
                      width: 32,
                      height: 32,
                    }}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>

              <TextField
                fullWidth
                size="small"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  mt: 1.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    bgcolor: '#F8FAFC',
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: PALETTE.primary },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PALETTE.primary, borderWidth: 2 },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: PALETTE.textFaint, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* ✅ FIX: Role Filter Select – Label cut nahi hoga */}
              <FormControl fullWidth size="small" sx={{ mt: 1.5 }}>
                <InputLabel shrink>Filter by Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Filter by Role"
                  notched
                  sx={{ borderRadius: '12px', bgcolor: '#F8FAFC' }}
                >
                  <MenuItem value="ALL">All Roles</MenuItem>
                  <MenuItem value="USER">Users</MenuItem>
                  <MenuItem value="GUIDER">Guiders</MenuItem>
                  <MenuItem value="PHOTOGRAPHER">Photographers</MenuItem>
                  <MenuItem value="ADMIN">Admins</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Conversation List — ✅ FIX: minHeight:0 so this scrolls
                inside the fixed-height panel instead of growing the page */}
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', bgcolor: PALETTE.surface, p: 1 }}>
              {loading ? (
                <Box sx={{ p: 1 }}>
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={64} sx={{ mb: 1, borderRadius: '12px' }} />
                  ))}
                </Box>
              ) : filteredConversations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                  <Typography color={PALETTE.textMuted} sx={{ mb: 1 }}>No conversations yet</Typography>
                  <Button variant="outlined" size="small" onClick={() => setSearchDialogOpen(true)}>
                    Start New Chat
                  </Button>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {filteredConversations.map((conversation) => {
                    const isSelected = selectedConversation?.id === conversation.id;
                    const hasUnread = unreadCounts[conversation.id] > 0;
                    return (
                      <ListItem
                        key={conversation.id}
                        button
                        selected={isSelected}
                        onClick={() => handleSelectConversation(conversation)}
                        sx={{
                          borderRadius: '14px',
                          mb: 0.5,
                          px: 1.5,
                          py: 1.2,
                          transition: 'all 0.2s ease',
                          '&.Mui-selected': {
                            bgcolor: alpha(PALETTE.primary, 0.08),
                            boxShadow: `inset 0 0 0 2px ${alpha(PALETTE.primary, 0.15)}`,
                            '&:hover': { bgcolor: alpha(PALETTE.primary, 0.12) },
                          },
                          '&:hover': { bgcolor: alpha(PALETTE.primary, 0.03) },
                        }}
                      >
                        <ListItemAvatar>
                          <Box sx={{ position: 'relative' }}>
                            <UserAvatar user={conversation.otherParticipant} size={46} />
                            {hasUnread && (
                              <Badge
                                badgeContent={unreadCounts[conversation.id]}
                                color="error"
                                max={99}
                                sx={{
                                  '& .MuiBadge-badge': {
                                    fontSize: '0.6rem',
                                    height: 18,
                                    minWidth: 18,
                                    bgcolor: PALETTE.error,
                                    fontWeight: 700,
                                  },
                                }}
                              >
                                <Box sx={{ width: 0, height: 0 }} />
                              </Badge>
                            )}
                          </Box>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.3 }}>
                              <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 140, color: PALETTE.text }}>
                                {conversation.otherParticipant?.name || 'Unknown'}
                              </Typography>
                              <RoleBadge role={conversation.otherParticipant?.role} />
                              <OnlineIndicator online={conversation.otherParticipant?.isOnline} />
                            </Stack>
                          }
                          secondary={
                            <Typography
                              variant="caption"
                              color={hasUnread ? PALETTE.text : PALETTE.textFaint}
                              noWrap
                              sx={{ fontWeight: hasUnread ? 600 : 400, display: 'block', maxWidth: 150 }}
                            >
                              {conversation.lastMessage || 'No messages yet'}
                            </Typography>
                          }
                        />
                        <Stack direction="column" alignItems="flex-end" spacing={0.5}>
                          <Typography variant="caption" sx={{ color: hasUnread ? PALETTE.primary : PALETTE.textFaint, fontWeight: hasUnread ? 700 : 400, fontSize: '0.65rem' }}>
                            {formatTime(conversation.lastMessageAt)}
                          </Typography>
                        </Stack>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>

            {/* Pagination */}
            {total > limit && (
              <Box sx={{ p: 1.5, borderTop: `1px solid ${PALETTE.border}`, flexShrink: 0 }}>
                <Pagination
                  count={Math.ceil(total / limit)}
                  page={page}
                  onChange={(e, p) => setPage(p)}
                  size="small"
                  color="primary"
                  sx={{ display: 'flex', justifyContent: 'center' }}
                />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* ===== RIGHT: Chat Window ===== */}
        <Grid item xs={12} md={8} lg={8.5} sx={{ height: '100%', minHeight: 0 }}>
          <Paper elevation={0} sx={{
            height: '100%',
            borderRadius: '20px',
            border: `1px solid ${PALETTE.border}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: PALETTE.surface,
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <Box sx={{
                  p: 2,
                  borderBottom: `1px solid ${PALETTE.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: alpha(PALETTE.primary, 0.03),
                  flexShrink: 0,
                }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <UserAvatar user={selectedConversation.otherParticipant} size={44} />
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: PALETTE.text }}>
                          {selectedConversation.otherParticipant?.name || 'Unknown'}
                        </Typography>
                        <RoleBadge role={selectedConversation.otherParticipant?.role} />
                        <OnlineIndicator online={selectedConversation.otherParticipant?.isOnline} />
                      </Stack>
                      <Typography variant="caption" color={PALETTE.textMuted} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone sx={{ fontSize: 12 }} /> {selectedConversation.otherParticipant?.phone || 'No phone'} •
                        <Email sx={{ fontSize: 12 }} /> {selectedConversation.otherParticipant?.email || 'No email'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Refresh">
                      <IconButton size="small" onClick={fetchConversations} sx={{ color: PALETTE.textMuted, '&:hover': { color: PALETTE.primary } }}>
                        <Refresh fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Conversation">
                      <IconButton size="small" color="error" onClick={() => {
                        if (window.confirm('Delete this conversation?')) {
                          apiClient.delete(`/chat/conversations/${selectedConversation.id}`)
                            .then(() => {
                              toast.success('Conversation deleted');
                              setSelectedConversation(null);
                              fetchConversations();
                            })
                            .catch(() => toast.error('Failed to delete conversation'));
                        }
                      }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>

                {/* Messages Area — ✅ FIX: minHeight:0 is what actually
                    makes overflowY:auto scroll correctly inside a flex column */}
                <Box sx={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  p: 2,
                  bgcolor: '#F8FAFC',
                  backgroundImage: `radial-gradient(circle at 10% 10%, ${alpha(PALETTE.primary, 0.03)} 0%, transparent 50%), radial-gradient(circle at 90% 90%, ${alpha(PALETTE.user, 0.03)} 0%, transparent 50%)`,
                  // nicer scrollbar
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(PALETTE.primary, 0.2), borderRadius: 3 },
                }}>
                  {loadingMessages ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress size={32} sx={{ color: PALETTE.primary }} />
                    </Box>
                  ) : messages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Avatar sx={{ width: 64, height: 64, bgcolor: alpha(PALETTE.primary, 0.1), color: PALETTE.primary, mx: 'auto', mb: 1 }}>
                        <Send />
                      </Avatar>
                      <Typography color={PALETTE.textMuted} fontWeight={600}>
                        No messages yet
                      </Typography>
                      <Typography variant="caption" color={PALETTE.textFaint}>
                        Say hello to {selectedConversation.otherParticipant?.name}!
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      {showMore && (
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <Button size="small" onClick={() => setShowMore(false)} sx={{ color: PALETTE.primary }}>
                            Show Older Messages
                          </Button>
                        </Box>
                      )}
                      {messages.map((message) => {
                        const isMe = isMyMessage(message);
                        return (
                          <Box
                            key={message.id}
                            sx={{
                              display: 'flex',
                              justifyContent: isMe ? 'flex-end' : 'flex-start',
                              mb: 1.5,
                            }}
                          >
                            <Box sx={{
                              maxWidth: '75%',
                              bgcolor: isMe ? alpha(PALETTE.primary, 0.9) : PALETTE.surface,
                              color: isMe ? '#FFFFFF' : PALETTE.text,
                              p: 1.5,
                              borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              border: isMe ? 'none' : `1px solid ${PALETTE.border}`,
                              boxShadow: isMe ? `0 4px 12px ${alpha(PALETTE.primary, 0.2)}` : '0 2px 8px rgba(0,0,0,0.04)',
                              wordBreak: 'break-word',
                            }}>
                              <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                                {message.content}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'flex-end',
                                  gap: 0.3,
                                  color: isMe ? 'rgba(255,255,255,0.7)' : PALETTE.textFaint,
                                  mt: 0.5,
                                }}
                              >
                                {formatTime(message.createdAt)}
                                {isMe && <DoneAll sx={{ fontSize: 13 }} />}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </Box>

                {/* Input Area – Premium */}
                <Box sx={{
                  p: 1.5,
                  borderTop: `1px solid ${PALETTE.border}`,
                  bgcolor: PALETTE.surface,
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 1,
                  flexShrink: 0,
                }}>
                  {/* Emoji Button */}
                  <Tooltip title="Emoji">
                    <IconButton size="small" sx={{ color: PALETTE.textMuted, '&:hover': { color: PALETTE.warning } }}>
                      <EmojiEmotions fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {/* Attach File */}
                  <Tooltip title="Attach File">
                    <IconButton size="small" sx={{ color: PALETTE.textMuted, '&:hover': { color: PALETTE.primary } }}>
                      <AttachFile fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {/* Text Input */}
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      multiline
                      maxRows={4}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '20px',
                          bgcolor: '#F8FAFC',
                          px: 2,
                          py: 0.5,
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: PALETTE.primary },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PALETTE.primary, borderWidth: 2 },
                          '& .MuiOutlinedInput-notchedOutline': { borderRadius: '20px' },
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '0.875rem',
                          py: 1,
                          lineHeight: 1.4,
                        },
                      }}
                    />
                  </Box>
                  {/* Send Button */}
                  <Tooltip title={newMessage.trim() ? 'Send Message' : 'Type a message'}>
                    <IconButton
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: newMessage.trim() ? PALETTE.primary : alpha(PALETTE.primary, 0.3),
                        color: '#fff',
                        '&:hover': { bgcolor: PALETTE.primaryDark, transform: 'scale(1.05)' },
                        '&:disabled': { bgcolor: alpha(PALETTE.primary, 0.3) },
                        transition: 'all 0.2s ease',
                        borderRadius: '50%',
                        boxShadow: newMessage.trim() ? `0 4px 12px ${alpha(PALETTE.primary, 0.3)}` : 'none',
                      }}
                    >
                      <Send fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            ) : (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                p: 4,
              }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: alpha(PALETTE.primary, 0.1), color: PALETTE.primary, mb: 2 }}>
                  <Send />
                </Avatar>
                <Typography variant="h6" color={PALETTE.textMuted} fontWeight={700}>
                  Select a conversation
                </Typography>
                <Typography variant="body2" color={PALETTE.textFaint} sx={{ mb: 3, textAlign: 'center', maxWidth: 300 }}>
                  Choose a chat from the left to view messages and reply.
                </Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => setSearchDialogOpen(true)} sx={{
                  bgcolor: PALETTE.primary,
                  '&:hover': { bgcolor: PALETTE.primaryDark },
                  borderRadius: '12px',
                  px: 3,
                  py: 1,
                  boxShadow: `0 4px 12px ${alpha(PALETTE.primary, 0.3)}`,
                }}>
                  Start New Chat
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Search Users Dialog */}
      <SearchUsersDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onSelectUser={handleStartConversation}
      />
    </Box>
  );
};

export default ChatManagement;