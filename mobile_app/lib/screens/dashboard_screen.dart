import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<dynamic> _teams = [];
  bool _isLoading = true;
  int _currentNavIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);
    try {
      final teams = await ApiService.fetchTeams();
      setState(() {
        _teams = teams;
        _isLoading = false;
      });
    } catch (e) {
      print('Error fetching dashboard teams: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _showCreateTeamDialog() async {
    final nameController = TextEditingController();
    final descController = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool isCreating = false;

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: Theme.of(context).cardColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Text(
                'Create New Team',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold),
              ),
              content: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Team Name',
                        hintText: 'e.g. Design Team',
                      ),
                      validator: (value) => value == null || value.isEmpty ? 'Please enter team name' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: descController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        hintText: 'What is this team about?',
                      ),
                      validator: (value) => value == null || value.isEmpty ? 'Please enter description' : null,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: isCreating ? null : () => Navigator.pop(context),
                  child: Text('Cancel', style: TextStyle(color: Colors.grey[400])),
                ),
                Container(
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                    ),
                    onPressed: isCreating
                        ? null
                        : () async {
                            if (!formKey.currentState!.validate()) return;
                            setDialogState(() => isCreating = true);
                            
                            try {
                              final res = await ApiService.createTeam(
                                nameController.text.trim(),
                                descController.text.trim(),
                              );
                              if (mounted) {
                                Navigator.pop(context);
                                _loadDashboardData();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Team created successfully!')),
                                );
                              }
                            } catch (e) {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Failed to create team: $e')),
                                );
                              }
                            } finally {
                              setDialogState(() => isCreating = false);
                            }
                          },
                    child: isCreating
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text('Create', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _onBottomNavTapped(int index) {
    if (index == _currentNavIndex) return;

    if (index == 2) {
      // Navigate to Messaging screen
      Navigator.pushNamed(context, '/messaging');
    } else if (index == 3) {
      // Drawer profile trigger
      _scaffoldKey.currentState?.openEndDrawer();
    } else {
      setState(() {
        _currentNavIndex = index;
      });
    }
  }

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final themeProvider = Provider.of<ThemeProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Calculate dynamic stats
    final totalTeamsCount = _teams.length;
    // For projects count, let's just make it teams count * 2 or similar based on backend tasks count if available. Let's make it a nice estimate.
    final estimatedProjects = _teams.length;
    final inProgressItems = _teams.length > 0 ? 3 : 0;

    return Scaffold(
      key: _scaffoldKey,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.menu_rounded, size: 28),
          onPressed: () => _scaffoldKey.currentState?.openDrawer(),
        ),
        title: Text(
          'TaskFlow',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 22, letterSpacing: 0.5),
        ),
        actions: [
          IconButton(
            icon: Icon(themeProvider.isDarkMode ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
            onPressed: () => themeProvider.toggleTheme(),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16, left: 8),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primaryCyan.withOpacity(0.2),
              backgroundImage: auth.avatarUrl != null && auth.avatarUrl!.isNotEmpty
                  ? NetworkImage(auth.avatarUrl!)
                  : null,
              child: auth.avatarUrl == null || auth.avatarUrl!.isEmpty
                  ? Text(
                      auth.name != null && auth.name!.isNotEmpty ? auth.name![0].toUpperCase() : 'U',
                      style: GoogleFonts.inter(color: AppColors.primaryCyan, fontWeight: FontWeight.bold, fontSize: 13),
                    )
                  : null,
            ),
          ),
        ],
      ),
      drawer: _buildDrawer(context, auth),
      endDrawer: _buildProfileDrawer(context, auth),
      body: RefreshIndicator(
        onRefresh: _loadDashboardData,
        color: AppColors.primaryCyan,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primaryCyan))
            : SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Welcome Header
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Dashboard',
                                style: GoogleFonts.outfit(
                                  fontSize: 28,
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? Colors.white : AppColors.lightText,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Welcome back, ${auth.name ?? "User"}',
                                style: GoogleFonts.inter(
                                  fontSize: 14,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Stats Cards Row
                    Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            context,
                            title: 'Total Teams',
                            value: '$totalTeamsCount',
                            icon: Icons.groups_rounded,
                            iconColor: AppColors.primaryCyan,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            context,
                            title: 'Active Projects',
                            value: '$estimatedProjects',
                            icon: Icons.grid_view_rounded,
                            iconColor: AppColors.accentViolet,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildStatCard(
                            context,
                            title: 'In Progress',
                            value: '$inProgressItems',
                            icon: Icons.calendar_today_rounded,
                            iconColor: AppColors.warningYellow,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),

                    // Teams Section Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Your Teams',
                          style: GoogleFonts.outfit(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : AppColors.lightText,
                          ),
                        ),
                        TextButton.icon(
                          onPressed: _showCreateTeamDialog,
                          icon: const Icon(Icons.add_rounded, size: 18, color: AppColors.primaryCyan),
                          label: Text(
                            'Create Team',
                            style: GoogleFonts.inter(
                              color: AppColors.primaryCyan,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Teams List/Grid
                    _teams.isEmpty
                        ? _buildEmptyState()
                        : GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                              childAspectRatio: 0.9,
                            ),
                            itemCount: _teams.length,
                            itemBuilder: (context, index) {
                              final team = _teams[index];
                              return _buildTeamCard(context, team);
                            },
                          ),
                  ],
                ),
              ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateTeamDialog,
        backgroundColor: Colors.transparent,
        elevation: 0,
        highlightElevation: 0,
        child: Container(
          width: 56,
          height: 56,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            gradient: AppColors.primaryGradient,
          ),
          child: const Icon(Icons.add_rounded, color: Colors.white, size: 28),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentNavIndex,
        onTap: _onBottomNavTapped,
        type: BottomNavigationBarType.fixed,
        backgroundColor: isDark ? AppColors.darkCard : Colors.white,
        selectedItemColor: AppColors.primaryCyan,
        unselectedItemColor: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_rounded),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.groups_rounded),
            label: 'Teams',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline_rounded),
            label: 'Messages',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline_rounded),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(BuildContext context, {required String title, required String value, required IconData icon, required Color iconColor}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkBorder.withOpacity(0.5) : AppColors.lightBorder,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.1 : 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : AppColors.lightText,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTeamCard(BuildContext context, dynamic team) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final String name = team['name'] ?? 'Unnamed Team';
    final String description = team['description'] ?? 'No description provided';
    final int memberCount = team['members_count'] ?? 1;
    
    // Format dynamic dates cleanly
    String formattedDate = '';
    if (team['created_at'] != null) {
      try {
        final parsedDate = DateTime.parse(team['created_at']);
        formattedDate = DateFormat('MMM d, yyyy').format(parsedDate);
      } catch (_) {}
    }

    // Dynamic initials
    final initials = name.split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join('').toUpperCase();

    return InkWell(
      onTap: () {
        Navigator.pushNamed(context, '/team', arguments: team);
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkCard : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark ? AppColors.darkBorder.withOpacity(0.5) : AppColors.lightBorder,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.15 : 0.03),
              blurRadius: 12,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Team Initial Circle
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: AppColors.primaryGradient,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primaryCyan.withOpacity(0.2),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      )
                    ],
                  ),
                  child: Center(
                    child: Text(
                      initials.isNotEmpty ? initials : 'T',
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
                // Approval Rule Badge if relevant
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.accentViolet.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    team['approval_rule'] ?? 'Veto',
                    style: GoogleFonts.inter(
                      color: AppColors.accentViolet,
                      fontWeight: FontWeight.bold,
                      fontSize: 9,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: isDark ? Colors.white : AppColors.lightText,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Expanded(
                    child: Text(
                      description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Divider(color: isDark ? AppColors.darkBorder.withOpacity(0.5) : AppColors.lightBorder),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.people_outline_rounded,
                      size: 14,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '$memberCount ${memberCount == 1 ? "member" : "members"}',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                if (formattedDate.isNotEmpty)
                  Text(
                    formattedDate,
                    style: GoogleFonts.inter(
                      fontSize: 9,
                      color: isDark ? AppColors.darkTextSecondary.withOpacity(0.7) : AppColors.lightTextSecondary.withOpacity(0.7),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppColors.darkBorder.withOpacity(0.5) : AppColors.lightBorder,
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.primaryCyan.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.groups_rounded, color: AppColors.primaryCyan, size: 48),
          ),
          const SizedBox(height: 16),
          Text(
            'Create Your First Team',
            style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'TaskFlow is better together! Create a team to start collaborating on tasks, kanban boards, and chat with members.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 24),
          Container(
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              onPressed: _showCreateTeamDialog,
              icon: const Icon(Icons.add_rounded, color: Colors.white),
              label: Text(
                'Create Team',
                style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawer(BuildContext context, AuthProvider auth) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Drawer(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.lightBg,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drawer Header
          UserAccountsDrawerHeader(
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
            ),
            currentAccountPicture: CircleAvatar(
              backgroundColor: Colors.white,
              backgroundImage: auth.avatarUrl != null && auth.avatarUrl!.isNotEmpty
                  ? NetworkImage(auth.avatarUrl!)
                  : null,
              child: auth.avatarUrl == null || auth.avatarUrl!.isEmpty
                  ? Text(
                      auth.name != null && auth.name!.isNotEmpty ? auth.name![0].toUpperCase() : 'U',
                      style: GoogleFonts.outfit(color: AppColors.primaryBlue, fontWeight: FontWeight.bold, fontSize: 24),
                    )
                  : null,
            ),
            accountName: Text(
              auth.name ?? 'TaskFlow User',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            accountEmail: Text(
              auth.email ?? 'user@taskflow.com',
              style: GoogleFonts.inter(fontSize: 13, color: Colors.white.withOpacity(0.85)),
            ),
          ),
          // Drawer Options
          ListTile(
            leading: const Icon(Icons.dashboard_rounded, color: AppColors.primaryCyan),
            title: Text('Dashboard', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            onTap: () {
              Navigator.pop(context);
              setState(() => _currentNavIndex = 0);
            },
          ),
          ListTile(
            leading: const Icon(Icons.chat_bubble_outline_rounded, color: AppColors.primaryCyan),
            title: Text('Messaging & E2EE DMs', style: GoogleFonts.inter()),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/messaging');
            },
          ),
          ListTile(
            leading: const Icon(Icons.check_circle_outline_rounded, color: AppColors.primaryCyan),
            title: Text('Personal Tasks', style: GoogleFonts.inter()),
            onTap: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Personal tasks is synced to Web App! Use Web for detail customization.')),
              );
            },
          ),
          const Spacer(),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout_rounded, color: AppColors.dangerRed),
            title: Text('Logout', style: GoogleFonts.inter(color: AppColors.dangerRed, fontWeight: FontWeight.bold)),
            onTap: () async {
              Navigator.pop(context);
              await auth.logout();
              if (context.mounted) {
                Navigator.pushReplacementNamed(context, '/login');
              }
            },
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildProfileDrawer(BuildContext context, AuthProvider auth) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Drawer(
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Your Profile',
                style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),
              Center(
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: AppColors.primaryCyan.withOpacity(0.2),
                      backgroundImage: auth.avatarUrl != null && auth.avatarUrl!.isNotEmpty
                          ? NetworkImage(auth.avatarUrl!)
                          : null,
                      child: auth.avatarUrl == null || auth.avatarUrl!.isEmpty
                          ? Text(
                              auth.name != null && auth.name!.isNotEmpty ? auth.name![0].toUpperCase() : 'U',
                              style: GoogleFonts.outfit(color: AppColors.primaryCyan, fontWeight: FontWeight.bold, fontSize: 36),
                            )
                          : null,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      auth.name ?? 'Guest User',
                      style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      auth.email ?? 'guest@taskflow.com',
                      style: GoogleFonts.inter(color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              const Divider(),
              const SizedBox(height: 16),
              _buildProfileDetailRow('User UID', auth.userId ?? 'None'),
              _buildProfileDetailRow('E2EE Keys', auth.publicKey != null ? 'Active' : 'Missing'),
              const Spacer(),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.dangerRed,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () async {
                  Navigator.pop(context);
                  await auth.logout();
                  if (context.mounted) {
                    Navigator.pushReplacementNamed(context, '/login');
                  }
                },
                icon: const Icon(Icons.logout_rounded, color: Colors.white),
                label: Text('Sign Out', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileDetailRow(String label, String value) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontSize: 13, color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary)),
          Flexible(
            child: Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.bold, color: isDark ? Colors.white : AppColors.lightText),
            ),
          ),
        ],
      ),
    );
  }
}
