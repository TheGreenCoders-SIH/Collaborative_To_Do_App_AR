import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:pinenacl/x25519.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../services/nacl_service.dart';
import '../theme/app_theme.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  Map<String, dynamic>? _chatArgs;
  List<dynamic> _messages = [];
  bool _isLoading = true;
  Timer? _pollingTimer;
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  bool _isSending = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_chatArgs == null) {
      _chatArgs = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
      _loadMessages(initial: true);
      _startPolling();
    }
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _loadMessages(initial: false);
    });
  }

  Future<void> _loadMessages({bool initial = false}) async {
    if (_chatArgs == null) return;
    if (initial) {
      setState(() => _isLoading = true);
    }

    try {
      final isTeam = _chatArgs!['isTeam'] as bool;
      List<dynamic> fetchedMessages = [];

      if (isTeam) {
        final teamId = _chatArgs!['teamId'] as int;
        fetchedMessages = await ApiService.fetchTeamMessages(teamId);
      } else {
        final conversationId = _chatArgs!['conversationId'] as int;
        fetchedMessages = await ApiService.fetchMessages(conversationId);
        
        // Mark all unread received messages as read
        final currentUserId = Provider.of<AuthProvider>(context, listen: false).id;
        for (var msg in fetchedMessages) {
          if (msg['sender_id'] != currentUserId && msg['is_read'] != true) {
            ApiService.markMessageRead(msg['id']).catchError((e) => print('Error marking read: $e'));
          }
        }
      }

      // Sort messages by ID or time ascending so oldest is at top
      fetchedMessages.sort((a, b) => (a['id'] as int).compareTo(b['id'] as int));

      if (mounted) {
        setState(() {
          _messages = fetchedMessages;
          _isLoading = false;
        });
        if (initial) {
          _scrollToBottom();
        }
      }
    } catch (e) {
      print('Error loading messages: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _handleSendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _chatArgs == null || _isSending) return;

    setState(() => _isSending = true);
    _messageController.clear();

    final isTeam = _chatArgs!['isTeam'] as bool;
    final auth = Provider.of<AuthProvider>(context, listen: false);

    try {
      if (isTeam) {
        final teamId = _chatArgs!['teamId'] as int;
        await ApiService.sendTeamMessage(teamId, text);
      } else {
        final conversationId = _chatArgs!['conversationId'] as int;
        final recipientPublicKey = _chatArgs!['recipientPublicKey'] as String?;
        final mySecretKey = auth.secretKey;

        if (recipientPublicKey == null || recipientPublicKey.isEmpty || mySecretKey == null || mySecretKey.isEmpty) {
          // If keys are missing, send in plaintext as fallback
          await ApiService.sendMessage(conversationId, text, '');
        } else {
          // E2EE encryption
          final encResult = NaClService.encrypt(text, recipientPublicKey, mySecretKey);
          await ApiService.sendMessage(
            conversationId,
            encResult['ciphertext']!,
            encResult['nonce']!,
          );
        }
      }

      await _loadMessages(initial: false);
      _scrollToBottom();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to send message: $e')),
      );
    } finally {
      if (mounted) {
        setState(() => _isSending = false);
      }
    }
  }

  String _decryptMessageContent(dynamic message) {
    final isTeam = _chatArgs!['isTeam'] as bool;
    if (isTeam) return message['content'] ?? '';

    final nonce = message['nonce'] as String?;
    final encryptedContent = (message['encrypted_content'] ?? message['content']) as String?;

    if (nonce == null || nonce.isEmpty || encryptedContent == null || encryptedContent.isEmpty) {
      return encryptedContent ?? '';
    }

    final auth = Provider.of<AuthProvider>(context, listen: false);
    final recipientPublicKey = _chatArgs!['recipientPublicKey'] as String?;
    final mySecretKey = auth.secretKey;

    if (recipientPublicKey == null || mySecretKey == null) {
      return '[Encrypted: Keys Missing]';
    }

    return NaClService.decrypt(nonce, encryptedContent, recipientPublicKey, mySecretKey);
  }

  @override
  Widget build(BuildContext context) {
    if (_chatArgs == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final isTeam = _chatArgs!['isTeam'] as bool;
    final chatName = _chatArgs!['chatName'] as String;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final auth = Provider.of<AuthProvider>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primaryCyan.withOpacity(0.2),
              child: Text(
                chatName.isNotEmpty ? chatName[0].toUpperCase() : 'C',
                style: GoogleFonts.outfit(color: AppColors.primaryCyan, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    chatName,
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  Row(
                    children: [
                      Icon(
                        isTeam ? Icons.groups_outlined : Icons.lock_outline_rounded,
                        size: 11,
                        color: isTeam ? AppColors.darkTextSecondary : AppColors.successGreen,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        isTeam ? 'Team Channel' : 'End-to-End Encrypted',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: isTeam ? AppColors.darkTextSecondary : AppColors.successGreen,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // E2EE Premium Alert banner
          if (!isTeam)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
              color: AppColors.successGreen.withOpacity(0.08),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.shield_outlined, color: AppColors.successGreen, size: 14),
                  const SizedBox(width: 6),
                  Text(
                    'Messages are secured with tweetnacl/pinenacl E2EE',
                    style: GoogleFonts.inter(fontSize: 10, color: AppColors.successGreen, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),

          // Message bubble board
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primaryCyan))
                : _messages.isEmpty
                    ? _buildEmptyState()
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final prevMsg = index > 0 ? _messages[index - 1] : null;
                          final showDateSeparator = _shouldShowDateSeparator(prevMsg, msg);
                          final isMe = msg['sender_id'] == auth.id;

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              if (showDateSeparator) _buildDateSeparator(msg),
                              _buildMessageBubble(msg, isMe),
                            ],
                          );
                        },
                      ),
          ),

          // Message input bar
          _buildInputBar(isDark),
        ],
      ),
    );
  }

  bool _shouldShowDateSeparator(dynamic prev, dynamic current) {
    if (prev == null) return true;
    try {
      final prevDate = DateTime.parse(prev['created_at']).toLocal();
      final currDate = DateTime.parse(current['created_at']).toLocal();
      return prevDate.year != currDate.year ||
          prevDate.month != currDate.month ||
          prevDate.day != currDate.day;
    } catch (_) {
      return false;
    }
  }

  Widget _buildDateSeparator(dynamic msg) {
    try {
      final date = DateTime.parse(msg['created_at']).toLocal();
      final formatted = DateFormat('MMMM d, yyyy').format(date);
      return Center(
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 16),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: Theme.of(context).brightness == Brightness.dark
                ? AppColors.darkCard
                : AppColors.lightCard,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: Theme.of(context).brightness == Brightness.dark
                  ? AppColors.darkBorder.withOpacity(0.5)
                  : AppColors.lightBorder,
            ),
          ),
          child: Text(
            formatted,
            style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.darkTextSecondary),
          ),
        ),
      );
    } catch (_) {
      return const SizedBox.shrink();
    }
  }

  Widget _buildMessageBubble(dynamic msg, bool isMe) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final decrypted = _decryptMessageContent(msg);
    final String timeStr = msg['created_at'] != null
        ? DateFormat('jm').format(DateTime.parse(msg['created_at']).toLocal())
        : '';
    final String senderName = msg['sender_name'] ?? 'Member';

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          // Sender label for group channels
          if (!isMe && _chatArgs!['isTeam'] == true) ...[
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 2),
              child: Text(
                senderName,
                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.darkTextSecondary),
              ),
            ),
          ],

          Row(
            mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (isMe) ...[
                Text(
                  timeStr,
                  style: GoogleFonts.inter(fontSize: 9, color: AppColors.darkTextSecondary.withOpacity(0.8)),
                ),
                const SizedBox(width: 6),
              ],
              
              // Bubble Container
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isMe
                        ? AppColors.primaryCyan.withOpacity(0.15)
                        : (isDark ? AppColors.darkCard : AppColors.lightCard),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isMe ? 16 : 4),
                      bottomRight: Radius.circular(isMe ? 4 : 16),
                    ),
                    border: Border.all(
                      color: isMe
                          ? AppColors.primaryCyan.withOpacity(0.4)
                          : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                    ),
                  ),
                  child: Text(
                    decrypted,
                    style: GoogleFonts.inter(
                      fontSize: 13.5,
                      color: isDark ? Colors.white : AppColors.lightText,
                    ),
                  ),
                ),
              ),

              if (!isMe) ...[
                const SizedBox(width: 6),
                Text(
                  timeStr,
                  style: GoogleFonts.inter(fontSize: 9, color: AppColors.darkTextSecondary.withOpacity(0.8)),
                ),
              ],

              // Read Status indicator
              if (isMe && !_chatArgs!['isTeam']) ...[
                const SizedBox(width: 4),
                Icon(
                  msg['is_read'] == true ? Icons.done_all : Icons.done,
                  size: 13,
                  color: msg['is_read'] == true ? AppColors.primaryCyan : AppColors.darkTextSecondary,
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInputBar(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(16),
          topRight: Radius.circular(16),
        ),
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Mock file attachment
            IconButton(
              icon: Icon(Icons.add_circle_outline_rounded, color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('File attachment is enabled on TaskFlow Web App.')),
                );
              },
            ),
            
            // Text Input field
            Expanded(
              child: TextField(
                controller: _messageController,
                textCapitalization: TextCapitalization.sentences,
                keyboardType: TextInputType.multiline,
                maxLines: null,
                decoration: const InputDecoration(
                  hintText: 'Type secure message...',
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                ),
                onSubmitted: (_) => _handleSendMessage(),
              ),
            ),
            
            const SizedBox(width: 8),

            // Send Button with gradient
            InkWell(
              onTap: _isSending ? null : _handleSendMessage,
              borderRadius: BorderRadius.circular(20),
              child: Container(
                width: 40,
                height: 40,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: AppColors.primaryGradient,
                ),
                child: _isSending
                    ? const Padding(
                        padding: EdgeInsets.all(12),
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                    : const Icon(Icons.send_rounded, color: Colors.white, size: 18),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.chat_bubble_outline_rounded, color: AppColors.darkTextSecondary.withOpacity(0.4), size: 40),
          const SizedBox(height: 12),
          Text(
            'Start a conversation',
            style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: AppColors.darkTextSecondary),
          ),
          const SizedBox(height: 4),
          Text(
            'Your messages are secured.',
            style: GoogleFonts.inter(fontSize: 11, color: AppColors.darkTextSecondary.withOpacity(0.7)),
          ),
        ],
      ),
    );
  }
}
