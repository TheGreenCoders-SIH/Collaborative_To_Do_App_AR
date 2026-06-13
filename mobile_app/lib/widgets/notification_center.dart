import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class NotificationCenter extends StatefulWidget {
  const NotificationCenter({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const FractionallySizedBox(
        heightFactor: 0.75,
        child: NotificationCenter(),
      ),
    );
  }

  @override
  State<NotificationCenter> createState() => _NotificationCenterState();
}

class _NotificationCenterState extends State<NotificationCenter> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    try {
      final list = await ApiService.fetchNotifications();
      setState(() {
        _notifications = list;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading notifications: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _markRead(int id) async {
    try {
      await ApiService.markNotificationRead(id);
      setState(() {
        _notifications = _notifications.map((n) {
          if (n['id'] == id) {
            return {...n, 'read': true};
          }
          return n;
        }).toList();
      });
    } catch (e) {
      print('Error marking notification read: $e');
    }
  }

  Future<void> _markAllRead() async {
    try {
      await ApiService.markAllNotificationsRead();
      setState(() {
        _notifications = _notifications.map((n) => {...n, 'read': true}).toList();
      });
    } catch (e) {
      print('Error marking all read: $e');
    }
  }

  Future<void> _deleteNotification(int id) async {
    try {
      await ApiService.deleteNotification(id);
      setState(() {
        _notifications = _notifications.where((n) => n['id'] != id).toList();
      });
    } catch (e) {
      print('Error deleting notification: $e');
    }
  }

  String _formatTimeAgo(String dateStr) {
    try {
      final date = DateTime.parse(dateStr).toLocal();
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
    } catch (_) {
      return '';
    }
  }

  Widget _getIcon(String type) {
    IconData iconData;
    Color iconColor;
    Color bgColor;

    switch (type) {
      case 'dm':
      case 'team_message':
        iconData = Icons.chat_bubble_outline_rounded;
        iconColor = AppColors.primaryCyan;
        bgColor = AppColors.primaryCyan.withOpacity(0.1);
        break;
      case 'friend_request':
      case 'friend_accept':
        iconData = Icons.person_add_outlined;
        iconColor = AppColors.accentViolet;
        bgColor = AppColors.accentViolet.withOpacity(0.1);
        break;
      case 'task_assigned':
      case 'task_status':
        iconData = Icons.assignment_outlined;
        iconColor = AppColors.warningYellow;
        bgColor = AppColors.warningYellow.withOpacity(0.1);
        break;
      case 'task_reminder':
        iconData = Icons.notification_important_outlined;
        iconColor = AppColors.dangerRed;
        bgColor = AppColors.dangerRed.withOpacity(0.1);
        break;
      default:
        iconData = Icons.notifications_none_rounded;
        iconColor = AppColors.primaryBlue;
        bgColor = AppColors.primaryBlue.withOpacity(0.1);
    }

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Icon(iconData, color: iconColor, size: 20),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final unreadCount = _notifications.where((n) => n['read'] == false).length;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkBg : Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
        border: Border.all(
          color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          width: 1,
        ),
      ),
      child: Column(
        children: [
          // Drag Handle
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Notifications',
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (unreadCount > 0)
                      Text(
                        '$unreadCount unread notifications',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppColors.primaryCyan,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                  ],
                ),
                if (unreadCount > 0)
                  TextButton(
                    onPressed: _markAllRead,
                    child: Text(
                      'Mark all read',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryCyan,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Divider(height: 1),

          // Notification List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primaryCyan))
                : _notifications.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.notifications_off_outlined,
                              size: 48,
                              color: isDark ? AppColors.darkTextSecondary.withOpacity(0.5) : AppColors.lightTextSecondary.withOpacity(0.5),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'All caught up!',
                              style: GoogleFonts.outfit(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'No new notifications to display.',
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        itemCount: _notifications.length,
                        itemBuilder: (context, index) {
                          final n = _notifications[index];
                          final isUnread = n['read'] == false;

                          return Dismissible(
                            key: Key('notif-${n['id']}'),
                            direction: DismissDirection.endToStart,
                            background: Container(
                              alignment: Alignment.centerRight,
                              padding: const EdgeInsets.only(right: 20),
                              color: AppColors.dangerRed,
                              child: const Icon(Icons.delete_outline_rounded, color: Colors.white),
                            ),
                            onDismissed: (_) => _deleteNotification(n['id']),
                            child: InkWell(
                              onTap: () {
                                if (isUnread) {
                                  _markRead(n['id']);
                                }
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                decoration: BoxDecoration(
                                  color: isUnread
                                      ? (isDark ? AppColors.darkCard.withOpacity(0.4) : AppColors.primaryCyan.withOpacity(0.04))
                                      : Colors.transparent,
                                  border: Border(
                                    bottom: BorderSide(
                                      color: isDark ? AppColors.darkBorder.withOpacity(0.5) : AppColors.lightBorder,
                                      width: 0.5,
                                    ),
                                  ),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    _getIcon(n['type'] ?? 'info'),
                                    const SizedBox(width: 14),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            n['title'] ?? '',
                                            style: GoogleFonts.inter(
                                              fontSize: 13.5,
                                              fontWeight: isUnread ? FontWeight.bold : FontWeight.normal,
                                              color: isUnread
                                                  ? (isDark ? Colors.white : AppColors.lightText)
                                                  : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            n['message'] ?? '',
                                            style: GoogleFonts.inter(
                                              fontSize: 12.5,
                                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                              height: 1.3,
                                            ),
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            _formatTimeAgo(n['created_at']),
                                            style: GoogleFonts.inter(
                                              fontSize: 10,
                                              color: isDark
                                                  ? AppColors.darkTextSecondary.withOpacity(0.6)
                                                  : AppColors.lightTextSecondary.withOpacity(0.6),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (isUnread)
                                      Padding(
                                        padding: const EdgeInsets.only(left: 8, top: 4),
                                        child: Container(
                                          width: 8,
                                          height: 8,
                                          decoration: const BoxDecoration(
                                            color: AppColors.primaryCyan,
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
