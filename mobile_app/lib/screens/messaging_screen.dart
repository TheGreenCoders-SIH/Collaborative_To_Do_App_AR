import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class MessagingScreen extends StatefulWidget {
  const MessagingScreen({super.key});

  @override
  State<MessagingScreen> createState() => _MessagingScreenState();
}

class _MessagingScreenState extends State<MessagingScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<dynamic> _teamChats = [];
  List<dynamic> _dmChats = [];
  List<dynamic> _friends = [];
  List<dynamic> _pendingRequests = [];
  bool _isLoading = true;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadConversationsData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadConversationsData() async {
    setState(() => _isLoading = true);
    try {
      final teams = await ApiService.fetchTeams();
      final conversations = await ApiService.fetchConversations();
      final friendsList = await ApiService.fetchFriends();
      final requests = await ApiService.fetchPendingFriends();

      setState(() {
        _teamChats = teams;
        _dmChats = conversations;
        _friends = friendsList;
        _pendingRequests = requests;
        _isLoading = false;
      });
    } catch (e) {
      print('Error fetching conversations: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _startDirectMessage(dynamic friend) async {
    try {
      final res = await ApiService.createConversation(friend['id']);
      if (mounted) {
        // Go directly to chat screen, passing conversation, isTeam=false, and direct friend data
        Navigator.pushNamed(
          context,
          '/chat',
          arguments: {
            'isTeam': false,
            'conversationId': res['conversation_id'] ?? res['id'],
            'chatName': friend['name'] ?? 'Direct Chat',
            'recipientPublicKey': friend['public_key'],
            'recipientId': friend['id'],
          },
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to start chat: $e')),
      );
    }
  }

  Future<void> _sendFriendRequestDialog() async {
    final emailController = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool submitting = false;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: Theme.of(context).cardColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Text('Add Friend', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              content: Form(
                key: formKey,
                child: TextFormField(
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: "Friend's Email or ID",
                    hintText: 'e.g. 5 or user@email.com',
                    prefixIcon: Icon(Icons.person_add_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) return 'Please enter an ID or email';
                    return null;
                  },
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('Cancel', style: TextStyle(color: Colors.grey[400])),
                ),
                Container(
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                    onPressed: submitting
                        ? null
                        : () async {
                            if (!formKey.currentState!.validate()) return;
                            setDialogState(() => submitting = true);
                            try {
                              // Try parsing email or ID. The API expects an addresseeId (int)
                              final int? addresseeId = int.tryParse(emailController.text);
                              if (addresseeId == null) {
                                // If it is an email, notify user that numeric ID is needed for demo, or mock
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Please enter friend\'s numeric user ID to search.')),
                                );
                                return;
                              }
                              await ApiService.sendFriendRequest(addresseeId);
                              if (mounted) {
                                Navigator.pop(context);
                                _loadConversationsData();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Friend request sent!')),
                                );
                              }
                            } catch (e) {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Failed to send request: $e')),
                                );
                              }
                            } finally {
                              setDialogState(() => submitting = false);
                            }
                          },
                    child: submitting
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text('Send', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Chats & Messaging',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadConversationsData,
          ),
          IconButton(
            icon: const Icon(Icons.person_add_rounded),
            tooltip: 'Add Friend',
            onPressed: _sendFriendRequestDialog,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primaryCyan,
          labelColor: AppColors.primaryCyan,
          unselectedLabelColor: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold),
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.groups_outlined, size: 18),
                  const SizedBox(width: 6),
                  const Text('Teams'),
                  if (_teamChats.isNotEmpty) ...[
                    const SizedBox(width: 4),
                    _buildBadgeCount(_teamChats.length),
                  ]
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.chat_bubble_outline_rounded, size: 16),
                  const SizedBox(width: 6),
                  const Text('DMs'),
                  if (_dmChats.isNotEmpty) ...[
                    const SizedBox(width: 4),
                    _buildBadgeCount(_dmChats.length),
                  ]
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.people_outline_rounded, size: 18),
                  const SizedBox(width: 6),
                  const Text('Friends'),
                  if (_pendingRequests.isNotEmpty) ...[
                    const SizedBox(width: 4),
                    _buildBadgeCount(_pendingRequests.length, color: AppColors.dangerRed),
                  ]
                ],
              ),
            ),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryCyan))
          : Column(
              children: [
                // Top Search Bar
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search chats, friends...',
                      prefixIcon: const Icon(Icons.search_rounded),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0),
                      fillColor: isDark ? AppColors.darkCard : AppColors.lightCard,
                    ),
                    onChanged: (val) {
                      // Filter locally if needed
                      setState(() {});
                    },
                  ),
                ),

                // Tab Content
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildTeamsTab(),
                      _buildDmsTab(),
                      _buildFriendsTab(),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildBadgeCount(int count, {Color color = AppColors.primaryCyan}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        '$count',
        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildTeamsTab() {
    final query = _searchController.text.toLowerCase();
    final filteredTeams = _teamChats.where((team) => (team['name'] ?? '').toLowerCase().contains(query)).toList();

    if (filteredTeams.isEmpty) {
      return _buildEmptyState(Icons.groups_outlined, 'No Team Channels', 'Create a team on the dashboard to access group messaging.');
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    return ListView.builder(
      itemCount: filteredTeams.length,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemBuilder: (context, index) {
        final team = filteredTeams[index];
        final name = team['name'] ?? 'Unnamed Team';
        final initials = name.split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join('').toUpperCase();

        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: isDark ? AppColors.darkBorder.withOpacity(0.5) : AppColors.lightBorder),
          ),
          color: isDark ? AppColors.darkCard : Colors.white,
          child: ListTile(
            leading: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.primaryGradient,
              ),
              child: Center(
                child: Text(
                  initials.isNotEmpty ? initials : 'T',
                  style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
            ),
            title: Text(
              name,
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              team['description'] ?? 'Team task channel',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(fontSize: 12),
            ),
            trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
            onTap: () {
              Navigator.pushNamed(
                context,
                '/chat',
                arguments: {
                  'isTeam': true,
                  'teamId': team['id'],
                  'chatName': name,
                },
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildDmsTab() {
    final query = _searchController.text.toLowerCase();
    final filteredDMs = _dmChats.where((dm) {
      final name = (dm['other_user_name'] ?? '').toLowerCase();
      return name.contains(query);
    }).toList();

    if (filteredDMs.isEmpty) {
      return _buildEmptyState(Icons.chat_bubble_outline_rounded, 'No Direct Messages', 'Add a friend and start a secure, E2E encrypted message.');
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ListView.builder(
      itemCount: filteredDMs.length,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemBuilder: (context, index) {
        final dm = filteredDMs[index];
        
        // Find other participant name directly from the backend flat columns
        final name = dm['other_user_name'] ?? 'Secure DM';
        final otherPublicKey = dm['other_user_public_key'] as String?;
        final otherId = dm['other_user_id'] as int?;
        final otherAvatar = dm['other_user_avatar'] as String?;
        
        final initials = name.split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join('').toUpperCase();

        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: BorderSide(color: isDark ? AppColors.darkBorder.withOpacity(0.5) : AppColors.lightBorder),
          ),
          color: isDark ? AppColors.darkCard : Colors.white,
          child: ListTile(
            leading: CircleAvatar(
              radius: 20,
              backgroundColor: AppColors.primaryCyan.withOpacity(0.2),
              backgroundImage: otherAvatar != null && otherAvatar.isNotEmpty
                  ? NetworkImage(otherAvatar)
                  : null,
              child: otherAvatar == null || otherAvatar.isEmpty
                  ? Text(
                      initials.isNotEmpty ? initials : 'U',
                      style: GoogleFonts.outfit(color: AppColors.primaryCyan, fontWeight: FontWeight.bold, fontSize: 13),
                    )
                  : null,
            ),
            title: Row(
              children: [
                Text(
                  name,
                  style: GoogleFonts.inter(fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 6),
                // Lock Icon for E2EE Parity
                const Icon(Icons.lock_rounded, color: AppColors.successGreen, size: 12),
              ],
            ),
            subtitle: Text(
              'Secure encrypted connection',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(fontSize: 11, color: AppColors.successGreen.withOpacity(0.8)),
            ),
            trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
            onTap: () {
              Navigator.pushNamed(
                context,
                '/chat',
                arguments: {
                  'isTeam': false,
                  'conversationId': dm['id'],
                  'chatName': name,
                  'recipientPublicKey': otherPublicKey,
                  'recipientId': otherId,
                },
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildFriendsTab() {
    final query = _searchController.text.toLowerCase();
    final filteredFriends = _friends.where((friend) => (friend['name'] ?? '').toLowerCase().contains(query)).toList();

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      children: [
        // Pending Friend Requests Header
        if (_pendingRequests.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Text(
              'PENDING REQUESTS (${_pendingRequests.length})',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.dangerRed),
            ),
          ),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _pendingRequests.length,
            itemBuilder: (context, index) {
              final req = _pendingRequests[index];
              // Request detail
              final sender = req['sender'] ?? {};
              final name = sender['name'] ?? 'Friend request';
              final friendshipId = req['id'];

              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                color: isDark ? AppColors.darkCard.withOpacity(0.6) : Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: AppColors.dangerRed.withOpacity(0.3))),
                child: ListTile(
                  title: Text(name, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13)),
                  subtitle: Text('wants to be friends', style: GoogleFonts.inter(fontSize: 11)),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.check_circle, color: AppColors.successGreen),
                        onPressed: () async {
                          await ApiService.respondToFriendRequest(friendshipId, 'accept');
                          _loadConversationsData();
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.cancel, color: AppColors.dangerRed),
                        onPressed: () async {
                          await ApiService.respondToFriendRequest(friendshipId, 'decline');
                          _loadConversationsData();
                        },
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 16),
        ],

        // Friends Header
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Text(
            'MY FRIENDS (${filteredFriends.length})',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 11, color: AppColors.darkTextSecondary),
          ),
        ),

        filteredFriends.isEmpty
            ? Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: Text(
                    'No friends found. Invite some by user ID!',
                    style: GoogleFonts.inter(color: AppColors.darkTextSecondary, fontSize: 13),
                  ),
                ),
              )
            : ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: filteredFriends.length,
                itemBuilder: (context, index) {
                  final friend = filteredFriends[index];
                  final name = friend['name'] ?? 'Unnamed User';
                  final initials = name.split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join('').toUpperCase();
                  final userUid = friend['user_id'] ?? 'ID: ${friend['id']}';

                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: isDark ? AppColors.darkBorder.withOpacity(0.5) : AppColors.lightBorder),
                    ),
                    color: isDark ? AppColors.darkCard : Colors.white,
                    child: ListTile(
                      leading: CircleAvatar(
                        radius: 18,
                        backgroundColor: AppColors.primaryCyan.withOpacity(0.2),
                        child: Text(initials, style: const TextStyle(fontSize: 11, color: AppColors.primaryCyan, fontWeight: FontWeight.bold)),
                      ),
                      title: Text(name, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
                      subtitle: Text(userUid, style: GoogleFonts.inter(fontSize: 11)),
                      trailing: Container(
                        decoration: BoxDecoration(
                          gradient: AppColors.primaryGradient,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                          ),
                          onPressed: () => _startDirectMessage(friend),
                          child: Text(
                            'Chat',
                            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.white),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
      ],
    );
  }

  Widget _buildEmptyState(IconData icon, String title, String subtitle) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 48,
              color: isDark ? AppColors.darkTextSecondary.withOpacity(0.5) : AppColors.lightTextSecondary.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                height: 1.4,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
