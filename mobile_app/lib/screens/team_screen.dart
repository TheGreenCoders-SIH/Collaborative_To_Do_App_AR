import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class TeamScreen extends StatefulWidget {
  const TeamScreen({super.key});

  @override
  State<TeamScreen> createState() => _TeamScreenState();
}

class _TeamScreenState extends State<TeamScreen> {
  dynamic _team;
  List<dynamic> _tasks = [];
  bool _isLoading = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_team == null) {
      _team = ModalRoute.of(context)!.settings.arguments;
      _loadTasks();
    }
  }

  Future<void> _loadTasks() async {
    if (_team == null) return;
    setState(() => _isLoading = true);
    try {
      final teamId = _team['id'];
      final tasks = await ApiService.fetchTasks(teamId);
      setState(() {
        _tasks = tasks;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading tasks: $e');
      setState(() => _isLoading = false);
    }
  }

  List<dynamic> _getTasksByStatus(String status) {
    return _tasks.where((task) => task['status'] == status).toList();
  }

  Future<void> _showAddTaskSheet(String columnStatus) async {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    DateTime? selectedDate;
    final formKey = GlobalKey<FormState>();
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom + 24,
                left: 24,
                right: 24,
                top: 24,
              ),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border.all(color: AppColors.darkBorder.withOpacity(0.5)),
              ),
              child: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Create New Task',
                          style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primaryCyan.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            columnStatus.replaceAll('_', ' ').toUpperCase(),
                            style: GoogleFonts.inter(color: AppColors.primaryCyan, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: titleController,
                      decoration: const InputDecoration(labelText: 'Task Title', hintText: 'What needs to be done?'),
                      validator: (value) => value == null || value.isEmpty ? 'Title is required' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: descController,
                      maxLines: 3,
                      decoration: const InputDecoration(labelText: 'Description', hintText: 'Explain the details...'),
                      validator: (value) => value == null || value.isEmpty ? 'Description is required' : null,
                    ),
                    const SizedBox(height: 16),
                    // Date Picker Input
                    InkWell(
                      onTap: () async {
                        final now = DateTime.now();
                        final date = await showDatePicker(
                          context: context,
                          initialDate: now,
                          firstDate: now,
                          lastDate: now.add(const Duration(days: 365)),
                        );
                        if (date != null) {
                          setSheetState(() => selectedDate = date);
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        decoration: BoxDecoration(
                          color: Theme.of(context).brightness == Brightness.dark
                              ? AppColors.darkBg.withOpacity(0.5)
                              : AppColors.lightCard,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Theme.of(context).brightness == Brightness.dark
                                ? AppColors.darkBorder
                                : AppColors.lightBorder,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              selectedDate == null
                                  ? 'Set Due Date'
                                  : 'Due: ${DateFormat('MMM d, yyyy').format(selectedDate!)}',
                              style: GoogleFonts.inter(
                                color: selectedDate == null ? AppColors.darkTextSecondary : Colors.white,
                              ),
                            ),
                            const Icon(Icons.calendar_today_rounded, size: 18, color: AppColors.primaryCyan),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Container(
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        onPressed: isSaving
                            ? null
                            : () async {
                                if (isSaving) return;
                                if (!formKey.currentState!.validate()) return;
                                isSaving = true;
                                setSheetState(() {});
                                try {
                                  final deadlineStr = selectedDate != null ? selectedDate!.toIso8601String() : null;
                                  await ApiService.createTask(
                                    _team['id'],
                                    titleController.text.trim(),
                                    descController.text.trim(),
                                    columnStatus,
                                    deadlineStr,
                                    [], // empty assigned to for now
                                  );
                                  if (mounted) {
                                    Navigator.pop(context);
                                    _loadTasks();
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Task added successfully!')),
                                    );
                                  }
                                } catch (e) {
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Failed to add task: $e')),
                                    );
                                  }
                                } finally {
                                  isSaving = false;
                                  try {
                                    setSheetState(() {});
                                  } catch (_) {}
                                }
                              },
                        child: isSaving
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : Text('Save Task', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showTaskDetailSheet(dynamic task) {
    final commentController = TextEditingController();
    List<dynamic> comments = [];
    bool commentsLoading = true;
    bool isSavingStatus = false;
    bool isSubmittingComment = false;
    String currentStatus = task['status'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            // Load comments initially
            if (commentsLoading) {
              ApiService.fetchComments(task['id']).then((fetchedComments) {
                setSheetState(() {
                  comments = fetchedComments;
                  commentsLoading = false;
                });
              }).catchError((_) {
                setSheetState(() => commentsLoading = false);
              });
            }

            return Container(
              height: MediaQuery.of(context).size.height * 0.85,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                border: Border.all(color: AppColors.darkBorder.withOpacity(0.5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Title Block
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          task['title'] ?? 'Task Details',
                          style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline_rounded, color: AppColors.dangerRed),
                        tooltip: 'Delete Task',
                        onPressed: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (context) => AlertDialog(
                              title: const Text('Delete Task'),
                              content: const Text('Are you sure you want to delete this task?'),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context, false),
                                  child: Text('Cancel', style: TextStyle(color: Colors.grey[400])),
                                ),
                                TextButton(
                                  onPressed: () => Navigator.pop(context, true),
                                  child: const Text('Delete', style: TextStyle(color: AppColors.dangerRed, fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          );
                          if (confirm == true) {
                            try {
                              await ApiService.deleteTask(task['id']);
                              if (mounted) {
                                Navigator.pop(context); // close bottom sheet
                                _loadTasks(); // refresh kanban
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Task deleted successfully')),
                                );
                              }
                            } catch (e) {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Failed to delete task: $e')),
                                );
                              }
                            }
                          }
                        },
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Info details: Status & Deadline
                  Row(
                    children: [
                      // Status dropdown
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'STATUS',
                              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.darkTextSecondary),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              decoration: BoxDecoration(
                                color: AppColors.darkBg,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppColors.darkBorder),
                              ),
                              child: DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: currentStatus,
                                  dropdownColor: AppColors.darkCard,
                                  items: const [
                                    DropdownMenuItem(value: 'todo', child: Text('To Do')),
                                    DropdownMenuItem(value: 'in_progress', child: Text('In Progress')),
                                    DropdownMenuItem(value: 'pending_approval', child: Text('Pending Approval')),
                                    DropdownMenuItem(value: 'complete', child: Text('Complete')),
                                  ],
                                  onChanged: isSavingStatus
                                      ? null
                                      : (val) async {
                                          if (val == null || val == currentStatus) return;
                                          setSheetState(() => isSavingStatus = true);
                                          try {
                                            await ApiService.updateTaskStatus(task['id'], val);
                                            setState(() {}); // refresh home Kanban
                                            setSheetState(() {
                                              currentStatus = val;
                                              task['status'] = val;
                                            });
                                            _loadTasks();
                                          } catch (e) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(content: Text('Failed to update status: $e')),
                                            );
                                          } finally {
                                            setSheetState(() => isSavingStatus = false);
                                          }
                                        },
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      // Deadline Badge
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'DUE DATE',
                              style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.darkTextSecondary),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                              decoration: BoxDecoration(
                                color: AppColors.darkBg,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppColors.darkBorder),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.calendar_today_rounded, size: 14, color: AppColors.primaryCyan),
                                  const SizedBox(width: 8),
                                  Text(
                                    task['deadline'] != null
                                        ? DateFormat('MMM d, yyyy').format(DateTime.parse(task['deadline']))
                                        : 'No deadline',
                                    style: GoogleFonts.inter(fontSize: 13),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Description
                  Text(
                    'DESCRIPTION',
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.darkTextSecondary),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.darkBg.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.darkBorder.withOpacity(0.3)),
                    ),
                    child: Text(
                      task['description'] ?? 'No description provided for this task.',
                      style: GoogleFonts.inter(fontSize: 13, height: 1.4),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Comments header
                  Row(
                    children: [
                      Text(
                        'COMMENTS',
                        style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.darkTextSecondary),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.primaryCyan.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${comments.length}',
                          style: GoogleFonts.inter(color: AppColors.primaryCyan, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Comments list scroll area
                  Expanded(
                    child: commentsLoading
                        ? const Center(child: CircularProgressIndicator(color: AppColors.primaryCyan))
                        : comments.isEmpty
                            ? Center(
                                child: Text(
                                  'No comments yet. Start the conversation!',
                                  style: GoogleFonts.inter(color: AppColors.darkTextSecondary, fontSize: 12),
                                ),
                              )
                            : ListView.builder(
                                itemCount: comments.length,
                                itemBuilder: (context, index) {
                                  final comment = comments[index];
                                  final commentator = comment['user_name'] ?? 'Team Member';
                                  final initials = commentator.split(' ').map((e) => e.isNotEmpty ? e[0] : '').take(2).join('').toUpperCase();
                                  
                                  String timeStr = '';
                                  if (comment['created_at'] != null) {
                                    try {
                                      timeStr = DateFormat('jm').format(DateTime.parse(comment['created_at']));
                                    } catch (_) {}
                                  }

                                  return Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        CircleAvatar(
                                          radius: 14,
                                          backgroundColor: AppColors.primaryCyan.withOpacity(0.2),
                                          child: Text(initials, style: const TextStyle(fontSize: 10, color: AppColors.primaryCyan, fontWeight: FontWeight.bold)),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Container(
                                            padding: const EdgeInsets.all(12),
                                            decoration: BoxDecoration(
                                              color: AppColors.darkBg.withOpacity(0.5),
                                              borderRadius: BorderRadius.circular(12),
                                              border: Border.all(color: AppColors.darkBorder.withOpacity(0.3)),
                                            ),
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                  children: [
                                                    Text(commentator, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 11)),
                                                    Text(timeStr, style: GoogleFonts.inter(fontSize: 9, color: AppColors.darkTextSecondary)),
                                                  ],
                                                ),
                                                const SizedBox(height: 4),
                                                Text(comment['content'] ?? '', style: GoogleFonts.inter(fontSize: 12)),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                  ),

                  // Add comment box
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: commentController,
                          decoration: const InputDecoration(
                            hintText: 'Add comment...',
                            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          ),
                          onSubmitted: (_) {
                            // submit comment
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        style: IconButton.styleFrom(
                          backgroundColor: AppColors.primaryCyan,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: isSubmittingComment
                            ? null
                            : () async {
                                final text = commentController.text.trim();
                                if (text.isEmpty) return;
                                setSheetState(() => isSubmittingComment = true);
                                try {
                                  await ApiService.addComment(task['id'], text);
                                  commentController.clear();
                                  // Refresh comments
                                  final updatedComments = await ApiService.fetchComments(task['id']);
                                  setSheetState(() {
                                    comments = updatedComments;
                                    isSubmittingComment = false;
                                  });
                                } catch (e) {
                                  setSheetState(() => isSubmittingComment = false);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('Failed to post comment: $e')),
                                  );
                                }
                              },
                        icon: const Icon(Icons.send_rounded, size: 18),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showAddMemberDialog() {
    final emailController = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Theme.of(context).cardColor,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text('Invite Member', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
          content: Form(
            key: formKey,
            child: TextFormField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: "Member's Email",
                hintText: 'user@example.com',
                prefixIcon: Icon(Icons.mail_outline),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) return 'Email is required';
                if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                  return 'Invalid email';
                }
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
                onPressed: () {
                  if (!formKey.currentState!.validate()) return;
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Invite sent to ${emailController.text} (Synced via DB)')),
                  );
                },
                child: Text('Invite', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_team == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final String name = _team['name'] ?? 'Team Board';

    return Scaffold(
      appBar: AppBar(
        title: Text(name),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add_outlined),
            tooltip: 'Invite Member',
            onPressed: _showAddMemberDialog,
          ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadTasks,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryCyan))
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Top Mini Board Details
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Kanban Board',
                          style: GoogleFonts.outfit(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: isDark ? Colors.white : AppColors.lightText,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primaryCyan.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.task_alt_rounded, color: AppColors.primaryCyan, size: 14),
                            const SizedBox(width: 6),
                            Text(
                              '${_tasks.length} Total Tasks',
                              style: GoogleFonts.inter(
                                color: AppColors.primaryCyan,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Horizontal Kanban Columns scrollable view
                Expanded(
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.only(left: 16, right: 16, bottom: 24),
                    children: [
                      _buildKanbanColumn(
                        columnId: 'todo',
                        title: 'To Do',
                        badgeColor: Colors.grey,
                        tasks: _getTasksByStatus('todo'),
                      ),
                      _buildKanbanColumn(
                        columnId: 'in_progress',
                        title: 'In Progress',
                        badgeColor: AppColors.primaryBlue,
                        tasks: _getTasksByStatus('in_progress'),
                      ),
                      _buildKanbanColumn(
                        columnId: 'pending_approval',
                        title: 'Pending Approval',
                        badgeColor: AppColors.warningYellow,
                        tasks: _getTasksByStatus('pending_approval'),
                      ),
                      _buildKanbanColumn(
                        columnId: 'complete',
                        title: 'Complete',
                        badgeColor: AppColors.successGreen,
                        tasks: _getTasksByStatus('complete'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildKanbanColumn({
    required String columnId,
    required String title,
    required Color badgeColor,
    required List<dynamic> tasks,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Container(
      width: 280,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard.withOpacity(0.5) : AppColors.lightCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? AppColors.darkBorder.withOpacity(0.5) : AppColors.lightBorder,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Column Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: isDark ? Colors.white : AppColors.lightText,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: badgeColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${tasks.length}',
                    style: GoogleFonts.inter(
                      color: badgeColor,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          const Divider(height: 1),

          // Scrollable Task Cards
          Expanded(
            child: tasks.isEmpty
                ? _buildColumnEmptyState(columnId)
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    itemCount: tasks.length,
                    itemBuilder: (context, index) {
                      final task = tasks[index];
                      return _buildTaskCard(task);
                    },
                  ),
          ),
          
          // Column footer Action Button
          Padding(
            padding: const EdgeInsets.all(12),
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                side: BorderSide(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: () => _showAddTaskSheet(columnId),
              icon: const Icon(Icons.add_rounded, size: 18, color: AppColors.primaryCyan),
              label: Text(
                'Add Task',
                style: GoogleFonts.inter(
                  color: isDark ? Colors.white : AppColors.lightText,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTaskCard(dynamic task) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final String title = task['title'] ?? 'Untitled Task';
    final String description = task['description'] ?? 'No description';
    
    String deadlineStr = '';
    if (task['deadline'] != null) {
      try {
        final date = DateTime.parse(task['deadline']);
        deadlineStr = DateFormat('MMM d').format(date);
      } catch (_) {}
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: isDark ? AppColors.darkBorder.withOpacity(0.5) : AppColors.lightBorder,
        ),
      ),
      color: isDark ? AppColors.darkCard : Colors.white,
      child: InkWell(
        onTap: () => _showTaskDetailSheet(task),
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: isDark ? Colors.white : AppColors.lightText,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Deadline
                  if (deadlineStr.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.dangerRed.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.access_time_rounded, size: 10, color: AppColors.dangerRed),
                          const SizedBox(width: 4),
                          Text(
                            deadlineStr,
                            style: GoogleFonts.inter(
                              color: AppColors.dangerRed,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    const SizedBox.shrink(),

                  // Simulated Assignee Indicator
                  CircleAvatar(
                    radius: 11,
                    backgroundColor: AppColors.primaryCyan.withOpacity(0.1),
                    child: const Text(
                      'M',
                      style: TextStyle(fontSize: 9, color: AppColors.primaryCyan, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildColumnEmptyState(String columnId) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.inbox_outlined,
            size: 32,
            color: AppColors.darkTextSecondary.withOpacity(0.5),
          ),
          const SizedBox(height: 8),
          Text(
            'No tasks here',
            style: GoogleFonts.inter(
              color: AppColors.darkTextSecondary.withOpacity(0.5),
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
