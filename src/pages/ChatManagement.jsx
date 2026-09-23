// src/pages/ChatManagement.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Chip,
  Stack, InputAdornment, CircularProgress, Avatar, List, ListItem,
  ListItemAvatar, ListItemText, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Select, FormControl,
  InputLabel, Pagination, Badge, Tooltip, Skeleton, Divider, alpha,
} from '@mui/material';
import {
  Send, Search, Refresh, Add, DoneAll, Delete, Phone, Email,
  EmojiEmotions, AttachFile,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import PanelHeader from '../components/PanelHeader';
import apiClient from '../api/axios';

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════
const T = {
  border: '#eef1f6',
  borderStrong: '#e2e8f0',
  surface: '#ffffff',
  surfaceSoft: '#fafbfc',
  textPrimary: '#0b1220',
  textMuted: '#64748b',
  textFaint: '#94a3b8',
  indigo: '#6366f1',
  indigoSoft: '#eef2ff',
  violet: '#8b5cf6',
  violetSoft: '#ede9fe',
  emerald: '#10b981',
  emeraldSoft: '#d1fae5',
  rose: '#f43f5e',
  roseSoft: '#ffe4e6',
  amber: '#f59e0b',
  amberSoft: '#fef3c7',
  sky: '#0ea5e9',
  skySoft: '#e0f2fe',
  radius: 3,
  fontDisplay: '"Inter", system-ui, -apple-system, sans-serif',
};

// ═══════════════════════════════════════════════════════════════
// ✅ FIX: Safe socket URL — handles trailing slash
// ═══════════════════════════════════════════════════════════════
const SOCKET_URL = (apiClient.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');

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

const ROLE_STYLES = {
  GUIDER: { bg: T.violetSoft, color: '#6d28d9', label: 'Guider' },
  PHOTOGRAPHER: { bg: T.roseSoft, color: '#be185d', label: 'Photographer' },
  USER: { bg: T.skySoft, color: '#0369a1', label: 'User' },
  ADMIN: { bg: T.amberSoft, color: '#b45309', label: 'Admin' },
};

const RoleBadge = ({ role }) => {
  const s = ROLE_STYLES[role] || ROLE_STYLES.USER;
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{
        bgcolor: s.bg,
        color: s.color,
        fontWeight: 700,
        fontSize: '0.62rem',
        height: 20,
        borderRadius: 999,
      }}
    />
  );
};

const OnlineIndicator = ({ online }) => (
  <Tooltip title={online ? 'Online' : 'Offline'}>
    <Box
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: online ? T.emerald : '#cbd5e1',
        display: 'inline-block',
        ml: 0.5,
        boxShadow: online ? `0 0 0 2px ${T.emerald}33` : 'none',
      }}
    />
  </Tooltip>
);

const UserAvatar = ({ user, size = 40 }) => {
  const role = user?.role || 'USER';
  const gradients = {
    GUIDER: `linear-gradient(135deg, ${T.violet}, #a78bfa)`,
    PHOTOGRAPHER: `linear-gradient(135deg, ${T.rose}, #f472b6)`,
    ADMIN: `linear-gradient(135deg, ${T.amber}, #fbbf24)`,
    USER: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
  };
  return (
    <Avatar
      src={user?.profileImage || user?.avatar}
      sx={{
        width: size,
        height: size,
        background: gradients[role] || gradients.USER,
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.4,
        border: '2px solid #fff',
        boxShadow: '0 2px 6px rgba(15,23,42,0.1)',
      }}
    >
      {(user?.firstName || 'U').charAt(0).toUpperCase()}
    </Avatar>
  );
};

// ═══════════════════════════════════════════════════════════════
// SEARCH USERS DIALOG
// ═══════════════════════════════════════════════════════════════
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
      const users = Array.isArray(data) ? data : data?.rows || data?.items || [];
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
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: T.radius } } }}
    >
      <DialogTitle
        sx={{
          fontFamily: T.fontDisplay,
          fontWeight: 700,
          fontSize: '1.05rem',
          color: T.textPrimary,
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: T.indigoSoft,
            color: T.indigo,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Search sx={{ fontSize: 18 }} />
        </Box>
        Find People
      </DialogTitle>
      <DialogContent sx={{ p: 3, borderColor: T.border }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: T.textFaint }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: T.surfaceSoft,
                '& fieldset': { borderColor: T.border },
                '&:hover fieldset': { borderColor: '#c7d2fe' },
                '&.Mui-focused fieldset': { borderColor: T.indigo, borderWidth: 1.5 },
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              label="Role"
              sx={{ borderRadius: 2, bgcolor: T.surfaceSoft }}
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
            <CircularProgress size={32} sx={{ color: T.indigo }} />
          </Box>
        ) : (
          <List sx={{ maxHeight: 380, overflowY: 'auto', p: 0 }}>
            {searchResults.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography sx={{ color: T.textFaint, fontSize: '0.85rem' }}>
                  No users found
                </Typography>
              </Box>
            ) : (
              searchResults.map((user) => (
                <ListItem
                  key={user.id}
                  button
                  onClick={() => onSelectUser(user)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    px: 2,
                    py: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: T.indigoSoft,
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
                        <Typography
                          sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.textPrimary }}
                        >
                          {`${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                            user.email ||
                            'Unknown'}
                        </Typography>
                        <RoleBadge role={user.role} />
                        <OnlineIndicator online={user.isOnline} />
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3 }}>
                        <Typography
                          sx={{
                            fontSize: '0.7rem',
                            color: T.textMuted,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.3,
                          }}
                        >
                          <Email sx={{ fontSize: 12 }} /> {user.email || 'No email'}
                        </Typography>
                        {user.phone && (
                          <>
                            <Divider
                              orientation="vertical"
                              flexItem
                              sx={{ height: 12, alignSelf: 'center', borderColor: T.border }}
                            />
                            <Typography
                              sx={{
                                fontSize: '0.7rem',
                                color: T.textMuted,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.3,
                              }}
                            >
                              <Phone sx={{ fontSize: 12 }} /> {user.phone}
                            </Typography>
                          </>
                        )}
                      </Stack>
                    }
                  />
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: T.indigoSoft,
                      color: T.indigo,
                      width: 32,
                      height: 32,
                    }}
                  >
                    <Add sx={{ fontSize: 16 }} />
                  </IconButton>
                </ListItem>
              ))
            )}
          </List>
        )}

        {total > limit && (
          <Stack alignItems="center" sx={{ py: 1.5 }}>
            <Pagination
              count={Math.ceil(total / limit)}
              page={page}
              onChange={(e, p) => setPage(p)}
              size="small"
              sx={{
                '& .MuiPaginationItem-root.Mui-selected': {
                  bgcolor: T.indigo,
                  color: '#fff',
                },
              }}
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: `1px solid ${T.border}` }}>
        <Button
          onClick={handleClose}
          sx={{ textTransform: 'none', fontWeight: 600, color: T.textMuted }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN CHAT MANAGEMENT
// ═══════════════════════════════════════════════════════════════
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
      convs.forEach((c) => {
        counts[c.id] = c.unreadCount || 0;
      });
      setUnreadCounts(counts);
      setTotal(data?.total || convs.length);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ═══════════════════════════════════════════════════════════════
  // ✅ FIX: Socket URL + chat:read (from P0-6)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const adminId = getCurrentUserId();
    if (!adminId) return;

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
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

        // ✅ FIX: Mark as read via canonical event name
        socket.emit('chat:read', {
          conversationId,
          userId: adminId,
        });
      } else if (conversationId) {
        setUnreadCounts((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] || 0) + 1,
        }));
      }
      fetchConversations();
    });

    // ✅ Listen for read receipts (other user read our messages)
    socket.on('chat:read', (data) => {
      console.log('✅ chat:read:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchConversations]);

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setLoadingMessages(true);
    try {
      const res = await apiClient.get(
        `/chat/conversations/${conversation.id}/messages`
      );
      const data = res.data.data;
      setMessages(data.messages || []);
      setUnreadCounts((prev) => ({ ...prev, [conversation.id]: 0 }));

      // ✅ FIX: Mark as read via canonical event name
      const adminId = getCurrentUserId();
      const socket = socketRef.current;
      if (socket && socket.connected && adminId) {
        socket.emit('chat:read', {
          conversationId: conversation.id,
          userId: adminId,
        });
      }
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
      const payload = res.data.data;
      const newMsg = payload?.message || payload;
      setMessages((prev) =>
        prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]
      );
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: newMsg.content,
                lastMessageAt: new Date().toISOString(),
              }
            : conv
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
      setNewMessage(content);
    }
  };

  const handleStartConversation = async (user) => {
    try {
      const res = await apiClient.post('/chat/conversations/start', {
        otherUserId: user.id,
      });
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
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === 'ALL' || conv.otherParticipant?.role === roleFilter;
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

  const isMyMessage = (message) =>
    message.senderId !== selectedConversation?.otherParticipant?.id;

  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        height: '100vh',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 1440,
        mx: 'auto',
      }}
    >
      <Box sx={{ mb: 3 }}>
        <PanelHeader eyebrow="Support Center" title="Chat Management" />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 1fr) 2fr' },
          gap: 2.5,
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* ============ LEFT: Conversation List ============ */}
        <Paper
          elevation={0}
          sx={{
            height: '100%',
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: T.surface,
          }}
        >
          <Box
            sx={{
              p: 2.5,
              borderBottom: `1px solid ${T.border}`,
              bgcolor: T.surfaceSoft,
              flexShrink: 0,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography
                  sx={{
                    fontFamily: T.fontDisplay,
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: T.textPrimary,
                  }}
                >
                  Chats
                </Typography>
                <Chip
                  label={filteredConversations.length}
                  size="small"
                  sx={{
                    bgcolor: T.indigoSoft,
                    color: T.indigo,
                    fontWeight: 700,
                    height: 20,
                    fontSize: '0.65rem',
                    borderRadius: 999,
                  }}
                />
              </Stack>
              <Tooltip title="Start new chat">
                <IconButton
                  size="small"
                  onClick={() => setSearchDialogOpen(true)}
                  sx={{
                    bgcolor: T.indigo,
                    color: '#fff',
                    '&:hover': { bgcolor: '#4f46e5' },
                    width: 32,
                    height: 32,
                  }}
                >
                  <Add sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Stack>

            <TextField
              fullWidth
              size="small"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: T.textFaint }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                mt: 1.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#fff',
                  '& fieldset': { borderColor: T.border },
                  '&:hover fieldset': { borderColor: '#c7d2fe' },
                  '&.Mui-focused fieldset': { borderColor: T.indigo, borderWidth: 1.5 },
                },
              }}
            />

            <FormControl fullWidth size="small" sx={{ mt: 1.5 }}>
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Filter by Role"
                sx={{ borderRadius: 2, bgcolor: '#fff' }}
              >
                <MenuItem value="ALL">All Roles</MenuItem>
                <MenuItem value="USER">Users</MenuItem>
                <MenuItem value="GUIDER">Guiders</MenuItem>
                <MenuItem value="PHOTOGRAPHER">Photographers</MenuItem>
                <MenuItem value="ADMIN">Admins</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 1 }}>
            {loading ? (
              <Box sx={{ p: 1 }}>
                {[...Array(6)].map((_, i) => (
                  <Skeleton
                    key={i}
                    variant="rectangular"
                    height={64}
                    sx={{ mb: 1, borderRadius: 2 }}
                  />
                ))}
              </Box>
            ) : filteredConversations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                <Typography sx={{ color: T.textFaint, fontSize: '0.82rem', mb: 1.5 }}>
                  No conversations yet
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSearchDialogOpen(true)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: T.border,
                    color: T.indigo,
                  }}
                >
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
                        borderRadius: 2,
                        mb: 0.5,
                        px: 1.5,
                        py: 1.2,
                        transition: 'all 0.2s ease',
                        '&.Mui-selected': {
                          bgcolor: T.indigoSoft,
                          boxShadow: `inset 0 0 0 1px ${T.indigo}33`,
                          '&:hover': { bgcolor: '#e0e7ff' },
                        },
                        '&:hover': { bgcolor: T.surfaceSoft },
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
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                '& .MuiBadge-badge': {
                                  fontSize: '0.6rem',
                                  height: 18,
                                  minWidth: 18,
                                  bgcolor: T.rose,
                                  fontWeight: 700,
                                  boxShadow: '0 0 0 2px #fff',
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
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                            sx={{ mb: 0.3 }}
                          >
                            <Typography
                              sx={{
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: T.textPrimary,
                                maxWidth: 140,
                              }}
                              noWrap
                            >
                              {conversation.otherParticipant?.name || 'Unknown'}
                            </Typography>
                            <RoleBadge role={conversation.otherParticipant?.role} />
                          </Stack>
                        }
                        secondary={
                          <Typography
                            sx={{
                              fontSize: '0.7rem',
                              color: hasUnread ? T.textPrimary : T.textFaint,
                              fontWeight: hasUnread ? 600 : 400,
                              maxWidth: 150,
                            }}
                            noWrap
                          >
                            {conversation.lastMessage || 'No messages yet'}
                          </Typography>
                        }
                      />
                      <Typography
                        sx={{
                          fontSize: '0.62rem',
                          color: hasUnread ? T.indigo : T.textFaint,
                          fontWeight: hasUnread ? 700 : 500,
                          flexShrink: 0,
                        }}
                      >
                        {formatTime(conversation.lastMessageAt)}
                      </Typography>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>

          {total > limit && (
            <Box sx={{ p: 1.5, borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
              <Pagination
                count={Math.ceil(total / limit)}
                page={page}
                onChange={(e, p) => setPage(p)}
                size="small"
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  '& .MuiPaginationItem-root.Mui-selected': {
                    bgcolor: T.indigo,
                    color: '#fff',
                  },
                }}
              />
            </Box>
          )}
        </Paper>

        {/* ============ RIGHT: Chat Window ============ */}
        <Paper
          elevation={0}
          sx={{
            height: '100%',
            borderRadius: T.radius,
            border: `1px solid ${T.border}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: T.surface,
          }}
        >
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: `1px solid ${T.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  bgcolor: T.surfaceSoft,
                  flexShrink: 0,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <UserAvatar user={selectedConversation.otherParticipant} size={44} />
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography
                        sx={{ fontSize: '0.9rem', fontWeight: 700, color: T.textPrimary }}
                      >
                        {selectedConversation.otherParticipant?.name || 'Unknown'}
                      </Typography>
                      <RoleBadge role={selectedConversation.otherParticipant?.role} />
                      <OnlineIndicator online={selectedConversation.otherParticipant?.isOnline} />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.3 }}>
                      <Typography
                        sx={{
                          fontSize: '0.68rem',
                          color: T.textFaint,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.3,
                        }}
                      >
                        <Phone sx={{ fontSize: 11 }} />
                        {selectedConversation.otherParticipant?.phone || 'No phone'}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '0.68rem',
                          color: T.textFaint,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.3,
                        }}
                      >
                        <Email sx={{ fontSize: 11 }} />
                        {selectedConversation.otherParticipant?.email || 'No email'}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Refresh">
                    <IconButton
                      size="small"
                      onClick={fetchConversations}
                      sx={{
                        bgcolor: T.surface,
                        border: `1px solid ${T.border}`,
                        color: T.textMuted,
                        width: 32,
                        height: 32,
                        '&:hover': { borderColor: '#c7d2fe', color: T.indigo },
                      }}
                    >
                      <Refresh sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete conversation">
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (window.confirm('Delete this conversation?')) {
                          apiClient
                            .delete(`/chat/conversations/${selectedConversation.id}`)
                            .then(() => {
                              toast.success('Conversation deleted');
                              setSelectedConversation(null);
                              fetchConversations();
                            })
                            .catch(() => toast.error('Failed to delete conversation'));
                        }
                      }}
                      sx={{
                        bgcolor: T.roseSoft,
                        color: T.rose,
                        width: 32,
                        height: 32,
                        '&:hover': { bgcolor: '#fecaca' },
                      }}
                    >
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              {/* Messages Area */}
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  p: 2,
                  bgcolor: '#fafbfc',
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: `${T.indigo}33`,
                    borderRadius: 3,
                  },
                }}
              >
                {loadingMessages ? (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                    }}
                  >
                    <CircularProgress size={32} sx={{ color: T.indigo }} />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Avatar
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: T.indigoSoft,
                        color: T.indigo,
                        mx: 'auto',
                        mb: 1,
                      }}
                    >
                      <Send />
                    </Avatar>
                    <Typography sx={{ color: T.textMuted, fontWeight: 600 }}>
                      No messages yet
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: T.textFaint }}>
                      Say hello to {selectedConversation.otherParticipant?.name}!
                    </Typography>
                  </Box>
                ) : (
                  <>
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
                          <Box
                            sx={{
                              maxWidth: '75%',
                              bgcolor: isMe ? T.indigo : T.surface,
                              color: isMe ? '#fff' : T.textPrimary,
                              p: 1.5,
                              borderRadius: isMe
                                ? '16px 16px 4px 16px'
                                : '16px 16px 16px 4px',
                              border: isMe ? 'none' : `1px solid ${T.border}`,
                              boxShadow: isMe
                                ? `0 4px 12px ${T.indigo}33`
                                : '0 2px 8px rgba(0,0,0,0.04)',
                              wordBreak: 'break-word',
                            }}
                          >
                            <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                              {message.content}
                            </Typography>
                            <Typography
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                gap: 0.3,
                                fontSize: '0.62rem',
                                color: isMe ? 'rgba(255,255,255,0.7)' : T.textFaint,
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

              {/* Input Area */}
              <Box
                sx={{
                  p: 1.5,
                  borderTop: `1px solid ${T.border}`,
                  bgcolor: T.surface,
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 1,
                  flexShrink: 0,
                }}
              >
                <Tooltip title="Emoji">
                  <IconButton
                    size="small"
                    sx={{
                      color: T.textMuted,
                      '&:hover': { color: T.amber },
                      width: 36,
                      height: 36,
                    }}
                  >
                    <EmojiEmotions sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Attach file">
                  <IconButton
                    size="small"
                    sx={{
                      color: T.textMuted,
                      '&:hover': { color: T.indigo },
                      width: 36,
                      height: 36,
                    }}
                  >
                    <AttachFile sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' &&
                      !e.shiftKey &&
                      (e.preventDefault(), handleSendMessage())
                    }
                    multiline
                    maxRows={4}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 999,
                        bgcolor: T.surfaceSoft,
                        px: 2,
                        py: 0.5,
                        '& fieldset': { borderColor: T.border },
                        '&:hover fieldset': { borderColor: '#c7d2fe' },
                        '&.Mui-focused fieldset': {
                          borderColor: T.indigo,
                          borderWidth: 1.5,
                        },
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '0.85rem',
                        py: 1,
                        lineHeight: 1.4,
                      },
                    }}
                  />
                </Box>
                <Tooltip title={newMessage.trim() ? 'Send' : 'Type a message'}>
                  <span>
                    <IconButton
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: newMessage.trim() ? T.indigo : '#e2e8f0',
                        color: newMessage.trim() ? '#fff' : T.textFaint,
                        '&:hover': {
                          bgcolor: newMessage.trim() ? '#4f46e5' : '#e2e8f0',
                        },
                        '&:disabled': { bgcolor: '#e2e8f0', color: T.textFaint },
                        borderRadius: '50%',
                        boxShadow: newMessage.trim() ? `0 4px 12px ${T.indigo}33` : 'none',
                      }}
                    >
                      <Send sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                p: 4,
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: T.indigoSoft,
                  color: T.indigo,
                  mb: 2,
                }}
              >
                <Send sx={{ fontSize: 36 }} />
              </Avatar>
              <Typography
                sx={{ fontSize: '1rem', color: T.textMuted, fontWeight: 700 }}
              >
                Select a conversation
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.8rem',
                  color: T.textFaint,
                  mb: 3,
                  textAlign: 'center',
                  maxWidth: 300,
                }}
              >
                Choose a chat from the left to view messages and reply.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add sx={{ fontSize: 16 }} />}
                onClick={() => setSearchDialogOpen(true)}
                sx={{
                  bgcolor: T.indigo,
                  '&:hover': { bgcolor: '#4f46e5' },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  py: 1,
                  boxShadow: 'none',
                }}
              >
                Start New Chat
              </Button>
            </Box>
          )}
        </Paper>
      </Box>

      <SearchUsersDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onSelectUser={handleStartConversation}
      />
    </Box>
  );
};

export default ChatManagement;